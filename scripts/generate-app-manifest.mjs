// Generates public/app-content/manifest.json for the Twilightscapes apps
// from the contents of public/app-content/photos/.
//
//   photos/<folder>/            -> one collection per folder
//   photos/<folder>/_meta.json  -> optional { title, subtitle, kind }
//                                  ("kind": "daily" = Photo of the Day pool)
//   <name>-vertical.<ext>       -> wallpaperFile for <name>.<ext>, not its own photo
//   NN- filename prefix         -> ordering only, stripped from titles
//   a year (19xx/20xx) in the filename is used as the photo's year
//
// Hand-curated collections in public/app-content/manifest-extra.json are
// merged in first (photo paths there are relative to the site root).
// Runs automatically at the start of `pnpm run build`.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Folder roots scanned for collections. Files are referenced in place —
// nothing is copied. urlPrefix is the site-root-relative path segment.
const ROOTS = [
  { dir: 'public/app-content/photos', urlPrefix: 'app-content/photos' },
  { dir: 'public/images/photos', urlPrefix: 'images/photos' },
];
const EXTRA_FILE = 'public/app-content/manifest-extra.json';
const OUT_FILE = 'public/app-content/manifest.json';
const BASE_URL = 'https://twilightscapes.com/';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.heic', '.webp']);

function titleize(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function photoTitle(filename) {
  let name = filename.replace(/\.[^.]+$/, '');       // extension
  name = name.replace(/^\d+[-_. ]+/, '');            // ordering prefix
  name = name.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
  return name;
}

function yearIn(text) {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

async function buildCollections({ dir, urlPrefix }) {
  if (!existsSync(dir)) return [];
  const collections = [];
  // Folders sharing a _meta.json "merge" value combine into one collection
  // (e.g. the numbered dump galleries fold into a single Archive).
  const merged = new Map();
  const folders = (await readdir(dir, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const folder of folders) {
    const folderPath = path.join(dir, folder);
    let meta = {};
    if (existsSync(path.join(folderPath, '_meta.json'))) {
      try {
        meta = JSON.parse(await readFile(path.join(folderPath, '_meta.json'), 'utf8'));
      } catch {
        console.warn(`⚠ ${folder}/_meta.json is not valid JSON — ignoring it`);
      }
    }
    if (meta.exclude) continue;

    // Generated/hand-edited captions (see generate-alt-text.mjs).
    let folderCaptions = {};
    if (existsSync(path.join(folderPath, '_captions.json'))) {
      try {
        folderCaptions = JSON.parse(await readFile(path.join(folderPath, '_captions.json'), 'utf8'));
      } catch {
        console.warn(`⚠ ${folder}/_captions.json is not valid JSON — ignoring it`);
      }
    }

    const allEntries = await readdir(folderPath);
    const files = allEntries
      .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()) && !f.startsWith('_'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    // Narration sidecars: night139.m4a next to night139.jpg.
    const AUDIO_EXTS = new Set(['.m4a', '.mp3', '.aac']);
    const audioByStem = new Map();
    for (const f of allEntries) {
      if (AUDIO_EXTS.has(path.extname(f).toLowerCase())) {
        audioByStem.set(f.replace(/\.[^.]+$/, ''), f);
      }
    }

    const verticals = new Map(); // base name -> vertical filename
    const regulars = [];
    const seenStems = new Set();
    for (const file of files) {
      const stem = file.replace(/\.[^.]+$/, '');
      if (stem.endsWith('-vertical')) {
        verticals.set(stem.slice(0, -'-vertical'.length), file);
      } else if (!seenStems.has(stem)) {
        // Same image in two formats (e.g. .jpg + .jpeg) counts once.
        seenStems.add(stem);
        regulars.push(file);
      }
    }

    const photos = regulars.map((file) => {
      const stem = file.replace(/\.[^.]+$/, '');
      const generated = folderCaptions[stem];
      const photo = {
        id: `${urlPrefix}/${folder}/${stem}`,
        file: `${urlPrefix}/${folder}/${file}`,
        title: generated?.title || photoTitle(file),
      };
      if (generated?.description) photo.caption = generated.description;
      const vertical = verticals.get(stem);
      if (vertical) photo.wallpaperFile = `${urlPrefix}/${folder}/${vertical}`;
      const audio = audioByStem.get(stem);
      if (audio) photo.audio = `${urlPrefix}/${folder}/${audio}`;
      const year = yearIn(file) ?? yearIn(folder);
      if (year) photo.year = year;
      return photo;
    });

    if (photos.length === 0) continue;

    if (meta.merge) {
      const key = String(meta.merge);
      if (!merged.has(key)) {
        merged.set(key, {
          id: key,
          title: meta.title ?? titleize(key),
          photos: [],
          ...(meta.subtitle ? { subtitle: meta.subtitle } : {}),
        });
      }
      merged.get(key).photos.push(...photos);
      continue;
    }

    const collection = {
      id: folder,
      title: meta.title ?? titleize(folder),
      photos,
    };
    if (meta.subtitle) collection.subtitle = meta.subtitle;
    if (meta.kind) collection.kind = meta.kind;
    collections.push(collection);
  }
  collections.push(...merged.values());
  return collections;
}

let extra = [];
if (existsSync(EXTRA_FILE)) {
  try {
    extra = JSON.parse(await readFile(EXTRA_FILE, 'utf8')).collections ?? [];
  } catch {
    console.warn('⚠ manifest-extra.json is not valid JSON — ignoring it');
  }
}

const generated = [];
for (const root of ROOTS) {
  generated.push(...await buildCollections(root));
}
const manifest = { baseURL: BASE_URL, collections: [...extra, ...generated] };
await writeFile(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `✓ app manifest: ${extra.length} curated + ${generated.length} generated collection(s), ` +
  `${manifest.collections.reduce((n, c) => n + c.photos.length, 0)} photo(s)`
);

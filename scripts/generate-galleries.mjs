// One-time importer: creates src/content/galleries/<slug>/index.md for each
// collection in public/app-content/manifest.json (run the manifest generator
// first). Skips Photo-of-the-Day pools and curated app-only collections.
// Existing gallery folders are left untouched, so it's safe to re-run after
// adding a new photo folder. Galleries are editable in /admin afterward.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const MANIFEST = 'public/app-content/manifest.json';
const OUT_DIR = 'src/content/galleries';
// Collections that exist only for the apps (spotlights, pools) — not site galleries.
const SKIP_IDS = new Set(['highlight']);

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const yamlStr = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
const collections = manifest.collections.filter(
  (c) => c.kind !== 'daily' && !SKIP_IDS.has(c.id) && c.photos.length > 0
);

let created = 0;
// Descending pubDate offsets keep list order = manifest order.
let order = collections.length;
for (const c of collections) {
  const slug = slugify(c.title);
  const dir = path.join(OUT_DIR, slug);
  if (existsSync(dir)) { order--; continue; }
  await mkdir(dir, { recursive: true });

  const date = new Date(Date.UTC(2026, 0, 1 + order--)).toISOString();
  const photos = c.photos
    .filter((p) => p.file && !p.file.startsWith('http'))
    .map((p) => {
      const lines = [`  - src: ${yamlStr('/' + p.file)}`, `    alt: ${yamlStr(p.title || c.title)}`];
      if (p.caption) lines.push(`    caption: ${yamlStr(p.caption)}`);
      return lines.join('\n');
    })
    .join('\n');

  const fm = [
    '---',
    `title: ${yamlStr(c.title)}`,
    ...(c.subtitle ? [`description: ${yamlStr(c.subtitle)}`] : []),
    `pubDate: ${date}`,
    'draft: false',
    `coverImage: ${yamlStr('/' + c.photos[0].file)}`,
    'tags: []',
    'slideshowStyle: fade',
    'slideshowInterval: 6',
    'photos:',
    photos,
    '---',
    '',
  ].join('\n');

  await writeFile(path.join(dir, 'index.md'), fm);
  created++;
}
console.log(`✓ galleries: ${created} created, ${collections.length - created} already existed`);

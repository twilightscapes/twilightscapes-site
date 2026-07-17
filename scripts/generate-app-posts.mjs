// Generates public/app-content/posts.json for the Twilightscapes apps from
// src/content/posts/*/index.md frontmatter. Drafts and private posts are
// skipped; newest first. The apps show the most recent few.
// Runs at the start of `npm run build`.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const POSTS_DIR = 'src/content/posts';
const OUT_FILE = 'public/app-content/posts.json';
const SITE = 'https://twilightscapes.com';

function isoDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function absolute(p) {
  if (!p) return null;
  return p.startsWith('http') ? p : SITE + (p.startsWith('/') ? p : `/${p}`);
}

// Only reference covers that actually exist in public/ — stale frontmatter
// paths otherwise become 404s in the apps.
function existingCover(p) {
  if (!p || p.startsWith('http')) return absolute(p);
  return existsSync(path.join('public', p.replace(/^\//, ''))) ? absolute(p) : null;
}

function youtubeID(url) {
  const m = url?.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{6,})/);
  return m?.[1] ?? null;
}

// First YouTube link in the post body, if any.
function youtubeIn(body) {
  const m = body.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)[\w-]{6,}[^\s)"'<>\]]*/);
  return m ? m[0] : null;
}

// Best available YouTube thumbnail (maxres isn't generated for every video).
async function youtubeThumb(url) {
  const id = youtubeID(url);
  if (!id) return null;
  const maxres = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  try {
    const res = await fetch(maxres, { method: 'HEAD' });
    if (res.ok) return maxres;
  } catch { /* fall through */ }
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

const posts = [];
if (existsSync(POSTS_DIR)) {
  for (const slug of (await readdir(POSTS_DIR, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)) {
    const file = ['index.md', 'index.mdx']
      .map((f) => path.join(POSTS_DIR, slug, f))
      .find(existsSync);
    if (!file) continue;

    const raw = await readFile(file, 'utf8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) continue;

    let fm;
    try {
      fm = parse(match[1]);
    } catch {
      console.warn(`⚠ ${slug}: unparseable frontmatter — skipping`);
      continue;
    }
    if (fm.draft || fm.visibility === 'private') continue;

    const youtube = youtubeIn(match[2]);
    let cover = existingCover(fm.image);
    if (!cover && youtube) cover = await youtubeThumb(youtube);

    posts.push({
      id: slug,
      title: fm.title ?? slug,
      description: fm.description ?? null,
      date: isoDate(fm.pubDate),
      url: `${SITE}/posts/${slug}/`,
      cover,
      youtube,
    });
  }
}

posts.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
await writeFile(OUT_FILE, JSON.stringify({ posts }, null, 2) + '\n');
console.log(`✓ posts.json: ${posts.length} post(s), newest: ${posts[0]?.title ?? 'none'}`);

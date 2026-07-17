// Generates public/app-content/learn.json (Night School lessons) from
// src/content/learn/*.md frontmatter + markdown body. Runs at build time.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const LEARN_DIR = 'src/content/learn';
const OUT_FILE = 'public/app-content/learn.json';
const SITE = 'https://twilightscapes.com';

function absolute(p) {
  if (!p) return null;
  if (p.startsWith('http')) return encodeURI(p);
  return encodeURI(SITE + (p.startsWith('/') ? p : `/${p}`));
}

const lessons = [];
if (existsSync(LEARN_DIR)) {
  for (const file of (await readdir(LEARN_DIR)).filter((f) => f.endsWith('.md')).sort()) {
    const raw = await readFile(path.join(LEARN_DIR, file), 'utf8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) continue;

    let fm;
    try { fm = parse(match[1]); } catch {
      console.warn(`⚠ ${file}: unparseable frontmatter — skipping`);
      continue;
    }
    if (fm.draft) continue;

    const lesson = {
      id: file.replace(/\.md$/, ''),
      order: fm.order ?? null,
      title: fm.title ?? file,
      summary: fm.summary ?? null,
      hero: absolute(fm.hero),
      youtube: fm.youtube ?? null,
      body: match[2].trim() || null,
    };
    if (fm.recipe) {
      lesson.recipe = {
        iso: fm.recipe.iso ?? null,
        shutterSeconds: fm.recipe.shutterSeconds ?? null,
        aperture: fm.recipe.aperture ?? null,
        note: fm.recipe.note ?? null,
      };
    }
    lessons.push(lesson);
  }
}

lessons.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
await writeFile(OUT_FILE, JSON.stringify({ lessons }, null, 2) + '\n');
console.log(`✓ learn.json: ${lessons.length} lesson(s)`);

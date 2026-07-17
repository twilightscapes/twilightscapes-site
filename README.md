# twilightscapes.com

The Twilightscapes site — night photography galleries plus the content
backend for the **Twilightscapes apps** (Apple TV, iPhone/iPad, Apple Watch).

Built on the [Pirate Social](https://github.com/piratewebsite/piratesocial)
template (Astro 6 + Tailwind 4 + Preact + Sveltia CMS). The template repo is
wired up as the `upstream` git remote; generic fixes belong there, not here —
see [UPSTREAM-NOTES.md](UPSTREAM-NOTES.md).

## The app-content pipeline

The shipping apps fetch three JSON endpoints from this site (see
`App/Shared/RemoteContent.swift` in the twilightscapes-app repo):

- `/app-content/manifest.json` — photo collections, generated from
  `public/images/photos/<Folder>/` at build time. Folder name = collection
  title, `NN-` prefixes control order, `<name>-vertical.jpg` becomes the
  wallpaper crop, `_meta.json` sets title/subtitle/`"kind": "daily"`
  (Photo of the Day pool) / `"merge"` / `"exclude"`, `_captions.json`
  supplies titles + captions, audio sidecars (`night139.m4a`) become
  narration. Hand-curated collections merge in from
  `public/app-content/manifest-extra.json`.
- `/app-content/posts.json` — generated from `src/content/posts/`.
- `/app-content/learn.json` — Night School lessons, generated from
  `src/content/learn/` (editable in /admin under "Night School").

**Publishing photos is folder-based: drop exported JPEGs into a folder under
`public/images/photos/`, push, done.** The apps pick up new collections
without an app update. Generators run automatically at the start of
`npm run build` (or run `npm run app-content` alone).

`scripts/generate-galleries.mjs` is a one-time importer that turns manifest
collections into site gallery entries (`src/content/galleries/`); it skips
folders that already have a gallery, so it's safe to re-run after adding a
new photo folder.

## Develop

```
npm install
npm run dev        # http://localhost:4321
npm run build      # generators + astro build + dist/
```

## Cutover checklist (replacing twilight-astro on Netlify)

1. Push this repo to GitHub.
2. Netlify: point the twilightscapes.com site at this repo
   (build command `npm run build`, publish `dist` — already in netlify.toml).
3. If the GitHub repo isn't `twilightscapes/twilightscapes-site`, update
   `backend.repo` in `public/admin/config.yml`.
4. Verify after deploy: `/app-content/manifest.json`, `/app-content/posts.json`,
   `/app-content/learn.json`, and a photo URL — the live apps depend on them.
5. `support@twilightscapes.com` is referenced on `/support` — create the
   alias or swap in the address you actually use.

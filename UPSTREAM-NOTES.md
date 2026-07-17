# Template changes to upstream to piratewebsite/piratesocial

This site is built on the Pirate Social template. Changes made here fall into
two buckets: generic template fixes (upstream these) and Twilightscapes-specific
customizations (do NOT upstream).

## Upstream these (generic fixes)

1. **Missing `/galleries` index page** — the default nav (`labels.json`
   `navItems`) links to `/galleries`, but the template only ships
   `src/pages/galleries/[slug].astro`, so the link 404s on every fresh
   install. Fixed by adding `src/pages/galleries/index.astro` (card grid
   modeled on `posts/index.astro`, uses `labels.galleries.heading`).
   → Already committed on branch `fix/galleries-index-page` in
   `~/Sites/piratesocial` — push and open a PR when ready.

2. **HeroBlock: optional `logoImage` / `logoAlt` props** — renders a logo
   image in place of the heading (heading becomes an sr-only `<h1>` for
   SEO/accessibility). Lets sites drop an (animated) SVG wordmark into the
   hero. Generic; CMS fields added to the hero block in
   `public/admin/config.yml`. Worth upstreaming both together.

3. **`src/lib/decap-config.yml` appears to be dead code** — Sveltia loads
   `public/admin/config.yml` (the default path); nothing in the repo
   references `src/lib/decap-config.yml`, and the two files have drifted
   apart (831 vs 872 lines). Having both invites editing the wrong one.
   Suggest deleting the `src/lib` copy or documenting why it exists.
   (Not committed anywhere — verify intent first.)

## Twilightscapes-specific (keep local)

- `scripts/generate-app-manifest.mjs`, `generate-app-posts.mjs`,
  `generate-app-learn.mjs` — app-content pipeline for the Apple TV/iOS apps
  (ported from twilight-astro), wired into `npm run build`.
- `scripts/generate-galleries.mjs` — one-time importer that creates gallery
  entries from manifest collections. (Could be generalized into an upstream
  "import galleries from a public/ folder" feature if there's appetite.)
- `src/content/learn/` collection + Sveltia "Night School" collection +
  `learn` entry in `src/content.config.ts`.
- All content/branding: settings, theme, pwa, labels, pages (home, app,
  support, privacy), launch post, galleries, `public/images/photos/`.

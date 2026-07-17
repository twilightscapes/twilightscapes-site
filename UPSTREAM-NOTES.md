# Template changes — upstream status

This site is built on the Pirate Social template
(github.com/piratewebsite/piratesocial, the `upstream` git remote). Generic
fixes belong there; Twilightscapes-specific customizations stay here.

## Upstreamed ✅ (all merged to piratesocial main, 2026-07-17)

1. **Missing `/galleries` index page** — default nav 404'd on every fresh
   install. (PR #1)
2. **Gallery detail page: photos open in a GLightbox lightbox** — the grid
   previously only jumped the top slideshow; also added `withBase` to grid
   image srcs. (PR #1)
3. **Dark lightbox caption panel** — stock skin rendered white-on-white in
   the template's default dark theme. (PR #1)
4. **README warning about template auto-updates** — the GitHub Pages
   workflow rebuilds from latest template keeping only `src/content/`;
   code customizers must delete `deploy.yml`. Plus removal of the dead,
   drifted `src/lib/decap-config.yml`. (direct commit)

## Not yet upstreamed

- **HeroBlock: optional `logoImage` / `logoAlt` props** — renders a logo
  image in place of the heading (heading becomes an sr-only `<h1>`).
  Generic and useful (animated SVG wordmarks); needs the matching CMS
  fields from `public/admin/config.yml` carried along.

## Twilightscapes-specific (keep local, never upstream)

- `scripts/generate-app-manifest.mjs`, `generate-app-posts.mjs`,
  `generate-app-learn.mjs` — app-content pipeline for the Apple TV/iOS
  apps, wired into `npm run build`.
- `scripts/generate-galleries.mjs` — importer from manifest collections to
  site galleries (could be generalized upstream if there's appetite).
- `src/content/learn/` collection + Sveltia "Night School" collection.
- Removal of `.github/workflows/deploy.yml` — required here because this
  site customizes code and deploys via Netlify (see README warning
  upstreamed in #4).
- All content/branding: settings, theme, pwa, labels, pages, posts,
  galleries, `public/images/photos/`, animated logo.

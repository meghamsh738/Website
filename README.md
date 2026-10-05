# Meghamsh Teja Konda — science studio

A research and software portfolio with an interactive neural constellation,
project galleries and short, authentic workflow recordings.

**Canonical address:** https://meghamsh738.github.io/Website/

## Run and build

Use Node 24 (Node >=22.12 is supported) and npm:

```sh
npm ci
npm run dev      # http://127.0.0.1:4174/Website/
npm run build   # validates the catalog and produces dist/
npm run preview # http://127.0.0.1:4175/Website/
```

Both servers use strict ports. Check the owner of an occupied port before
reusing or stopping it. The production build uses `/Website/` throughout.

Vanilla HTML, CSS and JavaScript are bundled with Vite 8.3.2. Three.js 0.186.1
loads after the main content; Embla Carousel 8.6.0 supplies manual gallery
movement. No application framework, backend, account system or analytics is
added. Fonts, images and recordings are served locally with the static site.

## Content

- `data/project-catalog.json`: names, descriptions, display statuses, filters,
  evidence notes, screenshot captions, optional videos and public destinations.
- `js/gallery.js`: manual galleries, keyboard-accessible native dialog, explicit
  video playback and pause/cleanup when a slide or viewer closes.
- `js/neural-scene.js`: decorative 3D scene with pointer/drag movement, visible
  HTML navigation, offscreen/hidden-page suspension, capped resolution and
  reduced-motion/WebGL fallback.
- `assets/project-images/`: reviewed screenshots, retaining their original scope.
- `assets/project-videos/`: two silent browser recordings from 5 October 2026.
- `docs/MEDIA_PROVENANCE.md`: recording workflows, limitations and asset credits.
- `privacy.html`, `terms.html`, `404.html`: informational pages preserved in the build.

The asset-copy plugin includes only catalog-referenced media and an explicit
static-file list. Unfinished files elsewhere in the checkout are not published.
Videos receive no source URL until Play is selected. Add `captions` (a WebVTT
asset) and `hasSpeech: true` for any future recording with speech.

## Profile compatibility

```sh
node scripts/render-profile-readme.mjs /path/to/profile-repository
```

This still generates the six selected profile projects and copies representative
screenshots. New gallery metadata is optional for that generator. Running it
does not publish the GitHub profile.

## Release

PR #4 continues the existing `codex/portfolio-refresh` branch. The Actions
workflow builds PRs; only an approved `main` build can deploy. The current Pages
source must be changed to **GitHub Actions** as part of the approved release,
then the main workflow run must be checked. This PR does not change the Pages
source, merge itself, publish the portfolio, or deploy linked project apps.

After approval: merge the reviewed head, switch the Pages source, run/check the
main workflow, then verify the canonical URL anonymously (assets, links,
refreshes, policies, 404 and media). See `docs/BUILD_INDEX.md` for review status.

# Portfolio build index

## Current release and timeline update — 30 October 2026

Science studio v1 is published on GitHub Pages at
https://meghamsh738.github.io/Website/. PR #4 was merged as
`263ddd48917a33aa1a30bc0b66ce3db1dee0eddf`; Pages workflow run
[41076084273](https://github.com/meghamsh738/Website/actions/runs/41076084273)
succeeded. The public build passed the 16 recorded browser check groups.

The **CV research timeline** implementation `670c19b` on `codex/cv-research-timeline` adds six
education/research milestones, a detailed NCBS methods section and updated
skills. [Content boundaries](RESEARCH_BACKGROUND.md) distinguish the Trinity
lab joining date from the unconfirmed PhD start date. GitHub merge approval is
still required for this new update. The parallel Sites release uses the same
content with its existing root URL and audience.

Validation: both production builds and catalog checks passed (8 projects,
28 images, 2 videos). Background browser checks covered desktop 1440×1000,
tablet 820×1180, phones 390×844 and 360×800, a 720-CSS-pixel layout equivalent
to 200% zoom, keyboard focus/links, mobile navigation, reduced motion, static
content without page JavaScript, internal anchors and an existing gallery.
No horizontal overflow or browser errors were found. Browser-chrome zoom was
not changed. Screenshots and checks are in the task folder
`outputs/portfolio-overhaul/cv-timeline-2026-10-30/` and are tied to source
hashes in its manifest. No linked app source or media was changed.

## Historical build records

The entries below describe the state at their original review date; the release
status above supersedes their pending-publication wording.

| Build | Branch / review | Scope | Status |
| --- | --- | --- | --- |
| Evidence refresh `f0dc94d` | `codex/portfolio-refresh`, PR #4 | Prior eight-project gallery, verified biography/publication and bounded project evidence | Superseded locally by the science studio overhaul; never merged here |
| Science studio v1 `ebe867d` | `codex/portfolio-refresh`, [PR #4](https://github.com/meghamsh738/Website/pull/4) | Three.js hero, eight filtered Embla galleries, 28 images, two current silent clips, responsive research/software layout and Vite Pages build | Review-ready; implementation committed, 16 browser check groups passed, independent review finding fixed; approval and publication pending |

QA evidence is saved outside the source checkout in the task's
`outputs/portfolio-overhaul/science-studio-v1/` folder: desktop/tablet/phone
screenshots, modal/video views, check results and link results. The preview
serves the production `dist/` build at `http://127.0.0.1:4175/Website/`.

Public publication remains pending approval of the completed PR head and the
Pages source switch. No linked application, private source repository, profile
account field or pin is changed by this build.

## Verification — 5 October 2026

- `npm run build` and `git diff --check` passed. The optional Three.js chunk is
  533 kB minified / 133 kB gzip and remains a deferred import; the main script is
  31 kB / 12 kB gzip. The Vite chunk-size notice applies to that deferred scene.
- Isolated installed Chrome with Playwright 1.62.1: desktop 1440 × 1000,
  tablet 820 × 1180, phone 390 × 844 and 360 × 800, plus a 720-CSS-pixel layout
  equivalent to a 1440-pixel window at 200% zoom. Browser-chrome zoom itself was
  not driven in the headless runner. The IAB also displayed the working preview.
- Sixteen browser groups passed: identity/content, console health, scene drag
  and motion, offscreen pause, all filters, single-image behavior, carousel
  buttons/swipe/thumbnails/keyboard, modal Escape and focus restoration, deferred
  downloads, actual video playback/pause, media paths, policy/404/metadata,
  responsive layouts, reduced motion, missing-media recovery and WebGL loss.
- Separate startup with WebGL disabled retained eight projects, static artwork
  and all three scene links. A simulated `document.hidden` transition verified
  the visibility handler; headless tab switching did not hide the original tab.
- Screen-reader image-button descriptions were fixed after one independent
  code review, then the interaction checks passed again.
- All 12 application/repository launch URLs returned HTTP 200 anonymously. The
  preserved S40 DOI redirected to Zenodo, which returned an automated-request
  403; its credit link was retained, not declared broken or reverified.
- The unchanged profile generator produced six project sections and six images
  in a temporary output directory; no profile publication occurred.
- The five pre-existing untracked AI PNGs are preserved and absent from `dist`.

The production site still needs an anonymous check after the approved release.
Media limitations are recorded in `MEDIA_PROVENANCE.md` and the project catalog.

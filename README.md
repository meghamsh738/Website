# Meghamsh Teja Konda — portfolio

Static portfolio for research, publications and selected software projects.

**Live URL:** <https://meghamsh738.github.io/Website/>

## Local preview

Serve the repository from its parent directory under the `/Website/` path so
the project-site asset paths match GitHub Pages. For example, use a local static
server with `Website` mapped to this repository, then open
`http://127.0.0.1:<port>/Website/`.

The site uses HTML, CSS and vanilla JavaScript. It has no build dependencies or
third-party fonts. Project cards are rendered from `data/project-catalog.json`;
screenshots live under `assets/project-images/`.

## Content and assets

- `index.html` — research profile and selected project gallery
- `privacy.html` — brief description of the data flows present in this static site
- `terms.html` — factual scope of this informational portfolio
- `404.html` — GitHub Pages not-found page
- `data/project-catalog.json` — project names, verified status notes, links and screenshot descriptions
- `assets/` — favicon, social preview and project screenshots

Check every project screenshot against its source revision and handoff notes
before changing its caption or status. Screenshots document a visible state;
they do not by themselves establish that a feature, deployment or external
workflow was tested.

The profile README is generated from the same project catalog. Run
`node scripts/render-profile-readme.mjs <profile-repository-directory>` to
regenerate its project links and copy the representative screenshots.

import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

// Copy only the media in the reviewed catalog, never a whole working directory.
function portfolioAssets() {
  return {
    name: 'portfolio-assets',
    generateBundle() {
      const catalog = JSON.parse(readFileSync(resolve(root, 'data/project-catalog.json'), 'utf8'));
      const paths = new Set(['data/project-catalog.json', 'robots.txt', 'sitemap.xml', 'assets/og-image.png', 'assets/favicon.svg', 'assets/fonts/OFL.txt', 'assets/third-party-licenses.txt']);
      for (const project of catalog.projects) {
        for (const image of project.screenshots ?? []) paths.add(image.path);
        for (const video of project.videos ?? []) {
          paths.add(video.path);
          paths.add(video.poster);
          if (video.captions) paths.add(video.captions);
        }
      }
      for (const path of paths) {
        this.emitFile({ type: 'asset', fileName: path, source: readFileSync(resolve(root, path)) });
      }
    },
  };
}

export default defineConfig({
  base: '/Website/',
  publicDir: false,
  plugins: [portfolioAssets()],
  build: {
    rolldownOptions: {
      input: Object.fromEntries(['index', 'privacy', 'terms', '404'].map(name => [name, resolve(root, `${name}.html`)])),
    },
  },
});

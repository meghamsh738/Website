import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await readFile(path.join(root, 'data/project-catalog.json'), 'utf8'));
const slugs = new Set();
let images = 0;
let videos = 0;
async function checkAsset(value) {
  if (typeof value !== 'string' || !value.startsWith('assets/') || value.includes('..') || value.includes('\\')) throw new Error(`Unsafe media path: ${value}`);
  await access(path.join(root, value));
}
for (const project of catalog.projects) {
  if (slugs.has(project.slug) || !/^[a-z0-9-]+$/.test(project.slug)) throw new Error(`Invalid/duplicate slug: ${project.slug}`);
  slugs.add(project.slug);
  if (!project.summary || !project.displayStatus || !['research', 'games', 'everyday'].includes(project.filterGroup)) throw new Error(`Missing display information: ${project.slug}`);
  for (const image of project.screenshots ?? []) {
    if (!image.alt || !image.caption) throw new Error(`Uncaptioned image: ${project.slug}`);
    await checkAsset(image.path);
    images++;
  }
  for (const video of project.videos ?? []) {
    if (!video.caption || !video.recordedAt || !video.version || !video.title) throw new Error(`Missing video provenance: ${project.slug}`);
    if (video.hasSpeech && !video.captions) throw new Error(`Spoken video needs captions: ${project.slug}`);
    await checkAsset(video.path);
    await checkAsset(video.poster);
    if (video.captions) await checkAsset(video.captions);
    videos++;
  }
  for (const link of project.links ?? []) if (new URL(link.href).protocol !== 'https:') throw new Error(`Non-HTTPS project link: ${project.slug}`);
  if (project.profileOrder != null && !project.screenshots?.[project.profileScreenshotIndex ?? 0]) throw new Error(`Missing profile image: ${project.slug}`);
}
console.log(`Catalog valid: ${slugs.size} projects, ${images} images, ${videos} videos.`);

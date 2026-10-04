#!/usr/bin/env node

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const websiteDirectory = path.resolve(scriptDirectory, '..');
const outputDirectoryArg = process.argv[2];

if (!outputDirectoryArg) {
  console.error('Usage: node scripts/render-profile-readme.mjs <profile-repository-directory>');
  process.exitCode = 2;
} else {
  const outputDirectory = path.resolve(outputDirectoryArg);
  const catalogPath = path.join(websiteDirectory, 'data', 'project-catalog.json');
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const projects = catalog.projects
    .filter(project => Number.isInteger(project.profileOrder))
    .sort((left, right) => left.profileOrder - right.profileOrder);

  const projectSections = [];
  for (const project of projects) {
    const lines = [
      `### [${project.name}](${project.profileHref ?? project.links?.[0]?.href ?? '#'})`,
      '',
      project.summary,
      '',
      `**${project.profileStatus ?? project.status}**`,
    ];

    const screenshot = project.screenshots?.[project.profileScreenshotIndex ?? 0];
    if (screenshot) {
      const sourcePath = path.resolve(websiteDirectory, screenshot.path);
      const extension = path.extname(sourcePath).toLowerCase();
      const filename = `${project.slug}${extension}`;
      const imageDirectory = path.join(outputDirectory, 'assets', 'projects');
      await mkdir(imageDirectory, { recursive: true });
      await copyFile(sourcePath, path.join(imageDirectory, filename));
      lines.push('', `[![${screenshot.alt}](assets/projects/${filename})](${project.profileHref ?? project.links?.[0]?.href ?? '#'})`);
    }

    const links = (project.profileLinks ?? project.links ?? [])
      .filter(link => /^https:\/\//.test(link.href))
      .map(link => `[${link.label}](${link.href})`);
    if (links.length) lines.push('', links.join(' · '));
    projectSections.push(lines.join('\n'));
  }

  const publication = [
    '## Research',
    '',
    'I am a PhD researcher in neuroimmunology at Trinity College Dublin. My current research focus concerns systemic TNF-α-driven neuroinflammation, delirium vulnerability in ageing, recovery dynamics and IL-17A modulation, as listed in the [2026 TCD Neuroscience Research Day programme](https://www.tcd.ie/Neuroscience/assets/PDF/Neuroscience%20Research%20Day%202026%20-%20Programme.pdf).',
    '',
    '## Publication',
    '',
    '[“CSF1R inhibition exacerbates gamma oscillation disruption and induces network hyperexcitability in APP/PS1 mice”](https://doi.org/10.1093/brain/awag147), *Brain*, published online 14 July 2026. Meghamsh Konda is credited as the fifth of 11 authors.',
  ].join('\n');

  const content = [
    '# Meghamsh Teja Konda',
    '',
    '**PhD researcher in neuroimmunology at Trinity College Dublin.**',
    '',
    'I study brain–immune interactions in ageing and build practical software for research workflows, image analysis and play.',
    '',
    '[Portfolio](https://meghamsh738.github.io/Website/) · [GitHub repositories](https://github.com/meghamsh738?tab=repositories)',
    '',
    publication,
    '',
    '## Selected projects',
    '',
    ...projectSections,
    '',
    '## Methods & tools',
    '',
    '**Experimental:** mouse handling, stereotaxic surgery, microdissection, behavioural assays and colony work.',
    '',
    '**Cell, imaging & molecular:** flow cytometry, immunofluorescence, confocal microscopy, cell culture, Cre-loxP lineage tracing, qPCR, PCR, RNA/protein extraction, Western blotting and primer design.',
    '',
    '**Analysis & software:** Python, R, ImageJ/Fiji, Imaris, FlowJo, Leica LAS X, GraphPad Prism and AnyMaze.',
    '',
    '---',
    '',
    `Project cards and representative screenshots are generated from data/project-catalog.json (catalog update: ${catalog.updated}). See the [portfolio](https://meghamsh738.github.io/Website/) for the current screenshots and verification notes.`,
    '',
  ].join('\n');

  await writeFile(path.join(outputDirectory, 'README.md'), content, 'utf8');
  console.log(`Wrote ${path.join(outputDirectory, 'README.md')} from ${catalogPath}`);
}

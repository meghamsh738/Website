'use strict';

const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');

function closeMenu() {
  if (!menuButton || !siteNav) return;
  menuButton.setAttribute('aria-expanded', 'false');
  siteNav.classList.remove('is-open');
}

if (menuButton && siteNav) {
  menuButton.addEventListener('click', () => {
    const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isExpanded));
    siteNav.classList.toggle('is-open', !isExpanded);
  });

  siteNav.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  document.addEventListener('click', event => {
    if (!(event.target instanceof Node)) return;
    if (!siteNav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
}

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

const projectGrid = document.querySelector('#project-grid');
const projectStatus = document.querySelector('#project-status');
const scriptUrl = document.currentScript?.src;
const siteRoot = scriptUrl ? new URL('../', scriptUrl) : new URL('./', window.location.href);

function addText(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function makeImageFigure(source, siteRoot, className = '') {
  const figure = document.createElement('figure');
  if (className) figure.className = className;
  const image = document.createElement('img');
  image.src = new URL(source.path, siteRoot).href;
  image.alt = source.alt;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.addEventListener('error', () => {
    image.hidden = true;
    addText(figure, 'p', 'image-error', 'Screenshot unavailable. Try the project link below.');
  }, { once: true });
  figure.append(image);
  if (source.caption) addText(figure, 'figcaption', '', source.caption);
  return figure;
}

function renderProject(project) {
  const card = document.createElement('article');
  card.className = 'project-card';

  if (project.screenshots?.length) {
    const media = makeImageFigure(project.screenshots[0], siteRoot, 'project-media');
    card.append(media);
  } else if (project.noScreenshotNote) {
    const media = document.createElement('div');
    media.className = 'project-media project-media--placeholder';
    addText(media, 'p', '', project.noScreenshotNote);
    card.append(media);
  }

  const body = document.createElement('div');
  body.className = 'project-body';
  const overline = document.createElement('div');
  overline.className = 'project-overline';
  addText(overline, 'span', 'project-category', project.category);
  addText(overline, 'span', 'project-state', project.status);
  body.append(overline);
  addText(body, 'h3', 'project-title', project.name);
  addText(body, 'p', 'project-summary', project.summary);

  if (project.statusDetail) addText(body, 'p', 'project-status-detail', project.statusDetail);

  if (project.links?.length) {
    const links = document.createElement('div');
    links.className = 'project-links';
    for (const item of project.links) {
      const link = document.createElement('a');
      const target = new URL(item.href, siteRoot);
      if (!['https:', 'mailto:'].includes(target.protocol)) continue;
      link.href = target.href;
      link.textContent = `${item.label} ↗`;
      if (target.protocol === 'https:' && target.origin !== siteRoot.origin) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      links.append(link);
    }
    body.append(links);
  }

  if (project.screenshots?.length > 1) {
    const details = document.createElement('details');
    details.className = 'project-gallery';
    const summary = document.createElement('summary');
    summary.textContent = `More views (${project.screenshots.length - 1})`;
    details.append(summary);
    const gallery = document.createElement('div');
    gallery.className = 'gallery-images';
    for (const source of project.screenshots.slice(1)) gallery.append(makeImageFigure(source, siteRoot));
    details.append(gallery);
    body.append(details);
  }

  card.append(body);
  return card;
}

async function loadProjects() {
  if (!projectGrid || !projectStatus) return;
  try {
    const response = await fetch(new URL('data/project-catalog.json', siteRoot), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`catalog responded with ${response.status}`);
    const catalog = await response.json();
    if (!Array.isArray(catalog.projects) || catalog.projects.length === 0) {
      projectGrid.replaceChildren();
      addText(projectGrid, 'p', 'project-loading', 'Selected project screens are being prepared.');
      projectStatus.textContent = 'No project cards are available yet.';
      projectGrid.setAttribute('aria-busy', 'false');
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const project of catalog.projects) fragment.append(renderProject(project));
    projectGrid.replaceChildren(fragment);
    projectStatus.textContent = `${catalog.projects.length} selected project cards loaded.`;
    projectGrid.setAttribute('aria-busy', 'false');
  } catch (error) {
    console.error('Unable to load the selected project cards.', error);
    projectStatus.textContent = 'The selected project cards could not load.';
    projectGrid.replaceChildren();
    const fallback = addText(projectGrid, 'p', 'project-fallback', 'The selected project cards could not load. Browse the ');
    const link = document.createElement('a');
    link.href = 'https://github.com/meghamsh738?tab=repositories';
    link.textContent = 'public repositories on GitHub';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    fallback.append(link, document.createTextNode('.'));
    projectGrid.setAttribute('aria-busy', 'false');
  }
}

loadProjects();

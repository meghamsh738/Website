import { Gallery, createViewer, pauseAllVideos } from './gallery.js';

const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');
function closeMenu() { menuButton?.setAttribute('aria-expanded', 'false'); siteNav?.classList.remove('is-open'); }
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open)); siteNav.classList.toggle('is-open', open);
});
siteNav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!siteNav?.contains(event.target) && !menuButton?.contains(event.target)) closeMenu(); });
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const grid = document.querySelector('#project-grid');
const status = document.querySelector('#project-status');
const count = document.querySelector('#project-count');
const viewer = createViewer();
const galleries = [];
const projectCards = [];
function el(tag, className, text) { const node = document.createElement(tag); node.className = className; if (text != null) node.textContent = text; return node; }
function renderProject(project, index) {
  const card = el('article', 'project-card');
  card.id = `project-${project.slug}`;
  card.dataset.group = project.filterGroup;
  card.setAttribute('aria-labelledby', `title-${project.slug}`);
  const topline = el('div', 'project-topline');
  topline.append(el('span', 'project-number', `PROJECT ${String(index + 1).padStart(2, '0')}`), el('span', 'project-state', project.displayStatus));
  const gallery = new Gallery(project, { onExpand: (index, trigger) => viewer(project, index, trigger) });
  galleries.push(gallery);
  const body = el('div', 'project-body');
  const title = el('h3', 'project-title', project.name); title.id = `title-${project.slug}`;
  body.append(el('p', 'project-category', project.category), title, el('p', 'project-summary', project.summary));
  const links = el('div', 'project-links');
  for (const item of project.links ?? []) {
    if (!item.href.startsWith('https://')) continue;
    const link = el('a', '', item.label); link.href = item.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
    links.append(link);
  }
  if (links.childElementCount) body.append(links);
  const details = el('details', 'project-notes');
  details.append(el('summary', '', 'Current scope & project notes'), el('p', '', project.statusDetail));
  body.append(details);
  card.append(topline, gallery.root, body);
  projectCards.push({ card, gallery });
  return card;
}
async function loadProjects() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/project-catalog.json`);
    if (!response.ok) throw new Error(`Catalog returned ${response.status}`);
    const catalog = await response.json();
    if (!catalog.projects?.length) throw new Error('Empty catalog');
    grid.replaceChildren(...catalog.projects.map(renderProject));
    galleries.forEach(gallery => gallery.mount());
    count.textContent = `${catalog.projects.length} projects`;
    status.textContent = `Showing all ${catalog.projects.length} projects.`;
    for (const button of document.querySelectorAll('[data-filter]')) button.addEventListener('click', () => {
      pauseAllVideos();
      document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      let visible = 0;
      for (const { card, gallery } of projectCards) {
        card.hidden = button.dataset.filter !== 'all' && card.dataset.group !== button.dataset.filter;
        if (!card.hidden) { visible++; gallery.api?.reInit(); }
      }
      count.textContent = `${visible} ${visible === 1 ? 'project' : 'projects'}`;
      status.textContent = `Showing ${visible} ${button.dataset.filter === 'all' ? '' : button.textContent.toLowerCase() + ' '}projects.`;
    });
  } catch (error) {
    console.error('Project gallery could not load.', error);
    grid.replaceChildren(el('p', 'project-loading', 'The project gallery could not load. Please try refreshing, or browse the repositories below.'));
    status.textContent = 'Project gallery unavailable.';
  } finally { grid.setAttribute('aria-busy', 'false'); }
}
loadProjects();

const sceneHost = document.querySelector('#neural-scene');
const motionButton = document.querySelector('#motion-toggle');
const sceneStatus = document.querySelector('#scene-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let scene;
let loadingScene;
let motionEnabled = !reducedMotion.matches;
let sceneAvailable = true;
function updateMotionButton() {
  motionButton.hidden = false;
  motionButton.setAttribute('aria-pressed', String(!motionEnabled));
  motionButton.textContent = motionEnabled ? 'Pause motion' : 'Enable motion';
  sceneStatus.textContent = motionEnabled ? 'Drag to explore · select a connection' : 'Still view · select a connection to explore';
}
async function loadScene() {
  if (scene || loadingScene || !motionEnabled || !sceneAvailable) return loadingScene;
  loadingScene = import('./neural-scene.js').then(({ initNeuralScene }) => {
    scene = initNeuralScene(sceneHost, () => {
      sceneAvailable = false; motionEnabled = false; updateMotionButton();
      motionButton.hidden = true;
      sceneStatus.textContent = 'Still view · select a connection to explore';
    });
    scene?.setMotion(motionEnabled);
  }).catch(() => {
    sceneAvailable = false; motionEnabled = false; motionButton.hidden = true;
    sceneStatus.textContent = 'Still view · select a connection to explore';
  });
  return loadingScene;
}
updateMotionButton();
motionButton.addEventListener('click', () => {
  motionEnabled = !motionEnabled;
  updateMotionButton();
  if (motionEnabled) loadScene();
  scene?.setMotion(motionEnabled);
});
reducedMotion.addEventListener('change', event => {
  motionEnabled = !event.matches; updateMotionButton(); scene?.setMotion(motionEnabled);
  if (motionEnabled) loadScene();
});
const scheduleScene = () => 'requestIdleCallback' in window ? requestIdleCallback(loadScene, { timeout: 1800 }) : setTimeout(loadScene, 150);
if (document.readyState === 'complete') scheduleScene(); else window.addEventListener('load', scheduleScene, { once: true });

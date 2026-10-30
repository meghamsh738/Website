import EmblaCarousel from 'embla-carousel';

const base = new URL(import.meta.env.BASE_URL, location.origin);
const activeVideos = new Set();
export const mediaUrl = path => new URL(path, base).href;
export function pauseAllVideos(except) {
  for (const video of activeVideos) if (video !== except) video.pause();
}
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAllVideos(); });

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

export function projectMedia(project) {
  return [
    ...(project.screenshots ?? []).map(image => ({ ...image, type: 'image' })),
    ...(project.videos ?? []).map(video => ({ ...video, type: 'video', alt: video.title })),
  ];
}

export class Gallery {
  constructor(project, { expanded = false, onExpand } = {}) {
    this.project = project;
    this.items = projectMedia(project);
    this.expanded = expanded;
    this.onExpand = onExpand;
    this.videos = [];
    this.root = element('div', 'gallery');
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-roledescription', 'carousel');
    this.root.setAttribute('aria-label', `${project.name} gallery`);
    this.viewport = element('div', 'gallery-viewport');
    this.track = element('div', 'gallery-track');
    this.viewport.append(this.track);
    this.root.append(this.viewport);
    this.items.forEach((item, index) => this.track.append(this.makeSlide(item, index)));
    const meta = element('div', 'gallery-meta');
    this.caption = element('p', 'gallery-caption');
    this.counter = element('span', 'gallery-counter');
    this.counter.setAttribute('aria-live', 'polite');
    this.counter.setAttribute('aria-atomic', 'true');
    meta.append(this.caption, this.counter);
    this.root.append(meta);
    this.thumbs = [];
    if (this.items.length > 1) {
      const nav = element('div', 'gallery-nav');
      this.previous = this.makeArrow('Previous', -1);
      this.next = this.makeArrow('Next', 1);
      const thumbs = element('div', 'gallery-thumbs');
      thumbs.setAttribute('role', 'group');
      thumbs.setAttribute('aria-label', 'Choose a view');
      this.items.forEach((item, index) => {
        const button = element('button', `gallery-thumb${item.type === 'video' ? ' gallery-thumb--video' : ''}`);
        button.type = 'button';
        button.setAttribute('aria-label', `View ${index + 1}: ${item.type === 'video' ? 'Video — ' : ''}${item.alt}`);
        const img = element('img');
        img.src = mediaUrl(item.poster ?? item.path);
        img.alt = '';
        img.loading = 'lazy';
        button.append(img);
        button.addEventListener('click', () => this.api?.scrollTo(index));
        thumbs.append(button);
        this.thumbs.push(button);
      });
      nav.append(this.previous, thumbs, this.next);
      this.root.append(nav);
    }
    this.keyHandler = event => {
      if (event.target.closest('video') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft') this.api?.scrollPrev();
      if (event.key === 'ArrowRight') this.api?.scrollNext();
      if (event.key === 'Home') this.api?.scrollTo(0);
      if (event.key === 'End') this.api?.scrollTo(this.items.length - 1);
    };
    this.root.addEventListener('keydown', this.keyHandler);
  }

  makeArrow(label, direction) {
    const button = element('button', 'gallery-arrow', label);
    button.type = 'button';
    button.setAttribute('aria-label', `${label} view of ${this.project.name}`);
    button.addEventListener('click', () => direction < 0 ? this.api?.scrollPrev() : this.api?.scrollNext());
    return button;
  }

  makeSlide(item, index) {
    const slide = element('div', 'gallery-slide');
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${index + 1} of ${this.items.length}`);
    if (item.type === 'image') {
      const img = element('img');
      img.src = mediaUrl(item.path);
      img.alt = item.alt;
      img.loading = this.expanded ? 'eager' : 'lazy';
      img.decoding = 'async';
      const content = this.expanded ? element('div', 'gallery-image-button') : element('button', 'gallery-image-button');
      if (!this.expanded) {
        content.type = 'button';
        content.setAttribute('aria-label', `Enlarge ${this.project.name} view ${index + 1}: ${item.alt}`);
        content.addEventListener('click', event => {
          // A completed swipe must not also open the image viewer.
          if (this.dragged) { event.preventDefault(); return; }
          this.onExpand?.(index, content);
        });
      }
      img.addEventListener('error', () => {
        img.hidden = true;
        content.append(element('p', 'media-error', 'This image could not load. The project links are still available below.'));
      }, { once: true });
      content.append(img);
      slide.append(content);
    } else {
      const wrapper = element('div', 'gallery-video');
      const video = element('video');
      video.poster = mediaUrl(item.poster);
      video.preload = 'none';
      video.playsInline = true;
      video.controls = false;
      video.setAttribute('aria-label', item.title);
      const play = element('button', 'video-play', 'Play demo');
      play.type = 'button';
      play.setAttribute('aria-label', `Play ${item.title}`);
      const start = async () => {
        if (!video.getAttribute('src')) {
          video.src = mediaUrl(item.path);
          if (item.captions) {
            const track = element('track');
            track.kind = 'captions'; track.label = 'English'; track.srclang = 'en'; track.default = true;
            track.src = mediaUrl(item.captions); video.append(track);
          }
        }
        video.controls = true;
        try { await video.play(); play.hidden = true; }
        catch { play.textContent = 'Try playing again'; }
      };
      play.addEventListener('click', start);
      video.addEventListener('play', () => { pauseAllVideos(video); play.hidden = true; });
      video.addEventListener('error', () => {
        play.hidden = true;
        video.hidden = true;
        if (!wrapper.querySelector('.media-error')) wrapper.append(element('p', 'media-error', 'The video could not load. You can still explore the screenshots.'));
      });
      activeVideos.add(video);
      this.videos.push(video);
      wrapper.append(video, play);
      if (!this.expanded) {
        const expand = element('button', 'video-expand', 'Enlarge');
        expand.type = 'button';
        expand.setAttribute('aria-label', `Enlarge ${item.title}`);
        expand.addEventListener('click', () => this.onExpand?.(index, expand));
        wrapper.append(expand);
      }
      slide.append(wrapper);
    }
    return slide;
  }

  mount() {
    if (!this.items.length) {
      this.root.replaceChildren(element('p', 'media-error', 'Project media is being prepared.'));
      return;
    }
    this.api = EmblaCarousel(this.viewport, { loop: false, align: 'start', containScroll: 'trimSnaps', breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } } });
    this.api.on('select', () => { this.pause(); this.update(); });
    this.api.on('reInit', () => this.update());
    this.api.on('pointerDown', () => { this.dragged = false; });
    this.api.on('scroll', () => { this.dragged = true; });
    this.api.on('settle', () => { this.dragged = false; });
    this.update();
  }

  update() {
    const index = this.api?.selectedScrollSnap() ?? 0;
    const activeSlide = this.track.children[index];
    const focusedSlide = document.activeElement?.closest('.gallery-slide');
    const moveFocus = focusedSlide && this.track.contains(focusedSlide) && focusedSlide !== activeSlide;
    this.caption.textContent = this.items[index]?.caption ?? '';
    this.counter.textContent = `${index + 1} / ${this.items.length}`;
    for (const [i, slide] of [...this.track.children].entries()) {
      // Keep off-screen controls out of both the focus order and accessibility tree.
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
    }
    this.thumbs.forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
    if (moveFocus) (activeSlide?.querySelector('button, video[controls]') ?? this.thumbs[index])?.focus({ preventScroll: true });
    if (this.previous) this.previous.disabled = !this.api?.canScrollPrev();
    if (this.next) this.next.disabled = !this.api?.canScrollNext();
  }

  pause() { this.videos.forEach(video => video.pause()); }
  destroy() {
    this.pause();
    this.videos.forEach(video => { activeVideos.delete(video); video.removeAttribute('src'); video.load(); });
    this.api?.destroy();
  }
}

export function createViewer() {
  const dialog = document.querySelector('#media-viewer');
  const title = document.querySelector('#viewer-title');
  const content = document.querySelector('#viewer-content');
  const close = dialog.querySelector('.viewer-close');
  let gallery, opener, oldOverflow;
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    gallery?.destroy(); gallery = undefined; content.replaceChildren();
    document.body.style.overflow = oldOverflow;
    opener?.focus({ preventScroll: true });
  });
  return (project, index, trigger) => {
    pauseAllVideos();
    opener = trigger;
    title.textContent = project.name;
    gallery = new Gallery(project, { expanded: true });
    content.replaceChildren(gallery.root);
    oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    gallery.mount();
    gallery.api?.scrollTo(index, true);
    gallery.update();
    close.focus();
  };
}

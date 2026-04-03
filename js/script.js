/* ================================================================
   script.js – Interactions & Animations
   Meghamsh Teja PhD Website
   ================================================================ */

'use strict';

/* ── Helpers ──────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ── Year ─────────────────────────────────────────────────────── */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Navigation: scroll behaviour ────────────────────────────── */
const navbar = $('#navbar');
const SCROLL_THRESHOLD = 60;

function updateNav() {
  if (!navbar) return;
  navbar.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ── Navigation: active link highlighting ─────────────────────── */
const sections = $$('section[id]');
const navLinks  = $$('.nav__link');

function setActiveLink() {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}
window.addEventListener('scroll', setActiveLink, { passive: true });
setActiveLink();

/* ── Mobile nav toggle ────────────────────────────────────────── */
const navToggle = $('#navToggle');
const navLinksEl = $('#navLinks');

if (navToggle && navLinksEl) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navToggle.classList.toggle('open', !expanded);
    navLinksEl.classList.toggle('open', !expanded);
    document.body.style.overflow = expanded ? '' : 'hidden';
  });

  // Close on link click
  navLinksEl.addEventListener('click', e => {
    if (e.target.classList.contains('nav__link')) {
      navToggle.classList.remove('open');
      navLinksEl.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinksEl.classList.contains('open')) {
      navToggle.click();
    }
  });
}

/* ── Reveal on scroll (Intersection Observer) ─────────────────── */
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
);

$$('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 6) * 0.07}s`;
  revealObserver.observe(el);
});

/* ── Skill bars animation ─────────────────────────────────────── */
const skillObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      $$('.skill-item__fill', entry.target).forEach(fill => {
        fill.classList.add('animated');
      });
      skillObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.25 }
);

$$('.skills__group').forEach(g => skillObserver.observe(g));

/* ── Typewriter / role rotation ───────────────────────────────── */
const roles = [
  'Neuroimmunologist',
  'PhD Researcher',
  'Glial Biologist',
  'scRNA-seq Analyst',
  'Coder & Tinkerer',
];
const roleEl = $('#roleDynamic');

if (roleEl) {
  let roleIdx = 0;
  let charIdx = 0;
  let deleting = false;

  function typeRole() {
    const current = roles[roleIdx];

    if (!deleting) {
      roleEl.textContent = current.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(typeRole, 1400); // hold before deleting
        return;
      }
      setTimeout(typeRole, 65);
    } else {
      roleEl.textContent = current.slice(0, charIdx);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
        setTimeout(typeRole, 350);
        return;
      }
      setTimeout(typeRole, 35);
    }
  }

  setTimeout(typeRole, 800);
}

/* ── Neural canvas background ─────────────────────────────────── */
(function initCanvas() {
  const canvas = $('#neuralCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, nodes, raf;

  const NODE_COUNT = 55;
  const MAX_DIST = 160;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function randomNode() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
    };
  }

  function init() {
    resize();
    nodes = Array.from({ length: NODE_COUNT }, randomNode);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Update positions
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });

    // Draw edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(0,212,212,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,212,0.45)';
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  init();
  draw();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); }, 150);
  });
})();

/* ── Smooth scroll for nav links ──────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ── Stagger children within sections on first reveal ─────────── */
const staggerObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const children = $$(':scope > *', entry.target);
      children.forEach((child, i) => {
        child.style.transitionDelay = `${i * 0.08}s`;
        child.classList.add('visible');
      });
      staggerObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.1 }
);

// Apply stagger to grid containers that contain reveal children
['.research__focus-grid', '.projects__grid', '.skills__grid', '.about__stats'].forEach(sel => {
  $$(sel).forEach(el => {
    // Mark children as reveal targets if not already
    $$(':scope > *', el).forEach(child => {
      if (!child.classList.contains('reveal')) {
        child.classList.add('reveal');
        revealObserver.observe(child);
      }
    });
  });
});

/* ── Microglia Interactive Canvas ────────────────────────────────── */
(function initMicrogliaCanvas() {
  const canvas = document.getElementById('microgliaCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, cells, signals = [];
  const mouse = { x: -9999, y: -9999 };

  const CELL_COUNT    = 14;
  const NUM_PROCESSES = 8;
  const SENSE_RADIUS  = 130;
  const ACTIVE_RADIUS = 55;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function Process(baseAngle) {
    this.angle       = baseAngle + (Math.random() - 0.5) * 0.5;
    this.length      = 14 + Math.random() * 8;
    this.targetLen   = this.length;
    this.wave        = Math.random() * Math.PI * 2;
    this.waveSpeed   = 0.014 + Math.random() * 0.01;
  }

  function MicrogliaCell() {
    this.x    = Math.random() * (W || 800);
    this.y    = Math.random() * (H || 420);
    this.vx   = (Math.random() - 0.5) * 0.22;
    this.vy   = (Math.random() - 0.5) * 0.22;
    this.activation = 0;
    this.processes  = Array.from({ length: NUM_PROCESSES }, (_, i) =>
      new Process((Math.PI * 2 / NUM_PROCESSES) * i)
    );
  }

  MicrogliaCell.prototype.update = function (mx, my) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 18) this.vx =  Math.abs(this.vx);
    if (this.x > W - 18) this.vx = -Math.abs(this.vx);
    if (this.y < 18) this.vy =  Math.abs(this.vy);
    if (this.y > H - 18) this.vy = -Math.abs(this.vy);

    const cdx = mx - this.x;
    const cdy = my - this.y;
    const cdist = Math.hypot(cdx, cdy);
    const cursorAngle = Math.atan2(cdy, cdx);

    let targetActivation = 0;
    let towardCursor     = false;

    if (cdist < ACTIVE_RADIUS) {
      targetActivation = 1;
      towardCursor = true;
    } else if (cdist < SENSE_RADIUS && SENSE_RADIUS > ACTIVE_RADIUS) {
      targetActivation = (SENSE_RADIUS - cdist) / (SENSE_RADIUS - ACTIVE_RADIUS) * 0.5;
      towardCursor = true;
    }

    signals.forEach(sig => {
      const sdx   = sig.x - this.x;
      const sdy   = sig.y - this.y;
      const sdist = Math.hypot(sdx, sdy);
      if (sdist < sig.radius * 0.75) {
        targetActivation = Math.max(
          targetActivation,
          sig.intensity * (1 - sdist / (sig.radius * 0.75))
        );
      }
    });

    this.activation += (targetActivation - this.activation) * 0.06;

    this.processes.forEach(proc => {
      proc.wave += proc.waveSpeed;
      if (towardCursor) {
        const diff = Math.atan2(
          Math.sin(cursorAngle - proc.angle),
          Math.cos(cursorAngle - proc.angle)
        );
        const proximity = Math.abs(diff) < Math.PI / 2
          ? 1 - Math.abs(diff) / (Math.PI / 2) : 0;
        proc.targetLen = 14 + proximity * (this.activation * 32);
      } else {
        proc.targetLen = 14 + Math.sin(proc.wave * 0.5) * 3;
      }
      proc.length += (proc.targetLen - proc.length) * 0.07;
    });
  };

  MicrogliaCell.prototype.draw = function (ctx) {
    const a = this.activation;

    // Colour: teal → yellow → red as activation increases
    let r, g, b;
    if (a < 0.5) {
      const t = a / 0.5;
      r = Math.round(t * 240);
      g = Math.round(212 - t * 24);
      b = Math.round(212 - t * 148);
    } else {
      const t = (a - 0.5) / 0.5;
      r = Math.round(240 + t * 15);
      g = Math.round(188 - t * 120);
      b = Math.round(64  - t * 64);
    }
    const alpha = 0.55 + a * 0.35;

    this.processes.forEach(proc => {
      const wa  = proc.angle + Math.sin(proc.wave) * 0.12;
      const ex  = this.x + Math.cos(wa) * proc.length;
      const ey  = this.y + Math.sin(wa) * proc.length;
      const bl  = proc.length * 0.4;

      ctx.globalAlpha = alpha * 0.72;
      ctx.lineWidth   = 1.5;
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(ex, ey); ctx.stroke();

      ctx.globalAlpha = alpha * 0.32;
      ctx.lineWidth   = 0.8;
      for (const ba of [wa + 0.45, wa - 0.45]) {
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + Math.cos(ba) * bl, ey + Math.sin(ba) * bl);
        ctx.stroke();
      }
    });

    if (a > 0.05) {
      const gr = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 20 + a * 12);
      gr.addColorStop(0, `rgba(${r},${g},${b},${0.28 * a})`);
      gr.addColorStop(1, 'transparent');
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(this.x, this.y, 20 + a * 12, 0, Math.PI * 2);
      ctx.fillStyle = gr; ctx.fill();
    }

    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(this.x, this.y, 5 + a * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fill();
    ctx.globalAlpha = 1;
  };

  function Signal(x, y) {
    this.x = x; this.y = y;
    this.radius    = 0;
    this.maxRadius = 210;
    this.intensity = 1;
    this.alive     = true;
  }

  Signal.prototype.update = function () {
    this.radius   += 3.5;
    this.intensity = Math.max(0, 1 - this.radius / this.maxRadius);
    if (this.radius > this.maxRadius) this.alive = false;
  };

  Signal.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,107,107,${this.intensity * 0.55})`;
    ctx.lineWidth   = 2;
    ctx.stroke();
  };

  function init() {
    resize();
    cells = Array.from({ length: CELL_COUNT }, () => new MicrogliaCell());
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(107,79,168,0.055)';
    ctx.lineWidth   = 0.5;
    for (let x = 0; x < W; x += 42) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 42) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    signals = signals.filter(s => s.alive);
    signals.forEach(s => { s.update(); s.draw(ctx); });
    cells.forEach(c => { c.update(mouse.x, mouse.y); c.draw(ctx); });
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousemove', e => {
    const r   = canvas.getBoundingClientRect();
    mouse.x   = (e.clientX - r.left) * (W / r.width);
    mouse.y   = (e.clientY - r.top)  * (H / r.height);
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    signals.push(new Signal(
      (e.clientX - r.left) * (W / r.width),
      (e.clientY - r.top)  * (H / r.height)
    ));
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    mouse.x = (t.clientX - r.left) * (W / r.width);
    mouse.y = (t.clientY - r.top)  * (H / r.height);
  }, { passive: false });
  canvas.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; });

  // Keyboard navigation: focus canvas and use arrow keys to move virtual cursor,
  // Space/Enter to release an inflammatory signal
  canvas.setAttribute('tabindex', '0');
  canvas.addEventListener('keydown', e => {
    const step = 20;
    if (mouse.x < 0) { mouse.x = W / 2; mouse.y = H / 2; }
    switch (e.key) {
      case 'ArrowLeft':  mouse.x = Math.max(0, mouse.x - step);  e.preventDefault(); break;
      case 'ArrowRight': mouse.x = Math.min(W, mouse.x + step);  e.preventDefault(); break;
      case 'ArrowUp':    mouse.y = Math.max(0, mouse.y - step);  e.preventDefault(); break;
      case 'ArrowDown':  mouse.y = Math.min(H, mouse.y + step);  e.preventDefault(); break;
      case ' ':
      case 'Enter':      signals.push(new Signal(mouse.x, mouse.y)); e.preventDefault(); break;
    }
  });
  canvas.addEventListener('blur', () => { mouse.x = -9999; mouse.y = -9999; });

  let microgliaResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(microgliaResizeTimer);
    microgliaResizeTimer = setTimeout(resize, 150);
  });

  init();
  loop();
})();

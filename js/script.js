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
  let pauseTicks = 0;

  function typeRole() {
    const current = roles[roleIdx];

    if (!deleting) {
      roleEl.textContent = current.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        deleting = true;
        pauseTicks = 28; // hold before deleting
        setTimeout(typeRole, 50 * pauseTicks);
        return;
      }
      setTimeout(typeRole, 65);
    } else {
      roleEl.textContent = current.slice(0, charIdx - 1);
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

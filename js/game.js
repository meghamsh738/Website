/* ================================================================
   game.js – Interactive Microglia Phagocytosis Game
   Educational game about delirium & microglial research
   Meghamsh Teja PhD Website
   ================================================================ */

'use strict';

(function MicrogliaGame() {

  /* ── Constants ─────────────────────────────────────────────── */
  const DIFFICULTIES = {
    recovery: {
      label: 'Recovery',
      description: 'Low inflammation. Microglia manage debris easily.',
      spawnInterval: 3200,
      maxDebris: 4,
      inflRate: 0.018,
      debrisLife: 12000,
      npcCount: 3,
      color: '#00d4d4',
    },
    mild: {
      label: 'Mild Delirium',
      description: 'Moderate inflammation. Debris accumulates faster.',
      spawnInterval: 2000,
      maxDebris: 8,
      inflRate: 0.032,
      debrisLife: 9000,
      npcCount: 2,
      color: '#f0c040',
    },
    moderate: {
      label: 'Moderate Delirium',
      description: 'High inflammation. Cognitive dysfunction imminent.',
      spawnInterval: 1200,
      maxDebris: 14,
      inflRate: 0.055,
      debrisLife: 6500,
      npcCount: 1,
      color: '#ff6b6b',
    },
  };

  const PHAGO_RADIUS   = 38;   // px distance to trigger phagocytosis
  const PHAGO_DURATION = 900;  // ms for eating animation
  const PLAYER_SPEED   = 2.4;
  const NPC_SPEED      = 0.9;
  const SCORE_PER_PHAGO = 10;
  const INFLAMMATION_PER_DEBRIS = 8; // % added when debris expires

  const FACTS = [
    'Microglia are the resident immune cells of the brain — they make up ~10–15% of all brain cells.',
    'In a healthy brain, microglia constantly survey their territory, extending and retracting processes.',
    'During systemic illness, peripheral immune signals reach the brain and activate microglia.',
    'Activated microglia release cytokines that disrupt neuronal communication, contributing to delirium.',
    'Phagocytosis is the process by which microglia engulf and clear debris, dead cells, and pathogens.',
    'Delirium affects up to 50% of ICU patients and is associated with long-term cognitive decline.',
    'Glial reactivity — measured by Iba1 and GFAP staining — is a hallmark of neuroinflammation.',
    'Research at Trinity Biomedical Sciences Institute investigates how systemic inflammation triggers delirium.',
  ];

  /* ── DOM references ────────────────────────────────────────── */
  const modal          = document.getElementById('microgliaGameModal');
  const canvas         = document.getElementById('gameCanvas');
  const scoreEl        = document.getElementById('gameScore');
  const inflFill       = document.getElementById('inflammationFill');
  const inflLabel      = document.getElementById('inflammationLabel');
  const timerEl        = document.getElementById('gameTimer');
  const openBtn        = document.getElementById('openGameBtn');
  const closeBtn       = document.getElementById('gameCloseBtn');
  const startScreen    = document.getElementById('gameStartScreen');
  const playingHud     = document.getElementById('gameHud');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const finalScore     = document.getElementById('finalScore');
  const finalMsg       = document.getElementById('finalMsg');
  const pauseScreen    = document.getElementById('gamePauseScreen');
  const diffBtns       = document.querySelectorAll('[data-difficulty]');
  const restartBtn     = document.getElementById('gameRestartBtn');
  const pauseBtn       = document.getElementById('gamePauseBtn');
  const resumeBtn      = document.getElementById('gameResumeBtn');
  const factEl         = document.getElementById('gameFact');
  const factOverEl     = document.getElementById('gameFactOver');

  if (!canvas || !modal) return;

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;

  /* ── Game state ────────────────────────────────────────────── */
  let state        = 'menu';   // menu | playing | paused | gameover
  let difficulty   = 'mild';
  let score        = 0;
  let inflammation = 0;        // 0–100 %
  let elapsed      = 0;        // ms
  let lastTime     = 0;
  let rafId        = null;
  let spawnTimer   = 0;
  let factIndex    = 0;

  let player       = null;
  let npcs         = [];
  let debris       = [];
  let particles    = [];  // visual burst particles

  /* ══════════════════════════════════════════════════════════════
     ENTITIES
     ══════════════════════════════════════════════════════════════ */

  /* ── Debris (dead cell / inflammatory particle) ─────────────── */
  function Debris(x, y) {
    this.x       = x;
    this.y       = y;
    this.r       = 6 + Math.random() * 5;
    this.age     = 0;
    this.life    = DIFFICULTIES[difficulty].debrisLife;
    this.pulse   = Math.random() * Math.PI * 2;
    this.eating  = false;     // being phagocytosed
    this.eatProgress = 0;
    this.dead    = false;
    this.by      = null;      // which microglia is eating it
  }

  Debris.prototype.update = function (dt) {
    this.age  += dt;
    this.pulse += 0.003 * dt;
    if (this.eating) {
      this.eatProgress += dt / PHAGO_DURATION;
      if (this.eatProgress >= 1) {
        this.dead = true;
        score += SCORE_PER_PHAGO;
        spawnBurst(this.x, this.y, '#00d4d4');
      }
    } else if (this.age >= this.life) {
      // Expired — not cleared → raises inflammation
      this.dead = true;
      inflammation = Math.min(100, inflammation + INFLAMMATION_PER_DEBRIS);
      spawnBurst(this.x, this.y, '#ff6b6b');
    }
  };

  Debris.prototype.draw = function () {
    if (this.dead) return;
    const pct   = this.eating ? 1 - this.eatProgress : 1;
    const pulse = 1 + 0.12 * Math.sin(this.pulse);
    const r     = this.r * pulse * pct;
    const alpha = this.eating ? 0.9 - this.eatProgress * 0.8 : 0.78;

    // urgency colour: starts orange, turns red as life runs out
    const urgency = Math.min(1, this.age / (this.life * 0.7));
    const red     = Math.round(220 + urgency * 35);
    const green   = Math.round(80  - urgency * 70);

    // glow
    const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 2.5);
    grd.addColorStop(0, `rgba(${red},${green},40,${0.35 * alpha})`);
    grd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // body
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${red},${green},40,${alpha})`;
    ctx.fill();

    // life-timer ring
    if (!this.eating) {
      const lifePct = 1 - this.age / this.life;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifePct);
      ctx.strokeStyle = `rgba(${red},${green},40,0.45)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  /* ── Burst particles ─────────────────────────────────────────── */
  function spawnBurst(x, y, colour) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        colour,
        r: 1.5 + Math.random() * 2.5,
      });
    }
  }

  function updateParticles(dt) {
    particles = particles.filter(p => {
      p.x    += p.vx * (dt / 16);
      p.y    += p.vy * (dt / 16);
      p.life -= dt / 500;
      return p.life > 0;
    });
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.globalAlpha = p.life * 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.colour;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /* ── Microglia base ─────────────────────────────────────────── */
  function makeMicroglia(x, y, isPlayer) {
    const NUM_PROC = isPlayer ? 10 : 8;
    return {
      x, y,
      tx: x, ty: y,        // target position
      vx: 0, vy: 0,
      activation: 0,
      isPlayer,
      eating: false,
      eatTarget: null,
      processes: Array.from({ length: NUM_PROC }, (_, i) => ({
        angle:    (Math.PI * 2 / NUM_PROC) * i + (Math.random() - 0.5) * 0.4,
        length:   14 + Math.random() * 8,
        targetLen: 14,
        wave:     Math.random() * Math.PI * 2,
        waveSpeed: 0.012 + Math.random() * 0.008,
      })),
    };
  }

  function updateMicroglia(cell, dt, speed) {
    // Move toward target
    const dx = cell.tx - cell.x;
    const dy = cell.ty - cell.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 2) {
      const factor = Math.min(speed * (dt / 16), dist) / dist;
      cell.vx = dx * factor;
      cell.vy = dy * factor;
    } else {
      cell.vx *= 0.85;
      cell.vy *= 0.85;
    }
    cell.x = Math.max(12, Math.min(W - 12, cell.x + cell.vx));
    cell.y = Math.max(12, Math.min(H - 12, cell.y + cell.vy));

    // Activation based on proximity to nearest debris
    let nearestDist = Infinity;
    debris.forEach(d => {
      if (!d.dead) nearestDist = Math.min(nearestDist, Math.hypot(d.x - cell.x, d.y - cell.y));
    });
    const targetAct = nearestDist < 120 ? Math.max(0, 1 - nearestDist / 120) : 0;
    cell.activation += (targetAct - cell.activation) * 0.05;

    // Animate processes
    const moveAngle = Math.atan2(cell.vy, cell.vx);
    const moving    = Math.hypot(cell.vx, cell.vy) > 0.2;
    cell.processes.forEach(proc => {
      proc.wave += proc.waveSpeed * (dt / 16);
      if (moving) {
        const diff = Math.atan2(
          Math.sin(moveAngle - proc.angle),
          Math.cos(moveAngle - proc.angle)
        );
        const prox = Math.abs(diff) < Math.PI / 2 ? 1 - Math.abs(diff) / (Math.PI / 2) : 0;
        proc.targetLen = 14 + prox * (10 + cell.activation * 20);
      } else {
        proc.targetLen = 14 + Math.sin(proc.wave * 0.4) * 4 + cell.activation * 12;
      }
      proc.length += (proc.targetLen - proc.length) * 0.08;
    });
  }

  function drawMicroglia(cell) {
    const a   = cell.activation;
    const col = cell.isPlayer
      ? { r: 0, g: 212, b: 212 }     // player: cyan
      : { r: 100, g: 200, b: 220 };  // npc: slightly dimmer

    const r   = col.r + (cell.eating ? 40 : 0);
    const g   = col.g;
    const b   = col.b - (cell.eating ? 60 : 0);
    const alpha = (cell.isPlayer ? 0.75 : 0.55) + a * 0.2;

    // Processes
    cell.processes.forEach(proc => {
      const wa = proc.angle + Math.sin(proc.wave) * 0.1;
      const ex = cell.x + Math.cos(wa) * proc.length;
      const ey = cell.y + Math.sin(wa) * proc.length;

      ctx.globalAlpha = alpha * 0.8;
      ctx.lineWidth   = cell.isPlayer ? 1.8 : 1.3;
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath(); ctx.moveTo(cell.x, cell.y); ctx.lineTo(ex, ey); ctx.stroke();

      // Branch tips
      ctx.globalAlpha = alpha * 0.35;
      ctx.lineWidth   = 0.7;
      const bl = proc.length * 0.35;
      for (const ba of [wa + 0.5, wa - 0.5]) {
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + Math.cos(ba) * bl, ey + Math.sin(ba) * bl);
        ctx.stroke();
      }
    });

    // Glow halo
    if (a > 0.05 || cell.isPlayer) {
      const grd = ctx.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, 22 + a * 14);
      grd.addColorStop(0, `rgba(${r},${g},${b},${(cell.isPlayer ? 0.22 : 0.12) + a * 0.15})`);
      grd.addColorStop(1, 'transparent');
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(cell.x, cell.y, 22 + a * 14, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
    }

    // Cell body
    ctx.globalAlpha = alpha;
    const bodyR = (cell.isPlayer ? 6 : 4.5) + a * 2;
    ctx.beginPath(); ctx.arc(cell.x, cell.y, bodyR, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fill();

    // Player indicator ring
    if (cell.isPlayer) {
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.arc(cell.x, cell.y, bodyR + 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ── NPC AI: move toward nearest debris ─────────────────────── */
  function updateNPC(npc, dt) {
    if (!npc.eating) {
      // Find nearest alive, unbeaten debris
      let nearest = null, nearDist = Infinity;
      debris.forEach(d => {
        if (d.dead || d.eating) return;
        const dist = Math.hypot(d.x - npc.x, d.y - npc.y);
        if (dist < nearDist) { nearDist = dist; nearest = d; }
      });

      if (nearest) {
        npc.tx = nearest.x;
        npc.ty = nearest.y;
        if (nearDist < PHAGO_RADIUS && !nearest.eating) {
          nearest.eating = true;
          nearest.by     = npc;
          npc.eating     = true;
          npc.eatTarget  = nearest;
        }
      } else {
        // Wander
        if (Math.random() < 0.004 * (dt / 16)) {
          npc.tx = Math.random() * W;
          npc.ty = Math.random() * H;
        }
      }
    } else {
      // Stay on debris while eating
      if (npc.eatTarget && !npc.eatTarget.dead) {
        npc.tx = npc.eatTarget.x;
        npc.ty = npc.eatTarget.y;
      } else {
        npc.eating    = false;
        npc.eatTarget = null;
      }
    }
    updateMicroglia(npc, dt, NPC_SPEED);
  }

  /* ── Player control ──────────────────────────────────────────── */
  function updatePlayer(dt) {
    if (!player) return;
    if (player.eating) {
      if (player.eatTarget && !player.eatTarget.dead) {
        player.tx = player.eatTarget.x;
        player.ty = player.eatTarget.y;
      } else {
        player.eating    = false;
        player.eatTarget = null;
      }
    } else {
      // Check if player is close enough to eat debris
      debris.forEach(d => {
        if (d.dead || d.eating || player.eating) return;
        const dist = Math.hypot(d.x - player.x, d.y - player.y);
        if (dist < PHAGO_RADIUS) {
          d.eating    = true;
          d.by        = player;
          player.eating    = true;
          player.eatTarget = d;
        }
      });
    }
    updateMicroglia(player, dt, PLAYER_SPEED);
  }

  /* ── Click target indicator ──────────────────────────────────── */
  let clickTarget = null;
  let clickTargetAge = 0;

  function drawClickTarget() {
    if (!clickTarget) return;
    clickTargetAge += 16;
    const alpha = Math.max(0, 1 - clickTargetAge / 600);
    if (alpha <= 0) { clickTarget = null; return; }
    const r = 8 + clickTargetAge / 60;
    ctx.globalAlpha = alpha * 0.7;
    ctx.beginPath();
    ctx.arc(clickTarget.x, clickTarget.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#00d4d4';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* ══════════════════════════════════════════════════════════════
     GAME LOOP
     ══════════════════════════════════════════════════════════════ */

  function spawnDebris() {
    const margin = 30;
    const x = margin + Math.random() * (W - margin * 2);
    const y = margin + Math.random() * (H - margin * 2);
    if (debris.filter(d => !d.dead).length < DIFFICULTIES[difficulty].maxDebris) {
      debris.push(new Debris(x, y));
    }
  }

  function drawBackground() {
    // Inflammatory tint increases with inflammation
    const tint = inflammation / 100;
    ctx.fillStyle = `rgba(${Math.round(tint * 40)},${Math.round(tint * 4)},${Math.round(tint * 4)},${0.08 + tint * 0.12})`;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = `rgba(107,79,168,${0.04 + tint * 0.03})`;
    ctx.lineWidth   = 0.5;
    for (let x = 0; x < W; x += 42) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 42) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  }

  function updateHUD() {
    if (scoreEl)  scoreEl.textContent  = score;
    if (timerEl)  timerEl.textContent  = formatTime(elapsed);
    if (inflFill) {
      inflFill.style.width = `${inflammation}%`;
      // Colour shifts red as inflammation rises
      const h = Math.round(180 - inflammation * 1.8); // cyan → red
      inflFill.style.background = `hsl(${h},100%,55%)`;
    }
    if (inflLabel) {
      if      (inflammation < 30) inflLabel.textContent = 'Low';
      else if (inflammation < 60) inflLabel.textContent = 'Elevated';
      else if (inflammation < 85) inflLabel.textContent = 'High';
      else                        inflLabel.textContent = 'Critical!';
    }
  }

  function gameLoop(timestamp) {
    if (state !== 'playing') return;

    const dt = Math.min(timestamp - lastTime, 50); // cap at 50ms
    lastTime = timestamp;
    elapsed += dt;

    // Spawn debris
    spawnTimer += dt;
    if (spawnTimer >= DIFFICULTIES[difficulty].spawnInterval) {
      spawnTimer = 0;
      spawnDebris();
    }

    // Passive inflammation increase
    inflammation = Math.min(100, inflammation + DIFFICULTIES[difficulty].inflRate * (dt / 16));

    // Update entities
    debris = debris.filter(d => !d.dead);
    debris.forEach(d => d.update(dt));
    updateParticles(dt);

    npcs.forEach(npc => updateNPC(npc, dt));
    updatePlayer(dt);

    // Render
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    debris.forEach(d => d.draw());
    drawParticles();
    npcs.forEach(npc => drawMicroglia(npc));
    if (player) drawMicroglia(player);
    drawClickTarget();

    updateHUD();

    if (inflammation >= 100) {
      endGame(false);
      return;
    }

    rafId = requestAnimationFrame(gameLoop);
  }

  /* ══════════════════════════════════════════════════════════════
     STATE MANAGEMENT
     ══════════════════════════════════════════════════════════════ */

  function resizeCanvas() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function startGame(diff) {
    difficulty  = diff || difficulty;
    score       = 0;
    inflammation = 0;
    elapsed     = 0;
    spawnTimer  = 0;
    debris      = [];
    particles   = [];
    lastTime    = performance.now();

    resizeCanvas();

    // Create player microglia
    player = makeMicroglia(W / 2, H / 2, true);

    // Create NPC microglia
    const npcN = DIFFICULTIES[difficulty].npcCount;
    npcs = Array.from({ length: npcN }, () =>
      makeMicroglia(
        Math.random() * W,
        Math.random() * H,
        false
      )
    );

    // Initial debris
    for (let i = 0; i < 2; i++) spawnDebris();

    showScreen('playing');
    state   = 'playing';
    rafId   = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (state !== 'playing') return;
    state = 'paused';
    cancelAnimationFrame(rafId);
    showScreen('paused');
  }

  function resumeGame() {
    if (state !== 'paused') return;
    lastTime = performance.now();
    state    = 'playing';
    showScreen('playing');
    rafId    = requestAnimationFrame(gameLoop);
  }

  function endGame(won) {
    state = 'gameover';
    cancelAnimationFrame(rafId);

    if (finalScore) finalScore.textContent = score;
    if (finalMsg) {
      if (won) {
        finalMsg.textContent = 'Outstanding! Your microglia kept neuroinflammation in check.';
      } else {
        finalMsg.textContent = 'Neuroinflammation reached critical levels — cognitive dysfunction occurred.';
      }
    }

    // Rotate fact
    if (factOverEl) {
      factOverEl.textContent = FACTS[factIndex % FACTS.length];
      factIndex++;
    }

    showScreen('gameover');
  }

  function showScreen(which) {
    const screens = { menu: startScreen, playing: playingHud, paused: pauseScreen, gameover: gameOverScreen };
    Object.entries(screens).forEach(([key, el]) => {
      if (!el) return;
      el.style.display = key === which ? (key === 'playing' ? 'flex' : 'flex') : 'none';
    });
  }

  /* ── Open / Close modal ──────────────────────────────────────── */
  function openModal() {
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    resizeCanvas();
    showScreen('menu');
    state = 'menu';

    // Rotate the loading fact
    if (factEl) factEl.textContent = FACTS[factIndex % FACTS.length];
  }

  function closeModal() {
    if (!modal) return;
    cancelAnimationFrame(rafId);
    state = 'menu';
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  /* ── Input ───────────────────────────────────────────────────── */
  canvas.addEventListener('click', e => {
    if (state !== 'playing' || !player) return;
    const rect = canvas.getBoundingClientRect();
    const x    = (e.clientX - rect.left) * (W / rect.width);
    const y    = (e.clientY - rect.top)  * (H / rect.height);
    player.tx  = x;
    player.ty  = y;
    clickTarget    = { x, y };
    clickTargetAge = 0;
  });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (state !== 'playing' || !player) return;
    const rect = canvas.getBoundingClientRect();
    const t    = e.touches[0];
    const x    = (t.clientX - rect.left) * (W / rect.width);
    const y    = (t.clientY - rect.top)  * (H / rect.height);
    player.tx  = x;
    player.ty  = y;
  }, { passive: false });

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (state !== 'playing' || !player) return;
    const rect = canvas.getBoundingClientRect();
    const t    = e.touches[0];
    const x    = (t.clientX - rect.left) * (W / rect.width);
    const y    = (t.clientY - rect.top)  * (H / rect.height);
    player.tx  = x;
    player.ty  = y;
    clickTarget    = { x, y };
    clickTargetAge = 0;
  }, { passive: false });

  // Keyboard controls
  canvas.setAttribute('tabindex', '0');
  const KEYS = {};
  canvas.addEventListener('keydown', e => {
    KEYS[e.key] = true;
    if (e.key === 'Escape') {
      if (state === 'playing') pauseGame();
      else if (state === 'paused') resumeGame();
    }
    if (e.key === 'p' || e.key === 'P') {
      if (state === 'playing') pauseGame();
      else if (state === 'paused') resumeGame();
    }
    e.stopPropagation(); // prevent page scroll when game is focused
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
      e.preventDefault();
    }
  });
  canvas.addEventListener('keyup', e => { KEYS[e.key] = false; });

  // Keyboard movement
  (function keyboardTick() {
    requestAnimationFrame(keyboardTick);
    if (state !== 'playing' || !player) return;
    const step = 4;
    if (KEYS['ArrowLeft']  || KEYS['a']) player.tx = Math.max(0, player.tx - step);
    if (KEYS['ArrowRight'] || KEYS['d']) player.tx = Math.min(W, player.tx + step);
    if (KEYS['ArrowUp']    || KEYS['w']) player.ty = Math.max(0, player.ty - step);
    if (KEYS['ArrowDown']  || KEYS['s']) player.ty = Math.min(H, player.ty + step);
  })();

  /* ── Button wiring ───────────────────────────────────────────── */
  if (openBtn)    openBtn.addEventListener('click', openModal);
  if (closeBtn)   closeBtn.addEventListener('click', closeModal);
  if (restartBtn) restartBtn.addEventListener('click', () => startGame(difficulty));
  if (pauseBtn)   pauseBtn.addEventListener('click',  pauseGame);
  if (resumeBtn)  resumeBtn.addEventListener('click',  resumeGame);

  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const diff = btn.dataset.difficulty;
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      startGame(diff);
    });
  });

  // Close modal on backdrop click
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key (global)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
  });

  // Handle window resize
  let gameResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(gameResizeTimer);
    gameResizeTimer = setTimeout(() => {
      if (modal.style.display === 'flex') resizeCanvas();
    }, 150);
  });

  // Draw idle animation on menu screen
  (function idleLoop() {
    requestAnimationFrame(idleLoop);
    if (state !== 'menu' || modal.style.display !== 'flex') return;
    resizeCanvas();
    ctx.clearRect(0, 0, W, H);

    // Draw some drifting debris particles as background
    const t = performance.now() / 1000;
    for (let i = 0; i < 5; i++) {
      const ox = (Math.sin(t * 0.3 + i * 1.3) * 0.5 + 0.5) * W;
      const oy = (Math.cos(t * 0.2 + i * 0.9) * 0.5 + 0.5) * H;
      const r  = 4 + Math.sin(t + i) * 2;
      ctx.globalAlpha = 0.2;
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b40';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  })();

})();

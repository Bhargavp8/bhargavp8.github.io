// ═══════════════════════════════════════════════════════════════════════════
// BHARCODE ENHANCEMENT ENGINE v3.0
// Visual: particles · parallax · scramble · counters · magnetic
// Secrets: konami→space invaders · logo×5→matrix rain · type"bharcode"→terminal
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── 1. SCROLL PROGRESS BAR ──────────────────────────────────────────────────
  const scrollBar = document.getElementById('scroll-bar');
  if (scrollBar) {
    window.addEventListener('scroll', () => {
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      scrollBar.style.transform = `scaleX(${Math.min(pct, 1)})`;
    }, { passive: true });
  }

  // ── 2. HERO PARTICLE NETWORK ────────────────────────────────────────────────
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let W, H, particles;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      W = heroCanvas.width = heroCanvas.offsetWidth;
      H = heroCanvas.height = heroCanvas.offsetHeight;
      initParticles();
    }

    function initParticles() {
      const count = Math.min(Math.floor((W * H) / 10000), 80);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.5 + 0.5,
      }));
    }

    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    function drawParticles() {
      ctx.clearRect(0, 0, W, H);
      const rgb = isDark() ? '122,171,255' : '26,48,86';
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) { p.x += (dx / dist) * 1.5; p.y += (dy / dist) * 1.5; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},0.5)`;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${rgb},${0.12 * (1 - d / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(drawParticles);
    }

    heroCanvas.addEventListener('mousemove', e => {
      const r = heroCanvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    heroCanvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    window.addEventListener('resize', resize);
    resize();
    drawParticles();
  }

  // ── 3. PARALLAX ─────────────────────────────────────────────────────────────
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length) {
    window.addEventListener('scroll', () => {
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.25;
        el.style.transform = `translateY(${window.scrollY * speed}px)`;
      });
    }, { passive: true });
  }

  // ── 4. TEXT SCRAMBLE (text-only nodes — no child elements) ──────────────────
  const scrambleEl = document.querySelector('[data-scramble]');
  if (scrambleEl && !scrambleEl.children.length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01@#$%·—';
    const original = scrambleEl.textContent;
    let frame = 0;
    const maxFrames = 28;
    const interval = setInterval(() => {
      frame++;
      const resolved = Math.floor((frame / maxFrames) * original.length);
      let result = '';
      for (let i = 0; i < original.length; i++) {
        if (original[i] === ' ' || original[i] === '·') { result += original[i]; continue; }
        result += i < resolved ? original[i] : chars[Math.floor(Math.random() * chars.length)];
      }
      scrambleEl.textContent = result;
      if (frame >= maxFrames) { scrambleEl.textContent = original; clearInterval(interval); }
    }, 45);
  }

  // ── 5. COUNTER ANIMATIONS ───────────────────────────────────────────────────
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        const el = entry.target;
        const raw = el.dataset.count;
        const num = parseInt(raw.replace(/\D/g, ''));
        const prefix = raw.match(/^[^\d]*/)[0];
        const suffix = raw.match(/[^\d]*$/)[0];
        if (!num) return;
        const start = Date.now();
        const dur = 1400;
        const tick = () => {
          const t = Math.min((Date.now() - start) / dur, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          el.textContent = prefix + Math.round(ease * num) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        };
        tick();
      });
    }, { threshold: 0.5 });
    counters.forEach(el => obs.observe(el));
  }

  // ── 6. MAGNETIC BUTTONS ─────────────────────────────────────────────────────
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
      let rect;
      btn.addEventListener('mouseenter', () => { rect = btn.getBoundingClientRect(); });
      btn.addEventListener('mousemove', e => {
        if (!rect) return;
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
        btn.style.transform = `translate(${x}px,${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  // ── 7. CURSOR ───────────────────────────────────────────────────────────────
  // The 10-dot trail was retired in favour of the precision dot + reticle ring
  // implemented in BaseLayout (see #cursor-dot / #cursor-ring). Kept here as a
  // marker so the section numbering stays meaningful.

  // ── 8. 3D TILT CARDS ────────────────────────────────────────────────────────
  document.querySelectorAll('.project-card, .blog-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-5px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
      card.style.transition = 'box-shadow .1s,border-color .1s';
      card.style.boxShadow = `${(-x * 14 + 6)}px ${(-y * 14 + 6)}px 0 var(--accent)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s';
      card.style.boxShadow = '';
    });
  });

  // ── 9. SECTION ENTRANCE WITH DIRECTION ──────────────────────────────────────
  const dirObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); dirObs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => dirObs.observe(el));


  // ══════════════════════════════════════════════════════════════════════════════
  // ░░  HIDDEN SECRETS — DISCOVER IF YOU CAN  ░░
  // ══════════════════════════════════════════════════════════════════════════════

  // ── SECRET 1: KONAMI CODE → SPACE INVADERS ──────────────────────────────────
  // Enter: ↑ ↑ ↓ ↓ ← → ← → B A
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiIdx = 0;
  document.addEventListener('keydown', e => {
    konamiIdx = (e.key === KONAMI[konamiIdx]) ? konamiIdx + 1 : (e.key === KONAMI[0] ? 1 : 0);
    if (konamiIdx === KONAMI.length) { konamiIdx = 0; launchInvaders(); }
  });

  function launchInvaders() {
    const overlay = document.getElementById('game-overlay');
    const canvas  = document.getElementById('game-canvas');
    if (!overlay || !canvas) return;
    overlay.classList.add('open');
    document.getElementById('game-hint').textContent = '← → move  ·  SPACE shoot  ·  R restart  ·  ESC exit';

    const ctx = canvas.getContext('2d');
    const W = canvas.width = 480, H = canvas.height = 520;
    let player = { x: W/2 - 20, y: H - 50, w: 40, h: 14 };
    let bullets = [], score = 0, lives = 3, frame = 0, over = false, won = false;
    const keys = {};
    let lastShot = 0, enemyDir = 1;

    const EMOJIS = ['👾','👽','🤖','😈'];
    function initEnemies() {
      return Array.from({ length: 32 }, (_, i) => ({
        x: 38 + (i % 8) * 52, y: 36 + Math.floor(i / 8) * 44,
        w: 30, h: 26, alive: true, emoji: EMOJIS[Math.floor(i / 8)],
      }));
    }
    let enemies = initEnemies();

    const kd = e => { keys[e.key] = true; };
    const ku = e => { keys[e.key] = false; };
    document.addEventListener('keydown', kd);
    document.addEventListener('keyup', ku);

    function loop(ts) {
      if (!overlay.classList.contains('open')) {
        document.removeEventListener('keydown', kd);
        document.removeEventListener('keyup', ku);
        return;
      }
      frame++;
      ctx.fillStyle = '#060610';
      ctx.fillRect(0, 0, W, H);

      // Stars
      if (frame === 1) {
        canvas._stars = Array.from({ length: 60 }, () => ({
          x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2
        }));
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      (canvas._stars || []).forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill(); });

      if (!over) {
        if (keys['ArrowLeft'])  player.x = Math.max(0, player.x - 4.5);
        if (keys['ArrowRight']) player.x = Math.min(W - player.w, player.x + 4.5);
        if (keys[' '] && ts - lastShot > 260) {
          bullets.push({ x: player.x + player.w / 2, y: player.y - 2, friendly: true });
          lastShot = ts;
        }

        bullets = bullets.filter(b => {
          b.y += b.friendly ? -8 : 4.5;
          return b.y > -10 && b.y < H + 10;
        });

        const alive = enemies.filter(e => e.alive);
        if (!alive.length) { won = true; over = true; }

        // Move enemies
        alive.forEach(e => { e.x += enemyDir * (0.6 + (32 - alive.length) * 0.04); });
        const atEdge = alive.some(e => e.x < 8 || e.x + e.w > W - 8);
        if (atEdge) { enemyDir *= -1; alive.forEach(e => { e.y += 18; }); }

        // Enemy shoot
        if (Math.random() < 0.004 && alive.length) {
          const s = alive[Math.floor(Math.random() * alive.length)];
          bullets.push({ x: s.x + s.w / 2, y: s.y + s.h, friendly: false });
        }

        // Hit detection
        bullets.forEach(b => {
          enemies.forEach(e => {
            if (!e.alive || !b.friendly) return;
            if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
              e.alive = false; b.y = -999; score += 10;
            }
          });
          if (!b.friendly && b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h) {
            b.y = 9999; lives--; if (lives <= 0) over = true;
          }
        });

        alive.forEach(e => { if (e.y + e.h > player.y) { lives = 0; over = true; } });
      }

      // Draw enemies
      ctx.font = '22px serif';
      ctx.textAlign = 'left';
      enemies.filter(e => e.alive).forEach(e => ctx.fillText(e.emoji, e.x, e.y + 22));

      // Draw bullets
      bullets.forEach(b => {
        ctx.fillStyle = b.friendly ? '#4ade80' : '#f87171';
        ctx.fillRect(b.x - 1.5, b.y, 3, b.friendly ? 10 : 8);
      });

      // Draw player
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.fillRect(player.x + 14, player.y - 10, 12, 10);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(player.x + 16, player.y - 8, 8, 6);

      // HUD
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE  ${score}`, 10, 16);
      ctx.fillText('♥'.repeat(lives), W / 2 - 20, 16);

      if (over) {
        ctx.fillStyle = 'rgba(6,6,16,0.8)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = won ? '#4ade80' : '#f87171';
        ctx.font = 'bold 30px monospace';
        ctx.fillText(won ? '🎉  YOU WIN!' : '💀  GAME OVER', W / 2, H / 2 - 24);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '15px monospace';
        ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 14);
        ctx.fillText('R  to restart', W / 2, H / 2 + 42);
        ctx.textAlign = 'left';
        if (keys['r'] || keys['R']) {
          over = false; won = false; lives = 3; score = 0; frame = 0;
          bullets = []; player.x = W / 2 - 20; enemies = initEnemies(); enemyDir = 1;
        }
      }

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // ── SECRET 2: LOGO × 5 RAPID CLICKS → MATRIX RAIN ──────────────────────────
  // Click the "Bharcode" nav logo 5 times quickly
  let logoClicks = 0, logoReset;
  const logoEl = document.querySelector('nav .logo');
  if (logoEl) {
    logoEl.addEventListener('click', e => {
      e.preventDefault();
      logoClicks++;
      clearTimeout(logoReset);
      logoReset = setTimeout(() => { logoClicks = 0; }, 1800);
      if (logoClicks >= 5) { logoClicks = 0; launchMatrix(); }
    });
  }

  function launchMatrix() {
    const overlay = document.getElementById('matrix-overlay');
    const canvas  = document.getElementById('matrix-canvas');
    if (!overlay || !canvas) return;
    overlay.classList.add('open');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx  = canvas.getContext('2d');
    const cols = Math.floor(canvas.width / 16);
    const drops = Array(cols).fill(0).map(() => Math.random() * -50);
    const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';

    const id = setInterval(() => {
      if (!overlay.classList.contains('open')) { clearInterval(id); return; }
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drops.forEach((y, i) => {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = Math.random() > 0.96 ? '#fff' : (Math.random() > 0.6 ? '#00ff41' : '#008f11');
        ctx.font = '15px monospace';
        ctx.fillText(ch, i * 16, y * 16);
        if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      });
    }, 30);

    setTimeout(() => overlay.classList.remove('open'), 14000);
  }

  // ── SECRET 3: TYPE "bharcode" ANYWHERE → TERMINAL EASTER EGG ───────────────
  // Just start typing "bharcode" on any page (not in an input)
  let typeBuf = '';
  document.addEventListener('keypress', e => {
    if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    typeBuf = (typeBuf + e.key).slice(-8).toLowerCase();
    if (typeBuf.includes('bharcode')) { typeBuf = ''; launchTerminal(); }
  });

  function launchTerminal() {
    const overlay = document.getElementById('terminal-overlay');
    const out     = document.getElementById('terminal-output');
    const inp     = document.getElementById('terminal-input');
    if (!overlay || !out || !inp) return;
    overlay.classList.add('open');

    const write = (html) => {
      out.innerHTML += html + '<br>';
      out.scrollTop = out.scrollHeight;
    };

    out.innerHTML = '';
    write(`<span style="color:#4ade80;font-weight:bold">BharCode Terminal v1.0</span>`);
    write(`<span style="color:#64748b">You found the secret terminal! 🎉</span>`);
    write(`<span style="color:#64748b">Type <span style="color:#f1f5f9">help</span> for commands.</span>`);
    out.innerHTML += '<br>';
    setTimeout(() => inp.focus(), 80);

    const CMDS = {
      help: () => `<span style="color:#60a5fa">Commands:</span><br>
  <span style="color:#4ade80">whoami</span>    — who built this<br>
  <span style="color:#4ade80">stack</span>     — tech stack breakdown<br>
  <span style="color:#4ade80">knot</span>      — about knot.bharcode.com<br>
  <span style="color:#4ade80">matrix</span>    — you know what this does<br>
  <span style="color:#4ade80">game</span>      — hint for the other secret<br>
  <span style="color:#4ade80">secret</span>    — list all secrets<br>
  <span style="color:#4ade80">clear</span>     — clear terminal<br>
  <span style="color:#4ade80">exit</span>      — close`,
      whoami: () => `<span style="color:#f1f5f9">The builder behind BharCode</span><br>
Product engineer · Singapore · Building in public since 2026<br>
Currently: staying up too late coding this easter egg`,
      stack: () => `<span style="color:#f1f5f9">Bharcode:</span>  Astro · GitHub Pages · Cloudflare<br>
<span style="color:#f1f5f9">Knot:</span>      Next.js · Supabase · Vercel<br>
<span style="color:#f1f5f9">Knot Bot:</span>  Python · Telegram API · Railway<br>
<span style="color:#f1f5f9">Cost:</span>      $10.35/year (just the domain)`,
      knot: () => `<span style="color:#4ade80">Knot</span> — group expenses, split fairly.<br>
Trips · households · chores · raise-a-trip voting<br>
<a href="https://knot.bharcode.com" target="_blank" style="color:#60a5fa">→ knot.bharcode.com</a>`,
      matrix: () => { launchMatrix(); return `<span style="color:#00ff41">Initialising matrix rain…</span>`; },
      game: () => `<span style="color:#fbbf24">Hint:</span> try the Konami code on any page<br>
<span style="color:#64748b">↑ ↑ ↓ ↓ ← → ← → B A</span>`,
      secret: () => `<span style="color:#fbbf24">All hidden secrets:</span><br>
  1. Type <span style="color:#f1f5f9">bharcode</span> anywhere → this terminal<br>
  2. Click the <span style="color:#f1f5f9">nav logo 5×</span> fast → matrix rain<br>
  3. Enter <span style="color:#f1f5f9">Konami code</span> → space invaders game`,
      clear: () => { out.innerHTML = ''; return null; },
      exit: () => { overlay.classList.remove('open'); return null; },
      quit: () => { overlay.classList.remove('open'); return null; },
    };

    function exec(raw) {
      const cmd = raw.trim().toLowerCase();
      write(`<span style="color:#4ade80">$ </span><span style="color:#f1f5f9">${raw}</span>`);
      if (!raw.trim()) return;
      const fn = CMDS[cmd];
      if (fn) { const r = fn(); if (r !== null && r !== undefined) write(r); }
      else write(`<span style="color:#f87171">Unknown: ${raw}. Try <span style="color:#f1f5f9">help</span></span>`);
    }

    inp.value = '';
    const handler = e => {
      if (e.key === 'Enter') { exec(inp.value); inp.value = ''; }
      if (e.key === 'Escape') { overlay.classList.remove('open'); inp.removeEventListener('keydown', handler); }
    };
    inp.addEventListener('keydown', handler);
  }

  // ── CLOSE ALL OVERLAYS ON ESC ────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.bc-overlay').forEach(el => el.classList.remove('open'));
    }
  });

  // Click backdrop to close matrix
  document.getElementById('matrix-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });

  // ── FLOATING ELEMENTS ANIMATION ──────────────────────────────────────────────
  document.querySelectorAll('[data-float]').forEach((el, i) => {
    el.style.animation = `float ${3 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`;
  });

})();

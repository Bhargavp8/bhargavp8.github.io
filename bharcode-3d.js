// ═══════════════════════════════════════════════════════════════════════════
// BHARCODE 3D ENGINE v1.0  —  lean, dependency-free spatial interactivity
// • A rotating wireframe lattice (sphere of nodes) projected by hand in canvas
// • Spins on its own · follows the mouse · drag to throw it · tilts to gyro
// • Depth parallax on [data-depth] layers (mouse + device orientation)
// No Three.js — true to the "ship lean" cause. ~6kb, 60fps.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // ── shared tilt state (mouse OR gyro), consumed by lattice + parallax ──────
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };   // -1..1, t* = target
  let gyroOn = false;

  function setTargetFromPointer(px, py) {           // px,py in 0..1 of viewport
    if (gyroOn) return;
    tilt.tx = (px - 0.5) * 2;
    tilt.ty = (py - 0.5) * 2;
  }
  window.addEventListener('mousemove', e => {
    setTargetFromPointer(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
  }, { passive: true });

  // ── GYRO: opt-in (iOS needs a user gesture to grant permission) ────────────
  function enableGyro() {
    const onOrient = e => {
      if (e.gamma == null && e.beta == null) return;
      gyroOn = true;
      // gamma: left/right [-90,90] · beta: front/back [-180,180]
      const g = Math.max(-45, Math.min(45, e.gamma || 0)) / 45;
      const b = (Math.max(-45, Math.min(45, (e.beta || 0) - 35))) / 45;
      tilt.tx = g;
      tilt.ty = b;
    };
    const start = () => window.addEventListener('deviceorientation', onOrient, true);
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(state => { if (state === 'granted') { start(); markGyro(true); } })
        .catch(() => markGyro(false));
    } else if (DOE) {
      start(); markGyro(true);
    } else {
      markGyro(false);
    }
  }
  function markGyro(ok) {
    const btn = document.getElementById('gyro-btn');
    if (!btn) return;
    btn.classList.toggle('on', ok);
    btn.querySelector('.gyro-label').textContent = ok ? 'Gyro on · tilt your phone' : 'Motion unavailable';
    if (ok) setTimeout(() => { btn.style.opacity = '0'; btn.style.pointerEvents = 'none'; }, 2600);
  }
  function wireGyroButton() {
    const btn = document.getElementById('gyro-btn');
    if (!btn) return;
    // Only meaningful where orientation exists (phones/tablets)
    const hasOrient = 'DeviceOrientationEvent' in window && window.matchMedia('(pointer: coarse)').matches;
    if (!hasOrient) { btn.style.display = 'none'; return; }
    btn.addEventListener('click', enableGyro);
  }

  // ── DEPTH PARALLAX on [data-depth] ─────────────────────────────────────────
  const layers = [...document.querySelectorAll('[data-depth]')].map(el => ({
    el, d: parseFloat(el.dataset.depth) || 10,
  }));
  function applyParallax() {
    for (const l of layers) {
      const dx = -tilt.x * l.d;
      const dy = -tilt.y * l.d;
      l.el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
    }
  }

  // ── THE LATTICE ────────────────────────────────────────────────────────────
  const canvas = document.getElementById('hero-lattice');
  let lattice = null;
  if (canvas) lattice = buildLattice(canvas);

  function buildLattice(cv) {
    const ctx = cv.getContext('2d');
    let W, H, DPR, cx, cy, R;
    let pts = [], links = [];
    let rotY = 0, rotX = -0.25, velY = 0.0016, velX = 0;
    let dragging = false, lastX = 0, lastY = 0;

    const N = window.innerWidth < 760 ? 120 : 200;

    function fib(n) {                       // fibonacci sphere → even distribution
      const out = [], gold = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = gold * i;
        out.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r,
                   pulse: Math.random() * Math.PI * 2, big: Math.random() > 0.86 });
      }
      return out;
    }
    function buildLinks() {                 // connect each node to a few neighbours
      links = [];
      const maxD = 0.46;
      for (let i = 0; i < pts.length; i++) {
        let c = 0;
        for (let j = i + 1; j < pts.length && c < 3; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, dz = pts[i].z - pts[j].z;
          if (Math.sqrt(dx*dx + dy*dy + dz*dz) < maxD) { links.push([i, j]); c++; }
        }
      }
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W * (W > 900 ? 0.62 : 0.5);      // nudge right on desktop, behind the card
      cy = H * 0.46;
      R = Math.min(W, H) * (W > 900 ? 0.34 : 0.40);
    }

    pts = fib(N); buildLinks(); resize();
    window.addEventListener('resize', resize, { passive: true });

    // drag-to-throw
    function down(x, y) { dragging = true; lastX = x; lastY = y; cv.style.cursor = 'grabbing'; }
    function move(x, y) {
      if (!dragging) return;
      velY = (x - lastX) * 0.00035;
      velX = (y - lastY) * 0.00028;
      rotY += (x - lastX) * 0.005;
      rotX += (y - lastY) * 0.005;
      lastX = x; lastY = y;
    }
    function up() { dragging = false; cv.style.cursor = 'grab'; }
    cv.style.cursor = 'grab';
    cv.addEventListener('mousedown', e => down(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => move(e.clientX, e.clientY), { passive: true });
    window.addEventListener('mouseup', up);
    cv.addEventListener('touchstart', e => { const t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: true });
    cv.addEventListener('touchmove',  e => { const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
    cv.addEventListener('touchend', up);

    const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

    function frame(t) {
      // ease shared tilt
      tilt.x += (tilt.tx - tilt.x) * 0.06;
      tilt.y += (tilt.ty - tilt.y) * 0.06;

      if (!dragging) {
        rotY += velY; rotX += velX;
        velY += (0.0016 - velY) * 0.02;     // settle back toward gentle auto-spin
        velX += (0 - velX) * 0.04;
      }
      // tilt nudges the view
      const vRotY = rotY + tilt.x * 0.5;
      const vRotX = rotX - tilt.y * 0.4;

      ctx.clearRect(0, 0, W, H);
      const cosY = Math.cos(vRotY), sinY = Math.sin(vRotY);
      const cosX = Math.cos(vRotX), sinX = Math.sin(vRotX);
      const fov = 2.6;

      // project
      const proj = pts.map(p => {
        let x = p.x, y = p.y, z = p.z;
        let x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;       // rot Y
        let y2 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;     // rot X
        const s = fov / (fov + z2);
        return { sx: cx + x1 * R * s, sy: cy + y2 * R * s, z: z2, s };
      });

      const gold = isLight() ? '184,138,30' : '232,178,58';
      const cool = isLight() ? '43,91,168' : '106,168,255';

      // links
      for (const [a, b] of links) {
        const pa = proj[a], pb = proj[b];
        const depth = (pa.z + pb.z) / 2;            // -1..1
        const alpha = Math.max(0, 0.18 * (1 - (depth + 1) / 2)) + 0.04;
        ctx.strokeStyle = `rgba(${cool},${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
      }
      // nodes
      for (let i = 0; i < proj.length; i++) {
        const p = proj[i], src = pts[i];
        const near = (p.z + 1) / 2;                  // 0 far .. 1 near
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.002 + src.pulse);
        const rad = (src.big ? 2.2 : 1.1) * p.s * (0.7 + near * 0.6);
        const a = (0.25 + near * 0.6) * (src.big ? 1 : 0.8);
        if (src.big) {
          ctx.shadowBlur = 10 * near; ctx.shadowColor = `rgba(${gold},${0.8})`;
          ctx.fillStyle = `rgba(${gold},${a * pulse})`;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(${cool},${a})`;
        }
        ctx.beginPath(); ctx.arc(p.sx, p.sy, Math.max(0.4, rad), 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;

      applyParallax();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return { resize };
  }

  // boot
  function boot() { wireGyroButton(); if (!canvas && layers.length) (function loop(){ tilt.x += (tilt.tx-tilt.x)*0.06; tilt.y += (tilt.ty-tilt.y)*0.06; applyParallax(); requestAnimationFrame(loop); })(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

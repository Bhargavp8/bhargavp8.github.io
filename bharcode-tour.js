// ═══════════════════════════════════════════════════════════════════════════
// BHARCODE GUIDED TOUR ENGINE v1.0
// A narrated, spotlight-driven walkthrough so nobody lands and feels lost.
// • First-visit welcome moment  • desktop spotlight  • mobile bottom-sheet
// • re-launchable from nav  • remembered in localStorage  • data-driven steps
//
// HOW TO EDIT THE TOUR:  just change the STEPS arrays below. Each step is a
// plain object — add, remove, or reorder freely. Missing targets are skipped.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const STORE_KEY = 'bharcode-tour-v1-done';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.matchMedia('(max-width: 760px)').matches;

  // ── STEP LIBRARY ──────────────────────────────────────────────────────────
  // `sel`   CSS selector of the element to spotlight (omit for a centred card)
  // `title` heading       `body` one-or-two sentences of "why this matters"
  // `tag`   tiny mono label     `place` preferred side (auto if omitted)
  const STEPS = {
    '/': [
      {
        center: true,
        tag: 'Welcome',
        title: 'Give me 45 seconds.',
        body: "I'm Bhargav — a CS student in Singapore who ships real products for the price of a domain. Let me walk you through what I've built instead of leaving you to guess.",
        cta: 'Start the tour',
      },
      {
        sel: '[data-tour="hero"]',
        tag: '01 · The pitch',
        title: 'This is the build log.',
        body: 'Everything here is shipped in public — real architecture decisions, real numbers, no fluff. Start at the headline, then dig as deep as you like.',
        place: 'right',
      },
      {
        sel: '[data-tour="stats"]',
        tag: '02 · Proof',
        title: 'Constraints, by the numbers.',
        body: 'A whole product portfolio running on roughly ten dollars a year. The constraint is the point — it forces every decision to be deliberate.',
        place: 'top',
      },
      {
        sel: '[data-tour="nav"]',
        tag: '03 · Get around',
        title: 'Five doors, one builder.',
        body: 'Work, Blog, Apps, About. Wherever you go, this bar follows. You can replay this tour any time from the ✦ button.',
        place: 'bottom',
      },
      {
        sel: '[data-tour="work"]',
        tag: '04 · The goods',
        title: 'Start with the shipped work.',
        body: 'Knot is a full-stack expense app with an AI parser and a Telegram bot. Each card opens the full case study.',
        place: 'top',
      },
      {
        sel: '[data-tour="newsletter"]',
        tag: '05 · Stay close',
        title: 'Follow the build, weekly.',
        body: "One email a week — real progress, real mistakes. It's the easiest way to watch a product go from zero to shipped.",
        place: 'top',
      },
      {
        sel: '[data-tour="theme"]',
        tag: '06 · Make it yours',
        title: 'Night owl? Flip the lights.',
        body: 'The whole site has a hand-tuned dark mode. And if you get curious — try typing the word “bharcode” anywhere. 👀',
        place: 'bottom',
      },
      {
        center: true,
        tag: 'You\'re set',
        title: 'That\'s the lay of the land.',
        body: 'Explore freely from here. When something catches your eye, click in — every project has a story behind it.',
        cta: 'Start exploring',
      },
    ],
    // Lightweight per-page primers (one card, no spotlight) for deep-links.
    '/work':  [{ center: true, tag: 'Work', title: 'The case studies.', body: 'Each project below is a real build — scroll for the problem, the decisions, and what shipped.', cta: 'Got it' }],
    '/apps':  [{ center: true, tag: 'Apps', title: 'Tools & bots.', body: 'Live apps and automations. The featured card up top is the flagship — the grid below is everything else.', cta: 'Got it' }],
    '/blog':  [{ center: true, tag: 'Blog', title: 'The build logs.', body: 'Long-form posts on what broke and what worked. Newest first.', cta: 'Got it' }],
    '/about': [{ center: true, tag: 'About', title: 'Meet the builder.', body: 'Skills, timeline, proof of work, and how to reach me. The cost table at the bottom is my favourite part.', cta: 'Got it' }],
  };

  const pathKey = () => {
    const p = location.pathname.replace(/\/+$/, '') || '/';
    if (p.startsWith('/blog')) return '/blog';
    return STEPS[p] ? p : null;
  };

  // ── STATE ─────────────────────────────────────────────────────────────────
  let steps = [];
  let idx = 0;
  let dir = 1;            // travel direction, so skipped/hidden steps move the right way
  let active = false;
  let els = {};

  function isVisible(el) {
    if (!el) return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    const r = el.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  }

  // ── DOM SCAFFOLD (built once, lazily) ─────────────────────────────────────
  function build() {
    if (els.root) return;

    const root = document.createElement('div');
    root.id = 'bc-tour';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `
      <div class="bc-tour-veil"></div>
      <div class="bc-tour-ring" aria-hidden="true"></div>
      <div class="bc-tour-pop" role="dialog" aria-modal="true" aria-labelledby="bc-tour-title">
        <button class="bc-tour-x" aria-label="End tour">✕</button>
        <div class="bc-tour-tag" id="bc-tour-tag"></div>
        <h3 class="bc-tour-title" id="bc-tour-title"></h3>
        <p class="bc-tour-body" id="bc-tour-body"></p>
        <div class="bc-tour-foot">
          <div class="bc-tour-rail" id="bc-tour-rail" aria-hidden="true"></div>
          <div class="bc-tour-btns">
            <button class="bc-tour-back" id="bc-tour-back">Back</button>
            <button class="bc-tour-next" id="bc-tour-next">Next</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(root);

    els = {
      root,
      veil:  root.querySelector('.bc-tour-veil'),
      ring:  root.querySelector('.bc-tour-ring'),
      pop:   root.querySelector('.bc-tour-pop'),
      tag:   root.querySelector('#bc-tour-tag'),
      title: root.querySelector('#bc-tour-title'),
      body:  root.querySelector('#bc-tour-body'),
      rail:  root.querySelector('#bc-tour-rail'),
      back:  root.querySelector('#bc-tour-back'),
      next:  root.querySelector('#bc-tour-next'),
      x:     root.querySelector('.bc-tour-x'),
    };

    els.next.addEventListener('click', next);
    els.back.addEventListener('click', prev);
    els.x.addEventListener('click', () => end(false));
    els.veil.addEventListener('click', () => { if (steps[idx] && steps[idx].center) {} });
    window.addEventListener('resize', reposition, { passive: true });
    window.addEventListener('scroll', reposition, { passive: true });
    document.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === 'Escape') end(false);
    else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
    else if (e.key === 'ArrowLeft') prev();
  }

  // ── RENDER A STEP ─────────────────────────────────────────────────────────
  function render() {
    const step = steps[idx];
    if (!step) return end(true);

    // Resolve target; skip over missing OR hidden anchors (e.g. desktop-only
    // nav links when we're on a phone) in the current travel direction.
    let target = null;
    if (!step.center && step.sel) {
      target = document.querySelector(step.sel);
      if (!isVisible(target)) {
        const nextIdx = idx + (dir < 0 ? -1 : 1);
        if (nextIdx >= 0 && nextIdx < steps.length) { idx = nextIdx; return render(); }
        // hit an edge — settle on the nearest centred step if any, else finish
        if (dir < 0) { idx = 0; return render(); }
        return end(true);
      }
    }

    els.tag.textContent = step.tag || '';
    els.tag.style.display = step.tag ? '' : 'none';
    els.title.textContent = step.title || '';
    els.body.textContent = step.body || '';

    // Footer / button copy
    const first = idx === 0;
    const last = idx === steps.length - 1;
    els.back.style.visibility = first ? 'hidden' : 'visible';
    els.next.textContent = step.cta || (last ? 'Done' : 'Next');

    // Progress rail (dots)
    els.rail.innerHTML = steps.map((_, i) =>
      `<span class="bc-dot${i === idx ? ' on' : ''}${i < idx ? ' past' : ''}"></span>`).join('');

    // Centred (welcome / finish) vs spotlight
    els.root.classList.toggle('is-center', !!step.center);
    els.root.classList.toggle('is-mobile', isMobile());

    if (step.center || !target) {
      els.ring.style.opacity = '0';
      placeCentered();
    } else {
      scrollIntoViewIfNeeded(target, () => {
        positionRing(target);
        positionPop(target, step.place);
      });
    }
    els.pop.focus?.();
  }

  function scrollIntoViewIfNeeded(target, done) {
    const r = target.getBoundingClientRect();
    const vh = window.innerHeight;
    const fullyVisible = r.top >= 70 && r.bottom <= vh - 20;
    if (fullyVisible) { done(); return; }
    const y = window.scrollY + r.top - vh * 0.32;
    window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? 'auto' : 'smooth' });
    // wait for smooth scroll to settle
    let ticks = 0;
    const wait = setInterval(() => {
      ticks++;
      if (ticks > 28) { clearInterval(wait); done(); return; }
      const rr = target.getBoundingClientRect();
      if (rr.top >= 40 && rr.bottom <= vh) { clearInterval(wait); done(); }
    }, reduceMotion ? 0 : 16);
    setTimeout(done, reduceMotion ? 0 : 60); // first paint so it never feels stuck
  }

  // ── POSITIONING ───────────────────────────────────────────────────────────
  function positionRing(target) {
    const r = target.getBoundingClientRect();
    const pad = 8;
    Object.assign(els.ring.style, {
      opacity: '1',
      top:    (r.top - pad) + 'px',
      left:   (r.left - pad) + 'px',
      width:  (r.width + pad * 2) + 'px',
      height: (r.height + pad * 2) + 'px',
    });
  }

  function positionPop(target, prefer) {
    const pop = els.pop;
    if (isMobile()) { pop.classList.add('sheet'); pop.removeAttribute('style'); return; }
    pop.classList.remove('sheet');

    const r = target.getBoundingClientRect();
    const pw = pop.offsetWidth || 340;
    const ph = pop.offsetHeight || 220;
    const gap = 18;
    const vw = window.innerWidth, vh = window.innerHeight;

    const space = {
      bottom: vh - r.bottom, top: r.top,
      right: vw - r.right, left: r.left,
    };
    let place = prefer;
    const fits = { bottom: space.bottom > ph + gap, top: space.top > ph + gap,
                   right: space.right > pw + gap, left: space.left > pw + gap };
    if (!place || !fits[place]) {
      place = ['bottom', 'top', 'right', 'left'].find(p => fits[p]) || 'bottom';
    }

    let top, left;
    if (place === 'bottom') { top = r.bottom + gap; left = r.left + r.width / 2 - pw / 2; }
    else if (place === 'top') { top = r.top - ph - gap; left = r.left + r.width / 2 - pw / 2; }
    else if (place === 'right') { left = r.right + gap; top = r.top + r.height / 2 - ph / 2; }
    else { left = r.left - pw - gap; top = r.top + r.height / 2 - ph / 2; }

    left = Math.max(14, Math.min(left, vw - pw - 14));
    top  = Math.max(14, Math.min(top, vh - ph - 14));

    Object.assign(pop.style, {
      top: top + 'px', left: left + 'px',
      right: 'auto', bottom: 'auto', transform: 'none',
    });
    pop.dataset.place = place;
  }

  function placeCentered() {
    const pop = els.pop;
    if (isMobile()) { pop.classList.add('sheet'); pop.removeAttribute('style'); return; }
    pop.classList.remove('sheet');
    pop.dataset.place = 'center';
    Object.assign(pop.style, {
      top: '50%', left: '50%', right: 'auto', bottom: 'auto',
      transform: 'translate(-50%,-50%)',
    });
  }

  function reposition() {
    if (!active) return;
    const step = steps[idx];
    if (!step) return;
    if (step.center) { placeCentered(); return; }
    const target = document.querySelector(step.sel);
    if (target) { positionRing(target); positionPop(target, step.place); }
  }

  // ── FLOW ──────────────────────────────────────────────────────────────────
  function next() { dir = 1; if (idx >= steps.length - 1) return end(true); idx++; render(); }
  function prev() { dir = -1; if (idx <= 0) return; idx--; render(); }

  function start(fromWelcome) {
    const key = pathKey();
    if (!key) return;
    build();
    steps = STEPS[key];
    // On homepage, the first step is the welcome card; on deep pages we still
    // want the single primer card — both handled the same way.
    idx = 0; dir = 1;
    active = true;
    document.body.classList.add('bc-tour-lock');
    els.root.classList.add('open');
    els.root.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(render);
  }

  function end(completed) {
    active = false;
    document.body.classList.remove('bc-tour-lock');
    if (els.root) {
      els.root.classList.remove('open');
      els.root.setAttribute('aria-hidden', 'true');
    }
    if (completed) localStorage.setItem(STORE_KEY, '1');
    // reset scroll lock; keep their scroll position
  }

  // ── PUBLIC TRIGGER ────────────────────────────────────────────────────────
  // Anything with [data-tour-start] replays the tour.
  function wireTriggers() {
    document.querySelectorAll('[data-tour-start]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        // close mobile menu if open
        document.getElementById('mobile-menu')?.classList.remove('open');
        document.body.classList.remove('menu-open');
        document.getElementById('hamburger')?.classList.remove('open');
        localStorage.removeItem(STORE_KEY);
        start(false);
      });
    });
  }

  // ── BOOT ──────────────────────────────────────────────────────────────────
  function boot() {
    wireTriggers();
    const key = pathKey();
    if (!key) return;
    const done = localStorage.getItem(STORE_KEY);
    // Auto-launch only on the homepage, only once, and never mid-scroll.
    if (!done && (location.pathname === '/' || location.pathname === '')) {
      // small beat so the hero entrance animation can play first
      setTimeout(() => start(true), reduceMotion ? 200 : 900);
    }
  }

  // expose for console / future hooks
  window.BharTour = { start: () => { localStorage.removeItem(STORE_KEY); start(false); }, end };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

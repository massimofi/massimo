// Massimo Arellano — Portfolio
// Lenis + anime.js + GSAP ScrollTrigger + Barba

document.documentElement.classList.remove('no-js');

// ============================================
// LENIS SMOOTH SCROLL
// ============================================
let lenis;
function initLenis() {
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({
    // lerp: 1 means no smoothing — scroll is instant, 1:1 with input
    lerp: 1,
    smoothWheel: true,
    wheelMultiplier: 1.0,
  });

  lenis.on('scroll', () => {
    if (window.ScrollTrigger) ScrollTrigger.update();
  });

  if (window.gsap) {
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  window.lenis = lenis;
}

// ============================================
// PDF PREVIEW MODAL
// ============================================
function initPdfModal() {
  const modal = document.getElementById('pdfModal');
  if (!modal || modal.dataset.init === 'done') return;
  modal.dataset.init = 'done';

  const frame = document.getElementById('modalFrame');
  const titleEl = document.getElementById('modalTitle');
  const metaEl = document.getElementById('modalMeta');
  const dlBtn = document.getElementById('modalDownload');
  const closeBtn = document.getElementById('modalClose');

  const openModal = (src, title, meta) => {
    titleEl.textContent = title || 'Preview';
    metaEl.textContent = meta || 'Document';
    dlBtn.href = src;
    dlBtn.setAttribute('download', '');
    frame.src = src + '#toolbar=1&navpanes=0&view=FitH';
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (window.lenis) window.lenis.stop();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    frame.src = '';
    document.body.style.overflow = '';
    if (window.lenis) window.lenis.start();
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  // Bind preview triggers
  document.querySelectorAll('[data-preview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.preview;
      const title = btn.dataset.previewTitle || 'Preview';
      const meta = btn.dataset.previewMeta || '';
      openModal(src, title, meta);
    });
  });
}

// ============================================
// CARD TILT (3D mouse-follow)
// ============================================
function initCardTilt() {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    if (card.dataset.tiltInit === 'done') return;
    card.dataset.tiltInit = 'done';

    let rafId = null;

    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * -6; // pitch
      const ry = (px - 0.5) * 6;  // yaw

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      });
    };

    const onLeave = () => {
      if (rafId) cancelAnimationFrame(rafId);
      card.style.transform = '';
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
}

// ============================================
// CARD RIPPLE (click / hover pulse)
// ============================================
function initCardRipple() {
  document.querySelectorAll('[data-ripple]').forEach((card) => {
    if (card.dataset.rippleInit === 'done') return;
    card.dataset.rippleInit = 'done';

    card.addEventListener('mouseenter', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.className = 'card-ripple';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.width = '10px';
      ripple.style.height = '10px';
      card.appendChild(ripple);

      const maxDim = Math.max(rect.width, rect.height) * 2.5;

      anime({
        targets: ripple,
        scale: [0, maxDim / 10],
        opacity: [0.4, 0],
        duration: 900,
        easing: 'easeOutQuart',
        complete: () => ripple.remove(),
      });
    });
  });
}

// ============================================
// NUMBER MORPH (count up on scroll-in)
// ============================================
function initNumberMorph() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.project-card__stat').forEach((el) => {
    if (el.dataset.morphInit === 'done') return;
    el.dataset.morphInit = 'done';

    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);

    // Find the closest pinned container so we trigger during horizontal scroll
    const horizontal = document.querySelector('.projects__horizontal');

    ScrollTrigger.create({
      trigger: el,
      start: 'left 90%',
      containerAnimation: window.__projectsScrollTween || undefined,
      once: true,
      onEnter: () => {
        const obj = { v: 0 };
        anime({
          targets: obj,
          v: target,
          duration: 1400,
          easing: 'easeOutQuart',
          update: () => {
            el.textContent = obj.v.toFixed(decimals);
          },
        });
      },
    });

    // Fallback: if still 0 after 2.5s (scroll-trigger didn't fire), just run it
    setTimeout(() => {
      if (el.textContent === '0' || el.textContent === '0.0') {
        const obj = { v: 0 };
        anime({
          targets: obj,
          v: target,
          duration: 1400,
          easing: 'easeOutQuart',
          update: () => { el.textContent = obj.v.toFixed(decimals); },
        });
      }
    }, 2500);
  });
}

// ============================================
// SPLIT TEXT HELPERS
// ============================================
function splitLetters(el) {
  if (!el || el.dataset.split === 'done') return;
  // Preserve nested <span class="italic"> etc
  const walk = (node) => {
    const children = [...node.childNodes];
    children.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        [...child.textContent].forEach((ch) => {
          if (ch === ' ') {
            frag.appendChild(document.createTextNode('\u00A0'));
          } else {
            const s = document.createElement('span');
            s.className = 'letter';
            s.textContent = ch;
            frag.appendChild(s);
          }
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(el);
  el.dataset.split = 'done';
}

function splitTitleWords(el) {
  if (!el || el.dataset.split === 'done') return;
  const text = el.textContent;
  const words = text.split(' ');
  el.textContent = '';
  words.forEach((w, i) => {
    const wrap = document.createElement('span');
    wrap.className = 'title-word';
    const inner = document.createElement('span');
    inner.className = 'title-inner';
    inner.textContent = w;
    wrap.appendChild(inner);
    el.appendChild(wrap);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  el.dataset.split = 'done';
}

// ============================================
// DRIFTING DOTS (hero background) — canvas
// Simple, reliable, no library dependencies
// ============================================
function initHeroGrid() {
  const container = document.querySelector('.hero__grid');
  if (!container || container.dataset.init === 'done') return;
  container.dataset.init = 'done';

  // Replace the SVG container with a canvas
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    // Clear the SVG element's interior and append canvas
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  let dots = [];
  let w = 0, h = 0, dpr = 1;
  let rafId = null;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = container.clientWidth;
    h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  };
  resize();

  // Build dots
  const DOT_COUNT = 140;
  dots = [];
  for (let i = 0; i < DOT_COUNT; i++) {
    dots.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.0 + Math.random() * 1.8,
      baseOp: 0.25 + Math.random() * 0.35,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const draw = (t) => {
    const time = t / 1000;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fffbea';

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      d.x += d.vx;
      d.y += d.vy;

      // Wrap around edges
      if (d.x < -5) d.x = w + 5;
      if (d.x > w + 5) d.x = -5;
      if (d.y < -5) d.y = h + 5;
      if (d.y > h + 5) d.y = -5;

      // Gentle breathing opacity
      const breath = 0.7 + 0.3 * Math.sin(time * 0.4 + d.phase);
      const op = d.baseOp * breath;

      ctx.globalAlpha = op;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(draw);
  };

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resize();
      // Re-seed dot positions to new viewport
      dots.forEach((d) => {
        if (d.x > w) d.x = Math.random() * w;
        if (d.y > h) d.y = Math.random() * h;
      });
    }, 200);
  });
}

// ============================================
// HERO CHART — 3D candlesticks with mouse-parallax tilt (no scroll morph)
// ============================================
function initHeroChart() {
  const canvas = document.querySelector('.hero__poly');
  if (!canvas || canvas.dataset.init === 'done') return;
  canvas.dataset.init = 'done';

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  // Seeded PRNG so the candle layout is the same every render
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  // Build 10 candles — each is a cuboid body + 2 wick line segments.
  // 12 vertices/candle, 14 edges/candle: (12 cube edges + 2 wicks).
  const NUM = 10;
  const SPACING = 1.0;
  const BODY_W = 0.55;
  const BODY_D = 0.28;
  const verts = [];
  const edges = [];

  for (let i = 0; i < NUM; i++) {
    const x = (i - (NUM - 1) / 2) * SPACING;
    const bodyH = 0.45 + rand() * 1.4;
    const centerY = (rand() - 0.5) * 0.55;
    const bodyTop = centerY + bodyH / 2;
    const bodyBot = centerY - bodyH / 2;
    const wickTop = bodyTop + 0.1 + rand() * 0.45;
    const wickBot = bodyBot - 0.1 - rand() * 0.45;
    const up = rand() > 0.45;
    const base = verts.length;

    const hx = BODY_W / 2, hz = BODY_D / 2;
    verts.push([x - hx, bodyBot, -hz]); // 0 front-bot-left
    verts.push([x + hx, bodyBot, -hz]); // 1 front-bot-right
    verts.push([x + hx, bodyTop, -hz]); // 2 front-top-right
    verts.push([x - hx, bodyTop, -hz]); // 3 front-top-left
    verts.push([x - hx, bodyBot,  hz]); // 4 back-bot-left
    verts.push([x + hx, bodyBot,  hz]); // 5 back-bot-right
    verts.push([x + hx, bodyTop,  hz]); // 6 back-top-right
    verts.push([x - hx, bodyTop,  hz]); // 7 back-top-left
    verts.push([x, bodyTop, 0]);        // 8 top wick base
    verts.push([x, wickTop, 0]);        // 9 top wick tip
    verts.push([x, bodyBot, 0]);        // 10 bot wick base
    verts.push([x, wickBot, 0]);        // 11 bot wick tip

    const cubeEdges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ];
    for (const [a, b] of cubeEdges) edges.push({ a: base + a, b: base + b, up });
    edges.push({ a: base + 8,  b: base + 9,  up });
    edges.push({ a: base + 10, b: base + 11, up });
  }

  const N = verts.length;

  // Rotation state:
  //   target* = what mouse position wants
  //   current* = what the draw loop actually uses (lerped toward target each frame)
  const state = {
    targetRx: 0, targetRy: 0,
    currentRx: 0, currentRy: 0,
  };

  const rotate = (v, rx, ry, rz) => {
    let [x, y, z] = v;
    let c, s, x1, y1, z1;
    c = Math.cos(rx); s = Math.sin(rx);
    y1 = y * c - z * s; z1 = y * s + z * c; y = y1; z = z1;
    c = Math.cos(ry); s = Math.sin(ry);
    x1 = x * c + z * s; z1 = -x * s + z * c; x = x1; z = z1;
    c = Math.cos(rz); s = Math.sin(rz);
    x1 = x * c - y * s; y1 = x * s + y * c;
    return [x1, y1, z];
  };

  const LERP = 0.08;
  const draw = () => {
    // Lerp toward mouse target each frame so the tilt feels weighted
    state.currentRx += (state.targetRx - state.currentRx) * LERP;
    state.currentRy += (state.targetRy - state.currentRy) * LERP;

    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    // Candle row spans 9.55 world units across (10 candles, spacing 1).
    // unit = w/10 makes the row fill ~95% of the canvas width so the
    // chart dominates the hero. Focal = 25 unit keeps perspective
    // amplification small so mouse-parallax tilt (±10°) never pushes
    // vertices past the canvas bounds: worst-case projection under
    // that tilt is ~0.46w, well inside the 0.5w half-extent.
    const unit = w / 10;
    const focal = unit * 25;
    const rx = state.currentRx, ry = state.currentRy, rz = 0;

    const pts = new Array(N);
    for (let i = 0; i < N; i++) {
      const v = verts[i];
      const r = rotate([v[0], v[1], v[2]], rx, ry, rz);
      const zDenom = focal - r[2] * unit;
      const zFactor = zDenom > unit ? focal / zDenom : 1.6;
      pts[i] = { x: cx + r[0] * unit * zFactor, y: cy + r[1] * unit * zFactor, z: r[2] };
    }

    const sorted = edges.map((e) => ({ e, avgZ: (pts[e.a].z + pts[e.b].z) / 2 }))
      .sort((p, q) => p.avgZ - q.avgZ);

    for (const it of sorted) {
      const e = it.e;
      const A = pts[e.a], B = pts[e.b];
      const depth = Math.max(0, Math.min(1, (it.avgZ + 4) / 8));
      const alpha = 0.10 + depth * 0.55;
      const width = 0.45 + depth * 1.3;
      // Up candles: off-white. Down candles: quieter navy tint.
      // Staying on-brand — no red/green.
      ctx.strokeStyle = e.up
        ? `rgba(255, 251, 234, ${alpha})`
        : `rgba(140, 170, 220, ${alpha * 0.85})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }

    // Quiet vertex dots at each candle corner + wick tip
    for (let i = 0; i < N; i++) {
      const p = pts[i];
      const depth = Math.max(0, Math.min(1, (p.z + 3) / 6));
      ctx.fillStyle = `rgba(255, 251, 234, ${(0.2 + depth * 0.5) * 0.55})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.6 + depth * 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const loop = () => { draw(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);

  // Mouse parallax — tilt up to ±10° on X and Y axes, centered on the
  // viewport. Listen on window so events fire regardless of which section
  // is under the cursor; the canvas is the dominant element at the top
  // of the page, so it stays reactive until the user scrolls past it.
  const MAX_TILT = Math.PI / 18; // 10°
  const onMouseMove = (e) => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const dx = (e.clientX - vw / 2) / (vw / 2);
    const dy = (e.clientY - vh / 2) / (vh / 2);
    state.targetRy = Math.max(-1, Math.min(1, dx)) * MAX_TILT;
    state.targetRx = -Math.max(-1, Math.min(1, dy)) * MAX_TILT;
  };
  const resetTilt = () => {
    state.targetRx = 0;
    state.targetRy = 0;
  };
  window.addEventListener('mousemove', onMouseMove);
  // When the cursor leaves the window entirely, ease back to neutral.
  document.addEventListener('mouseleave', resetTilt);

  requestAnimationFrame(() => canvas.classList.add('is-ready'));

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });
}

// ============================================
// PROJECTS HORIZONTAL SCROLL
// ============================================
function initProjectsScroll() {
  const track = document.querySelector('.projects__track');
  if (!track || track.dataset.init === 'done') return;
  track.dataset.init = 'done';
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  // Mobile: ditch the horizontal pin. Reveal each card as it scrolls into view.
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  if (isMobile) {
    document.querySelectorAll('.project-card').forEach((card) => {
      const titleEl = card.querySelector('.project-card__title');
      if (titleEl) splitTitleWords(titleEl);
      ScrollTrigger.create({
        trigger: card,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          card.classList.add('is-revealed');
          anime({
            targets: card.querySelectorAll('.title-inner'),
            translateY: ['110%', '0%'],
            duration: 900,
            delay: anime.stagger(40),
            easing: 'easeOutQuart',
          });
        },
      });
    });
    return;
  }

  const totalWidth = () => track.scrollWidth - window.innerWidth;

  const cards = track.querySelectorAll('.project-card');
  const n = cards.length;

  // Build a stepped animation: scroll slows (dwells) on each card, then moves quickly to next
  // We use a timeline with `hold` segments between the `travel` segments
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.projects__horizontal',
      start: 'top top',
      // Extra distance so the dwell segments have room to feel
      end: () => `+=${totalWidth() * 1.95}`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
    }
  });

  // 4 cards means 3 transitions. Each segment: dwell on card, then travel to next.
  // Tuning: with end=1.95 * totalWidth and these fractions, hold-per-card in
  // scroll units is 0.52/4.03 * 1.95 ≈ 0.252 of totalWidth (was 0.167 before,
  // so ~50% more dwell per card). Travel-per-card stays near 0.315 — unchanged.
  const holdFraction = 0.52;
  const travelFraction = 0.65;
  const segments = n - 1;      // number of transitions

  for (let i = 0; i < segments; i++) {
    const from = -(i * window.innerWidth);
    const to = -((i + 1) * window.innerWidth);
    // Hold on current card
    tl.to(track, { x: from, duration: holdFraction, ease: 'none' });
    // Travel to next card with eased motion
    tl.to(track, { x: to, duration: travelFraction, ease: 'power2.inOut' });
  }
  // Final hold on last card
  tl.to(track, { x: -(segments * window.innerWidth), duration: holdFraction, ease: 'none' });

  window.__projectsScrollTween = tl;
  const scrollTween = tl;

  const progressBar = document.querySelector('.progress-bar');
  const progressFill = document.querySelector('.progress-bar__fill');
  if (progressFill) {
    ScrollTrigger.create({
      trigger: '.projects__horizontal',
      start: 'top top',
      end: () => `+=${totalWidth() * 1.95}`,
      scrub: true,
      onEnter: () => progressBar && progressBar.classList.add('is-active'),
      onEnterBack: () => progressBar && progressBar.classList.add('is-active'),
      onLeave: () => progressBar && progressBar.classList.remove('is-active'),
      onLeaveBack: () => progressBar && progressBar.classList.remove('is-active'),
      onUpdate: (self) => {
        progressFill.style.width = (self.progress * 100) + '%';
      }
    });
  }

  // Reveal each card's title as it enters
  document.querySelectorAll('.project-card').forEach((card) => {
    const titleEl = card.querySelector('.project-card__title');
    if (titleEl) splitTitleWords(titleEl);

    ScrollTrigger.create({
      trigger: card,
      containerAnimation: scrollTween,
      start: 'left 80%',
      onEnter: () => {
        anime({
          targets: card.querySelectorAll('.title-inner'),
          translateY: ['110%', '0%'],
          duration: 900,
          delay: anime.stagger(40),
          easing: 'easeOutQuart',
        });
      }
    });
  });
}

// ============================================
// PAGE INIT
// ============================================
function initHome() {
  const nameEl = document.querySelector('.hero__name');
  if (nameEl) {
    const fullText = nameEl.textContent.trim();
    nameEl.innerHTML = '<span class="typed-text"></span><span class="typed-caret">|</span>';
    const typedEl = nameEl.querySelector('.typed-text');
    const caret = nameEl.querySelector('.typed-caret');

    // Type out character by character
    let i = 0;
    const typeSpeed = 85; // ms per character
    const startDelay = 300;

    const typeNext = () => {
      if (i <= fullText.length) {
        typedEl.textContent = fullText.slice(0, i);
        i++;
        // Random slight variation in speed for a natural feel
        const jitter = (Math.random() - 0.5) * 30;
        setTimeout(typeNext, typeSpeed + jitter);
      } else {
        // Typing done — stop the blink and hide the caret. Name stays as-is.
        caret.style.animation = 'none';
        caret.style.transition = 'opacity 0.25s ease';
        caret.style.opacity = '0';
      }
    };
    setTimeout(typeNext, startDelay);
  }

  if (window.anime) {
    anime({
      targets: '.hero__subtitle',
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 900,
      delay: 900,
      easing: 'easeOutQuart',
    });
  }

  initHeroGrid();
  initHeroChart();
  initProjectsScroll();
  initCardTilt();
  initCardRipple();
  initNumberMorph();
  initPdfModal();

  // Animate the "04" projects count
  const countEl = document.querySelector('[data-count-to]');
  if (countEl && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const target = parseInt(countEl.dataset.countTo, 10);
    ScrollTrigger.create({
      trigger: countEl,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        if (!window.anime) { countEl.textContent = String(target).padStart(2, '0'); return; }
        const obj = { v: 0 };
        anime({
          targets: obj,
          v: target,
          duration: 1000,
          easing: 'easeOutQuart',
          round: 1,
          update: () => {
            countEl.textContent = String(obj.v).padStart(2, '0');
          },
        });
      },
    });
  }
}

// ============================================
// BOOT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const ns = document.querySelector('main [data-page]')?.dataset.page;

  initLenis();

  if (ns === 'home') initHome();

  // Handle hash on initial load (e.g. /index.html#contact)
  if (window.location.hash && ns === 'home') {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        if (window.lenis) {
          window.lenis.scrollTo(target, { offset: -60, immediate: false });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 600);
    }
  }

  // Anchor-link smooth scrolling (Projects / Contact nav links)
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (window.lenis) {
        window.lenis.scrollTo(target, { offset: -60 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

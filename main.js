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
// HERO POLYHEDRON (wireframe icosahedron)
// Ambient rotation (anime.js) + scroll-driven tilt (ScrollTrigger)
// ============================================
function initHeroPoly() {
  const canvas = document.querySelector('.hero__poly');
  if (!canvas || canvas.dataset.init === 'done') return;
  canvas.dataset.init = 'done';

  const ctx = canvas.getContext('2d');
  const hero = document.querySelector('.hero');
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

  // Icosahedron: 12 vertices, 30 edges. Golden-ratio rectangle construction.
  const P = (1 + Math.sqrt(5)) / 2; // ~1.618
  const V = [
    [-1,  P,  0], [ 1,  P,  0], [-1, -P,  0], [ 1, -P,  0],
    [ 0, -1,  P], [ 0,  1,  P], [ 0, -1, -P], [ 0,  1, -P],
    [ P,  0, -1], [ P,  0,  1], [-P,  0, -1], [-P,  0,  1],
  ];
  // Edges: unique pairs at minimum distance (= 2 for this construction).
  const E = [];
  for (let i = 0; i < V.length; i++) {
    for (let j = i + 1; j < V.length; j++) {
      const dx = V[i][0] - V[j][0];
      const dy = V[i][1] - V[j][1];
      const dz = V[i][2] - V[j][2];
      const d2 = dx*dx + dy*dy + dz*dz;
      if (Math.abs(d2 - 4) < 0.001) E.push([i, j]);
    }
  }

  // Rotation state — anime.js drives ambient; ScrollTrigger adds scroll tilt.
  const state = {
    ambientX: 0,
    ambientY: 0,
    ambientZ: 0,
    scrollX: 0,
    scrollY: 0,
    scale: 1,
  };

  const rot = (v, rx, ry, rz) => {
    let [x, y, z] = v;
    // X
    let c = Math.cos(rx), s = Math.sin(rx);
    let y1 = y * c - z * s, z1 = y * s + z * c;
    y = y1; z = z1;
    // Y
    c = Math.cos(ry); s = Math.sin(ry);
    let x1 = x * c + z * s; z1 = -x * s + z * c;
    x = x1; z = z1;
    // Z
    c = Math.cos(rz); s = Math.sin(rz);
    x1 = x * c - y * s; y1 = x * s + y * c;
    return [x1, y1, z];
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.38 * state.scale; // radius in px
    const focal = R * 3.2;

    const rx = state.ambientX + state.scrollX;
    const ry = state.ambientY + state.scrollY;
    const rz = state.ambientZ;

    // Project vertices
    const pts = V.map((v) => {
      const r = rot(v, rx, ry, rz);
      const zFactor = focal / (focal + r[2] * R);
      return {
        x: cx + r[0] * R * zFactor,
        y: cy + r[1] * R * zFactor,
        z: r[2], // normalized depth (-~1.9..1.9 for icosahedron with unit scale factor)
        zFactor,
      };
    });

    // Sort edges by average depth (painter's algo for fake-3D feel)
    const edges = E.map(([a, b]) => ({
      a, b,
      avgZ: (pts[a].z + pts[b].z) / 2,
    })).sort((e1, e2) => e1.avgZ - e2.avgZ); // back first

    for (const e of edges) {
      const A = pts[e.a], B = pts[e.b];
      // Front edges brighter + thicker
      const depth = (e.avgZ + 2) / 4; // 0..1, back..front
      const alpha = 0.12 + depth * 0.58;
      const width = 0.5 + depth * 1.4;
      ctx.strokeStyle = `rgba(255, 251, 234, ${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }

    // Tiny dot on each vertex, scale by depth
    for (const p of pts) {
      const depth = (p.z + 2) / 4;
      const r = 1.3 + depth * 1.8;
      ctx.fillStyle = `rgba(255, 251, 234, ${0.3 + depth * 0.5})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  let rafId = null;
  const loop = () => {
    draw();
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  // Ambient rotation via anime.js — slow, continuous on all three axes.
  if (window.anime) {
    anime({
      targets: state,
      ambientY: Math.PI * 2,
      duration: 24000,
      easing: 'linear',
      loop: true,
    });
    anime({
      targets: state,
      ambientX: Math.PI * 2,
      duration: 38000,
      easing: 'linear',
      loop: true,
    });
    anime({
      targets: state,
      ambientZ: Math.PI * 2,
      duration: 60000,
      easing: 'linear',
      loop: true,
    });
  }

  // Reveal
  requestAnimationFrame(() => canvas.classList.add('is-ready'));

  // Scroll-driven tilt: as user scrolls through the hero, the poly tilts
  // and scales as if being dragged by the scroll.
  if (window.gsap && window.ScrollTrigger && hero) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(state, {
      scrollX: Math.PI * 1.1,
      scrollY: Math.PI * 0.8,
      scale: 0.82,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
  }

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
      end: () => `+=${totalWidth() * 1.6}`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
    }
  });

  // 4 cards means 3 transitions. Each segment: dwell on card, then travel to next.
  const holdFraction = 0.35;   // fraction of each segment spent "holding" on a card
  const travelFraction = 0.65; // fraction spent moving to next card
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
      end: () => `+=${totalWidth() * 1.6}`,
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
        // Blink the caret a few times, then fade it out
        setTimeout(() => {
          caret.style.transition = 'opacity 0.4s ease';
          caret.style.opacity = '0';
        }, 1500);
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
  initHeroPoly();
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

function initResume() {
  const title = document.querySelector('.resume__title');
  if (title && window.anime) {
    splitLetters(title);
    anime({
      targets: '.resume__title .letter',
      translateY: ['110%', '0%'],
      opacity: [0, 1],
      duration: 900,
      delay: anime.stagger(25, { start: 100 }),
      easing: 'easeOutQuart',
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

  // Only init Lenis on scrollable pages
  if (ns !== 'resume') initLenis();

  if (ns === 'home') initHome();
  else if (ns === 'resume') initResume();

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

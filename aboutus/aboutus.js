const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function onReady(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn, { once: true });
}

onReady(() => {
  const animated = document.querySelectorAll('[data-animate]');
  if (!prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('show');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    animated.forEach(el => io.observe(el));
  } else {
    animated.forEach(el => el.classList.add('show'));
  }

  const counters = Array.from(document.querySelectorAll('[data-counter]'));
  counters.forEach(el => animateCounter(el, Number(el.getAttribute('data-target') || '0')));

  const tiltCards = Array.from(document.querySelectorAll('.glass-card'));
  tiltCards.forEach(setupTilt);

  setupCarousel();
  setupHeaderDropdown();
  setupMobileMenu();
  setupFloatersPhysics();
  setupLiquidIntro();
  setupBubbleMenu();
});

function animateCounter(el, target) {
  let current = 0;
  const duration = 2200;
  const start = performance.now();
  const isK = target > 1000;
  const endValue = target;

  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    current = Math.floor(endValue * easeOutCubic(p));
    el.textContent = isK ? formatK(current) : String(current);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function setupFloatersPhysics() {
  if (prefersReduced) return;
  const container = document.querySelector('.floaters');
  const hero = document.querySelector('.hero');
  const heroText = document.querySelector('.hero .hero-text');
  if (!container || !hero) return;
  container.classList.add('physics');

  const base = Array.from(container.querySelectorAll('.floater'));
  const clonesNeeded = window.innerWidth < 700 ? 4 : 8;
  const pool = [];
  for (let i = 0; i < clonesNeeded; i++) {
    const srcEl = base[i % base.length];
    const c = srcEl.cloneNode(true);
    c.classList.add('gen');
    container.appendChild(c);
    pool.push(c);
  }
  const elems = base.concat(pool).concat(Array.from(container.querySelectorAll('.deco')));

  let rectBox = container.getBoundingClientRect();
  let rect = { width: rectBox.width, height: rectBox.height };
  let heroRect = hero.getBoundingClientRect();
  let heroTextRect = heroText ? heroText.getBoundingClientRect() : null;
  const state = elems.map((el, i) => {
    const x = rect.width * (0.02 + 0.96 * Math.random());
    const y = rect.height * (0.02 + 0.96 * Math.random());
    return {
      el,
      x, y,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      s: el.classList.contains('floater') ? 1 : 0.9,
      p: 0.6 + Math.random() * 0.7,
      seed: Math.random() * 1000
    };
  });

  let lastY = window.scrollY;
  let scrollV = 0;
  // Interaksi kursor dinonaktifkan agar kembali seperti sebelumnya (melayang natural).

  function step(now) {
    const dt = 16;
    const sy = window.scrollY;
    scrollV = scrollV * 0.85 + (sy - lastY) * 0.15;
    lastY = sy;

    rectBox = container.getBoundingClientRect();
    rect = { width: rectBox.width, height: rectBox.height };
    heroRect = hero.getBoundingClientRect();
    heroTextRect = heroText ? heroText.getBoundingClientRect() : null;

    for (const p of state) {
      const n = Math.sin((now * 0.001 + p.seed) * 1.3) * 0.4;
      const m = Math.cos((now * 0.0012 + p.seed * 1.7)) * 0.4;
      p.vx += n * 0.02;
      p.vy += m * 0.02 + scrollV * -0.02 * p.p;

      // Tidak mengikuti kursor: hanya noise + efek scroll

      // Repel from hero text area to avoid piling over the heading
      if (heroTextRect) {
        const tx = heroTextRect.left + heroTextRect.width / 2;
        const ty = heroTextRect.top + heroTextRect.height / 2;
        const dx = (p.x - tx);
        const dy = (p.y - ty);
        const dist2 = dx * dx + dy * dy;
        const radius = Math.max(heroTextRect.width, heroTextRect.height) * 0.6;
        if (dist2 < radius * radius) {
          const force = (radius / Math.max(60, Math.sqrt(dist2))) * 0.006;
          p.vx += (dx / (Math.sqrt(dist2) + 1)) * force;
          p.vy += (dy / (Math.sqrt(dist2) + 1)) * force;
        }
      }

      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;

      const pad = 16;
      if (p.x < pad) { p.x = pad; p.vx = Math.abs(p.vx) * 0.6; }
      if (p.x > rect.width - pad) { p.x = rect.width - pad; p.vx = -Math.abs(p.vx) * 0.6; }
      if (p.y < pad) { p.y = pad; p.vy = Math.abs(p.vy) * 0.6; }
      if (p.y > rect.height - pad) { p.y = rect.height - pad; p.vy = -Math.abs(p.vy) * 0.6; }

      const ix = p.x, iy = p.y, scale = p.s;
      p.el.style.transform = `translate(${ix}px, ${iy}px) translate(-50%, -50%) scale(${scale})`;
      p.el.style.opacity = '1';
    }
    requestAnimationFrame(step);
  }
  for (const el of elems) {
    el.style.position = 'absolute';
    el.style.left = '0';
    el.style.top = '0';
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, -50%) scale(1)';
  }
  requestAnimationFrame(step);
  window.addEventListener('resize', () => {
    rectBox = container.getBoundingClientRect();
    rect = { width: rectBox.width, height: rectBox.height };
  });
}

function setupLiquidIntro() {
  const el = document.getElementById('liquid-intro');
  if (!el) return;
  const html = document.documentElement;
  if (prefersReduced) {
    html.classList.remove('loading');
    el.remove();
    return;
  }
  setTimeout(() => {
    html.classList.remove('loading');
    el.remove();
  }, 2000);
}
function formatK(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k+';
  return n + '+';
}

function easeOutCubic(t) {
  const k = 1 - t;
  return 1 - k * k * k;
}

function setupTilt(card) {
  const max = 10;
  const enter = () => card.style.transition = 'transform .2s ease-out';
  const leave = () => {
    card.style.transition = 'transform .5s ease';
    card.style.transform = '';
  };
  const move = (e) => {
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);
    const rx = (-dy * max).toFixed(2);
    const ry = (dx * max).toFixed(2);
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
  };
  card.addEventListener('mouseenter', enter);
  card.addEventListener('mousemove', move);
  card.addEventListener('mouseleave', leave);
}

function setupCarousel() {
  const viewport = document.querySelector('.carousel-viewport');
  const track = document.querySelector('.carousel-track');
  const prev = document.querySelector('.carousel .prev');
  const next = document.querySelector('.carousel .next');
  if (!viewport || !track || !prev || !next) return;

  let index = 0;
  let cardWidth = 0;
  let visible = 0;
  let total = Array.from(track.children).length;

  function measure() {
    const first = track.querySelector('.book-card');
    if (!first) return;
    cardWidth = first.getBoundingClientRect().width + 16;
    visible = Math.max(1, Math.floor(viewport.getBoundingClientRect().width / cardWidth));
    moveTo(index);
  }

  function moveTo(i) {
    const maxIndex = Math.max(0, total - visible);
    index = Math.min(Math.max(0, i), maxIndex);
    const x = -(index * cardWidth);
    track.style.transform = `translateX(${x}px)`;
  }

  prev.addEventListener('click', () => moveTo(index - 1));
  next.addEventListener('click', () => moveTo(index + 1));
  window.addEventListener('resize', measure);
  measure();
}

function setupHeaderDropdown() {
  const item = document.querySelector('.menu .has-sub');
  if (!item) return;
  const btn = item.querySelector('.link');
  const dropdown = item.querySelector('.dropdown');
  const close = (e) => {
    if (!item.contains(e.target)) {
      item.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', close);
  // Hover open on desktop
  let hoverTimer;
  item.addEventListener('mouseenter', () => {
    hoverTimer = setTimeout(() => {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }, 120);
  });
  item.addEventListener('mouseleave', () => {
    clearTimeout(hoverTimer);
    item.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });
}

function setupMobileMenu() {
  const menu = document.querySelector('.menu');
  const toggle = document.querySelector('.hamburger');
  if (!menu || !toggle) return;
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== toggle) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function setupBubbleMenu() {
  const btn = document.querySelector('.bubble-toggle');
  const panel = document.querySelector('.bubble-panel');
  if (!btn || !panel) return;
  const toggle = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('open', open);
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = btn.getAttribute('aria-expanded') !== 'true';
    toggle(open);
  });
  document.addEventListener('click', () => toggle(false));
}

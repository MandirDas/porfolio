import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles.css';

// [CONFIRM] Paste your real LinkedIn profile URL here, e.g. 'https://www.linkedin.com/in/your-handle/'.
// While this is empty, the LinkedIn contact row stays hidden (never link to the generic linkedin.com).
const LINKEDIN_URL = '';

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

/* ── Footer year ── */
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

/* ── LinkedIn ── */
if (/^https:\/\/(www\.)?linkedin\.com\/in\/[^/]+/.test(LINKEDIN_URL)) {
  document.querySelectorAll('[data-linkedin]').forEach((li) => {
    li.querySelector('a').href = LINKEDIN_URL;
    const handle = LINKEDIN_URL.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '');
    li.querySelector('[data-linkedin-label]').firstChild.textContent = handle;
    li.hidden = false;
  });
}

/* ── Theme toggle ── */
const themeBtn = document.querySelector('[data-theme-toggle]');
function syncThemeButton() {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  themeBtn.setAttribute('aria-label', `Switch to ${next} theme`);
}
syncThemeButton();
themeBtn.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { /* private mode */ }
  syncThemeButton();
});
// Follow the system theme live unless the visitor picked one explicitly.
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  try { if (localStorage.getItem('theme')) return; } catch (err) { /* ignore */ }
  root.dataset.theme = e.matches ? 'light' : 'dark';
  syncThemeButton();
});

/* ── Nav: scrolled state, mobile menu, active section ── */
const nav = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');
const navLinks = [...document.querySelectorAll('.nav-links a')];

const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

function setMenu(open) {
  nav.classList.toggle('menu-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('menu-open')));
navLinks.forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('menu-open')) {
    setMenu(false);
    navToggle.focus();
  }
});

const sections = navLinks
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);
const activeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        const on = a.getAttribute('href') === `#${entry.target.id}`;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  },
  { rootMargin: '-45% 0px -50% 0px' }
);
sections.forEach((s) => activeObserver.observe(s));

/* ── Scroll reveals ── */
const revealEls = document.querySelectorAll('[data-reveal]');
const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      obs.unobserve(entry.target);
    });
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
);
revealEls.forEach((el, i) => {
  // Small stagger between siblings in the same group.
  const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
  el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 5) * 70}ms`);
  revealObserver.observe(el);
});

/* ── Animated counters ── */
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  if (reducedMotion.matches) {
    el.textContent = target.toFixed(decimals);
    return;
  }
  const duration = 1400;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = (target * eased).toFixed(decimals);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const countObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      obs.unobserve(entry.target);
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll('[data-count]').forEach((el) => countObserver.observe(el));

/* ── Pointer-only flourishes (desktop, motion allowed) ── */
function initPointerEffects() {
  if (!finePointer.matches || reducedMotion.matches) return;

  // Card spotlight
  document.querySelectorAll('.spot').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // Magnetic buttons
  document.querySelectorAll('.magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });

  // Phone parallax tilt
  const tilt = document.querySelector('[data-tilt]');
  const hero = document.querySelector('.hero');
  if (tilt && hero) {
    let raf = 0;
    hero.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = tilt.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        tilt.style.setProperty('--ry', `${(dx * 18).toFixed(2)}deg`);
        tilt.style.setProperty('--rx', `${(-dy * 14).toFixed(2)}deg`);
      });
    });
    hero.addEventListener('pointerleave', () => {
      tilt.style.setProperty('--ry', '0deg');
      tilt.style.setProperty('--rx', '0deg');
    });
  }

  // Custom cursor
  const cursor = document.querySelector('.cursor');
  const dot = cursor.querySelector('.cursor-dot');
  const ring = cursor.querySelector('.cursor-ring');
  root.classList.add('has-cursor');
  let mx = -100, my = -100, rx = -100, ry = -100;
  window.addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
    cursor.classList.add('visible');
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('visible'));
  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('hover', !!e.target.closest('a, button, [tabindex="0"]'));
  });
  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
initPointerEffects();

const header = document.querySelector('.nav');
const menu = document.querySelector('.menu');
const brandIntro = document.querySelector('.brand-intro');

if (brandIntro) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasSeenIntro = sessionStorage.getItem('calmIntroSeen');
  if (reduceMotion || hasSeenIntro) {
    brandIntro.remove();
  } else {
    document.body.classList.add('intro-active');
    sessionStorage.setItem('calmIntroSeen', 'true');
    window.setTimeout(() => {
      brandIntro.classList.add('intro-finished');
      document.body.classList.remove('intro-active');
      window.setTimeout(() => brandIntro.remove(), 760);
    }, 1750);
  }
}

menu.addEventListener('click', () => {
  const open = header.classList.toggle('open');
  menu.setAttribute('aria-expanded', open);
  menu.textContent = open ? 'Close' : 'Menu';
});

const tabGroups = {
  company: ['.statement', '.homecoming'],
  manufacturing: ['.manufacturing'],
  products: ['.products'],
  impact: ['.region', '.endorsements', '.sectors', '.vision']
};

const tabButtons = [...document.querySelectorAll('[data-tab]')];
const managedSections = Object.fromEntries(
  Object.entries(tabGroups).map(([key, selectors]) => [
    key,
    selectors.flatMap(selector => [...document.querySelectorAll(selector)])
  ])
);

Object.values(managedSections).flat().forEach(section => section.classList.add('tab-managed'));

function activateTab(name, options = {}) {
  if (!managedSections[name]) name = 'company';

  Object.entries(managedSections).forEach(([key, sections]) => {
    sections.forEach(section => { section.hidden = key !== name; });
  });

  tabButtons.forEach(button => {
    const active = button.dataset.tab === name;
    button.setAttribute('aria-selected', active);
    button.tabIndex = active ? 0 : -1;
  });

  if (options.updateHash) history.replaceState(null, '', `#${name}`);
  if (options.scroll) managedSections[name][0].scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function tabForHash(hash) {
  const id = hash.replace('#', '');
  if (managedSections[id]) return id;
  if (id === 'company') return 'company';
  if (id === 'manufacturing') return 'manufacturing';
  if (id === 'products') return 'products';
  if (['impact', 'endorsement-title'].includes(id)) return 'impact';
  return null;
}

tabButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    activateTab(button.dataset.tab, { updateHash: true, scroll: true });
    header.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.textContent = 'Menu';
  });
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabButtons[(index + direction + tabButtons.length) % tabButtons.length];
    next.focus();
    activateTab(next.dataset.tab, { updateHash: true });
  });
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const targetTab = tabForHash(link.getAttribute('href'));
    if (!targetTab) return;
    event.preventDefault();
    activateTab(targetTab, { updateHash: true, scroll: true });
    header.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.textContent = 'Menu';
  });
});

// Prevent the browser from jumping into a section before the tab layout is ready.
const initialTab = tabForHash(location.hash) || 'company';
activateTab(initialTab);
if (location.hash && initialTab !== 'company') {
  requestAnimationFrame(() => managedSections[initialTab][0].scrollIntoView({ block: 'start' }));
}

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  }
}), { threshold: .12 });

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

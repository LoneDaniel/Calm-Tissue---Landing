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
  products: ['.products', '.stockists'],
  impact: ['.region', '.endorsements', '.sectors', '.vision'],
  contact: ['.contact']
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
  if (['products', 'stockists', 'stockists-title'].includes(id)) return 'products';
  if (['impact', 'endorsement-title'].includes(id)) return 'impact';
  if (id === 'contact') return 'contact';
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


/* Country badge: detects the visitor's country from their own browser (time zone, then language) - no outside service */
(() => {
  const wrap = document.querySelector('.ct-region');
  if (!wrap) return;
  const btn = wrap.querySelector('.ct-region-btn');
  const menuBox = wrap.querySelector('.ct-region-menu');
  const optionsBox = wrap.querySelector('.ct-region-options');
  const FLAGS = {
    BW: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#75AADB"/><rect y="5.33" width="24" height="5.33" fill="#fff"/><rect y="6" width="24" height="4" fill="#000"/></svg>',
    ZA: '<svg viewBox="0 0 9 6"><rect width="9" height="3" fill="#E03C31"/><rect y="3" width="9" height="3" fill="#001489"/><path d="M0 0 4.5 3 0 6M4.5 3H9" stroke="#fff" stroke-width="2" fill="none"/><path d="M0 0 4.5 3 0 6M4.5 3H9" stroke="#007749" stroke-width="1.2" fill="none"/><path d="M0 .9 3.15 3 0 5.1z" fill="#FFB81C"/><path d="M0 1.35 2.5 3 0 4.65z" fill="#000"/></svg>',
    GLOBE: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>'
  };
  const TZ = {'Africa/Gaborone':'BW','Africa/Johannesburg':'ZA','Africa/Harare':'ZW','Africa/Windhoek':'NA','Africa/Lusaka':'ZM','Africa/Maputo':'MZ','Africa/Maseru':'LS','Africa/Mbabane':'SZ','Africa/Lagos':'NG','Africa/Nairobi':'KE','Africa/Accra':'GH','Europe/London':'GB','Europe/Dublin':'IE','Europe/Amsterdam':'NL','Europe/Berlin':'DE','Europe/Paris':'FR','Europe/Brussels':'BE','Europe/Lisbon':'PT','Europe/Madrid':'ES','Europe/Rome':'IT','America/New_York':'US','America/Chicago':'US','America/Denver':'US','America/Los_Angeles':'US','America/Toronto':'CA','Asia/Dubai':'AE','Asia/Shanghai':'CN','Asia/Kolkata':'IN','Asia/Singapore':'SG','Australia/Sydney':'AU'};
  const store = { get: () => { try { return localStorage.getItem('calmCountry'); } catch (e) { return null; } },
                  set: v => { try { localStorage.setItem('calmCountry', v); } catch (e) {} } };
  const names = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { return null; } })();
  const nameOf = c => (names && names.of(c)) || c;
  const isWindows = /Windows/i.test(navigator.userAgent);
  const emoji = c => String.fromCodePoint(...[...c].map(ch => 127397 + ch.charCodeAt(0)));
  const flagHtml = c => FLAGS[c] || (isWindows || !/^[A-Z]{2}$/.test(c) ? FLAGS.GLOBE : `<span class="ct-emoji">${emoji(c)}</span>`);

  function detect() {
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (TZ[tz]) return TZ[tz];
    for (const l of (navigator.languages || [navigator.language || ''])) {
      const m = /[-_]([A-Za-z]{2})$/.exec(l);
      if (m) return m[1].toUpperCase();
    }
    return 'BW';
  }

  const detected = detect();
  let current = store.get() || detected;

  function render() {
    const name = nameOf(current);
    btn.querySelector('.ct-flag').innerHTML = flagHtml(current);
    btn.querySelector('.ct-region-name').textContent = name;
    btn.setAttribute('aria-label', `Your country: ${name}. Change country`);
    document.documentElement.dataset.country = current;
    const list = ['BW', 'ZA'];
    if (!list.includes(detected)) list.push(detected);
    if (!list.includes(current)) list.push(current);
    optionsBox.innerHTML = '';
    list.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ct-region-option';
      b.setAttribute('aria-pressed', c === current);
      b.innerHTML = `<span class="ct-flag" aria-hidden="true">${flagHtml(c)}</span><span></span>`;
      b.lastChild.textContent = nameOf(c);
      b.addEventListener('click', () => { current = c; store.set(c); render(); close(); btn.focus(); });
      optionsBox.appendChild(b);
    });
  }
  const close = () => { menuBox.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = menuBox.hidden;
    menuBox.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) { const first = optionsBox.querySelector('[aria-pressed="true"]') || optionsBox.firstChild; first && first.focus(); }
  });
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menuBox.hidden) { close(); btn.focus(); } });
  render();
})();

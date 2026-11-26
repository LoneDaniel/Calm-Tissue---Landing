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

/* Multi-page site: links people already have to the old one-page tabs (e.g. calmtissue.com/#products) go to the matching page. */
const oldAnchors = { manufacturing: '/about#quality', products: '/products', stockists: '/where-to-buy', 'stockists-title': '/where-to-buy', impact: '/botswana', 'endorsement-title': '/botswana', contact: '/contact' };
if (document.body.classList.contains('home') && location.hash) {
  const target = oldAnchors[location.hash.slice(1)];
  if (target) location.replace(target);
}

// Close the mobile menu after choosing a page
document.querySelectorAll('.nav nav a').forEach(link => link.addEventListener('click', () => {
  header.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.textContent = 'Menu';
}));

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
  const GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>';
  const FLAG_FILES = 'bw,za,zw,na,zm,ls,sz,mz,ao,mw,tz,cd,mg,mu,sc,km,gb,us,ca,au,nz,ie,nl,de,fr,be,pt,es,it,ch,se,no,dk,cn,in,ae,sa,ng,ke,gh,eg,jp,sg,br'.split(',');
  const NEIGHBOURS = ['ZW', 'NA', 'ZM', 'LS', 'SZ', 'MZ'];
  const TZ = {'Africa/Gaborone':'BW','Africa/Johannesburg':'ZA','Africa/Harare':'ZW','Africa/Windhoek':'NA','Africa/Lusaka':'ZM','Africa/Maputo':'MZ','Africa/Maseru':'LS','Africa/Mbabane':'SZ','Africa/Lagos':'NG','Africa/Nairobi':'KE','Africa/Accra':'GH','Europe/London':'GB','Europe/Dublin':'IE','Europe/Amsterdam':'NL','Europe/Berlin':'DE','Europe/Paris':'FR','Europe/Brussels':'BE','Europe/Lisbon':'PT','Europe/Madrid':'ES','Europe/Rome':'IT','America/New_York':'US','America/Chicago':'US','America/Denver':'US','America/Los_Angeles':'US','America/Toronto':'CA','Asia/Dubai':'AE','Asia/Shanghai':'CN','Asia/Kolkata':'IN','Asia/Singapore':'SG','Australia/Sydney':'AU'};
  const store = { get: () => { try { return localStorage.getItem('calmCountry'); } catch (e) { return null; } },
                  set: v => { try { localStorage.setItem('calmCountry', v); } catch (e) {} } };
  const names = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { return null; } })();
  const nameOf = c => (names && names.of(c)) || c;
  const isWindows = /Windows/i.test(navigator.userAgent);
  const emoji = c => String.fromCodePoint(...[...c].map(ch => 127397 + ch.charCodeAt(0)));
  const flagHtml = c => {
    if (c === 'INT') return GLOBE;
    const f = c.toLowerCase();
    if (FLAG_FILES.includes(f)) return `<img src="assets/flags/${f}.svg" alt="" width="20" height="15" loading="lazy">`;
    return isWindows || !/^[A-Z]{2}$/.test(c) ? GLOBE : `<span class="ct-emoji">${emoji(c)}</span>`;
  };
  const label = c => c === 'INT' ? 'Other countries' : nameOf(c);

  function detect() {
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    const langs = navigator.languages || [navigator.language || ''];
    // Gaborone and Johannesburg share a time zone, and many Botswana devices report Johannesburg.
    // Show South Africa only with a South African language hint; otherwise default to Botswana (home market).
    if (tz === 'Africa/Johannesburg') return langs.some(l => /-ZA$|^(af|zu|xh|nso|st|ts|ve|nr|ss)(-|$)/i.test(l)) ? 'ZA' : 'BW';
    if (TZ[tz]) return TZ[tz];
    for (const l of langs) {
      const m = /[-_]([A-Za-z]{2})$/.exec(l);
      if (m) return m[1].toUpperCase();
    }
    return 'BW';
  }

  const detected = detect();
  let current = store.get() || detected;

  function render() {
    const name = label(current);
    btn.querySelector('.ct-flag').innerHTML = flagHtml(current);
    btn.querySelector('.ct-region-name').textContent = name;
    btn.setAttribute('aria-label', `Your country: ${name}. Change country`);
    document.documentElement.dataset.country = current;
    const groups = [['BW', 'ZA'], NEIGHBOURS.slice(), []];
    const known = groups.flat();
    if (!known.includes(detected)) groups[2].push(detected);
    if (!known.includes(current) && current !== 'INT' && current !== detected) groups[2].push(current);
    groups[2].push('INT');
    const heads = ['Where Calm is sold', 'Southern Africa', 'Elsewhere'];
    optionsBox.innerHTML = '';
    groups.forEach((list, gi) => {
      const h = document.createElement('p');
      h.className = 'ct-region-group';
      h.textContent = heads[gi];
      optionsBox.appendChild(h);
      list.forEach(c => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ct-region-option';
        b.setAttribute('aria-pressed', c === current);
        b.innerHTML = `<span class="ct-flag" aria-hidden="true">${flagHtml(c)}</span><span></span>`;
        b.lastChild.textContent = label(c);
        b.addEventListener('click', () => { current = c; store.set(c); render(); close(); btn.focus(); });
        optionsBox.appendChild(b);
      });
    });
  }
  const close = () => { menuBox.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = menuBox.hidden;
    menuBox.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) { const first = optionsBox.querySelector('[aria-pressed="true"]') || optionsBox.querySelector('button'); first && first.focus(); }
  });
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menuBox.hidden) { close(); btn.focus(); } });
  render();
})();

/* Enquiry tracking: sends a GA4 event when someone taps WhatsApp, phone or email, downloads the company profile
   or sends the contact form. Only the type of action and where it was clicked are sent - never names, numbers or message text. */
(() => {
  const send = (name, params) => { if (typeof window.gtag === 'function') window.gtag('event', name, Object.assign({ transport_type: 'beacon' }, params)); };
  const where = el => { const s = el.closest('header, footer, section, aside, form'); return s ? (s.id || s.className.split(' ')[0] || s.tagName.toLowerCase()) : 'page'; };
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const p = { link_location: where(a) };
    if (/^https:\/\/wa\.me\//i.test(href)) send('whatsapp_click', p);
    else if (/^tel:/i.test(href)) send('phone_click', p);
    else if (/^mailto:/i.test(href)) send('email_click', p);
    else if (/company-profile[^/]*\.pdf$/i.test(href)) send('profile_download', p);
  }, true);
  document.querySelectorAll('form[action]').forEach(f => f.addEventListener('submit', () => send('generate_lead', { form_name: 'contact_form' })));
})();

/* Keep the footer year current (static year stays as fallback) */
(() => {
  const now = new Date().getFullYear();
  document.querySelectorAll('footer').forEach(f => {
    f.innerHTML = f.innerHTML.replace(/© \d{4} Calm Tissue/, '© ' + now + ' Calm Tissue');
  });
})();

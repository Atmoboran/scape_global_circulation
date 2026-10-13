// Page controller: the three parts (hash routes #sonne, #coriolis, #zirkulation) with the
// numbered header buttons, the poster kicker/lead of the current part, the single animation
// loop (only the visible simulation runs) and resizing.
(() => {
  'use strict';
  const S = window.SCAPE;

  const ORDER = ['sonne', 'coriolis', 'zirkulation'];
  const stages = {
    sonne: S.initSunSim(),
    coriolis: S.initCoriolisSim(),
    zirkulation: S.initCircSim()
  };
  const shown = {};
  let current = null;
  let active = null;

  const navLinks = document.querySelectorAll('.top .nav a[data-part]');
  const parts = document.querySelectorAll('main .part');
  const shapes = document.querySelectorAll('.poster [data-part-shape]');
  const kicker = document.getElementById('kicker');
  const lead = document.getElementById('lead');

  const show = (id, scroll) => {
    if (!stages[id]) id = ORDER[0];
    if (id === current) return;
    current = id;
    document.documentElement.dataset.part = id;   // per-part poster colours (theme.css)
    navLinks.forEach(a => {
      if (a.dataset.part === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    parts.forEach(p => { p.hidden = p.dataset.part !== id; });
    shapes.forEach(s => { s.style.display = s.dataset.partShape === id ? '' : 'none'; });
    kicker.textContent = window.t('poster.kicker', ORDER.indexOf(id) + 1, ORDER.length, window.t('parts.' + id + '.topic'));
    lead.textContent = window.t('parts.' + id + '.lead');

    active = stages[id];
    active.resize();
    if (!shown[id]) {
      shown[id] = true;
      if (active.onFirstShow) active.onFirstShow();
    }
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fromHash = scroll => show((location.hash || '#' + ORDER[0]).slice(1), scroll);
  window.addEventListener('hashchange', () => fromHash(true));

  // ============ RESIZE ============
  let resizeTimer = 0;
  const relayout = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (active) active.resize(); }, 60);
  };
  window.addEventListener('resize', relayout);
  window.addEventListener('scape:viewchange', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (active) active.resize(); });

  // ============ LOOP ============
  let last = performance.now();
  const frame = now => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (active) active.frameStep(dt);
    requestAnimationFrame(frame);
  };

  fromHash(false);
  requestAnimationFrame(frame);
})();

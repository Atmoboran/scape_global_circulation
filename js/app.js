// Page controller: chapter tabs, the single animation loop (only the visible simulation runs),
// resizing, and the phone/desktop view toggle.
(function () {
  'use strict';
  var S = window.SCAPE;

  var stages = {
    sonne: S.initSunSim(),
    coriolis: S.initCoriolisSim(),
    zirkulation: S.initCircSim()
  };
  var ORDER = ['sonne', 'coriolis', 'zirkulation'];
  var active = null;
  var shown = {};

  var tabs = document.querySelectorAll('.chapter-tab');
  var chapters = document.querySelectorAll('.chapter');

  function show(id, scroll) {
    if (!stages[id]) id = 'sonne';
    if (active && active !== stages[id] && active.full) active.setFull(false);
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-ch') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    chapters.forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-ch') === id); });
    active = stages[id];
    active.resize();
    if (!shown[id]) {
      shown[id] = true;
      if (active.onFirstShow) active.onFirstShow();
    }
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    if (scroll) document.getElementById('chapter-nav').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { show(t.getAttribute('data-ch'), false); });
    t.addEventListener('keydown', function (e) {
      var i = ORDER.indexOf(t.getAttribute('data-ch'));
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var n = ORDER[(i + (e.key === 'ArrowRight' ? 1 : ORDER.length - 1)) % ORDER.length];
        show(n, false);
        document.querySelector('.chapter-tab[data-ch="' + n + '"]').focus();
      }
    });
  });
  document.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-go'), true); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && active && active.full) active.setFull(false);
  });

  // ============ VIEW MODE (phone / desktop) ============
  var VIEW_STORAGE_KEY = 'scapeViewMode';
  var viewBtn = document.getElementById('view-toggle');
  function setViewMode(m) {
    document.documentElement.setAttribute('data-view', m);
    viewBtn.textContent = m === 'mobile' ? 'Desktop-Ansicht' : 'Handy-Ansicht';
    viewBtn.setAttribute('aria-label', m === 'mobile' ? 'Zur Desktop-Ansicht wechseln' : 'Zur Handy-Ansicht wechseln');
  }
  setViewMode(document.documentElement.getAttribute('data-view') || 'mobile');
  viewBtn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-view') === 'mobile' ? 'desktop' : 'mobile';
    setViewMode(next);
    try { localStorage.setItem(VIEW_STORAGE_KEY, next); } catch (e) {}
    if (active) active.resize();
  });
  var mql = window.matchMedia('(max-width: 699px)');
  if (mql.addEventListener) {
    mql.addEventListener('change', function (e) {
      var override = false;
      try { override = localStorage.getItem(VIEW_STORAGE_KEY) !== null; } catch (err) {}
      if (!override) { setViewMode(e.matches ? 'mobile' : 'desktop'); if (active) active.resize(); }
    });
  }

  // ============ LOOP ============
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (active) active.resize(); }, 60);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (active) active.resize(); });
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (active) active.frame(dt);
    requestAnimationFrame(frame);
  }

  show((location.hash || '#sonne').slice(1), false);
  requestAnimationFrame(frame);
})();

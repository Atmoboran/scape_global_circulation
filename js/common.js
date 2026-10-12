// Shared helpers for all three simulations: math, readable canvas text, and the zoomable
// canvas stage (buttons, Ctrl+wheel, pinch, drag-to-pan, fullscreen).
(function () {
  'use strict';

  var S = window.SCAPE = window.SCAPE || {};

  // ============ MATH ============
  S.clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  S.clamp01 = function (v) { return Math.min(1, Math.max(0, v)); };
  S.lerp = function (a, b, t) { return a + (b - a) * t; };
  S.smooth = function (x) { x = S.clamp01(x); return x * x * (3 - 2 * x); };
  S.gate = function (v, lo, hi) { return S.clamp01((v - lo) / (hi - lo)); };
  // Exponential approach of `cur` toward `target` with time constant `tau` seconds.
  S.approach = function (cur, target, dt, tau) { return cur + (target - cur) * Math.min(1, dt / tau); };
  S.DEG = Math.PI / 180;

  S.hexToRgb = function (hex) {
    var v = parseInt(hex.slice(1), 16);
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
  };
  S.rgba = function (hex, a) {
    var c = S.hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  };
  S.mix = function (hex1, hex2, t) {
    var a = S.hexToRgb(hex1), b = S.hexToRgb(hex2);
    t = S.clamp01(t);
    return 'rgb(' + Math.round(S.lerp(a.r, b.r, t)) + ',' + Math.round(S.lerp(a.g, b.g, t)) + ',' + Math.round(S.lerp(a.b, b.b, t)) + ')';
  };

  // Colours and typeface come from the theme (theme/theme.js).
  S.COLORS = window.THEME.circulation;

  // ============ TEXT ============
  // Every canvas label goes through here so sizes stay consistent (never below 13px at 100 % zoom)
  // and every label gets a white halo, which keeps it readable on top of any background.
  S.FONT = window.THEME.font;
  // Weights from the old 700/800/900 scale map onto the CD's light/regular/medium.
  S.font = function (size, weight) { return ((weight || 700) >= 600 ? 500 : 400) + ' ' + size + 'px ' + S.FONT; };

  S.textWidth = function (ctx, text, size, weight) {
    ctx.save();
    ctx.font = S.font(size, weight || 800);
    var w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  };

  S.roundRect = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  };

  // o: { size, weight, color, align, baseline, halo (bool), box (bool), alpha }
  S.label = function (ctx, text, x, y, o) {
    o = o || {};
    var size = o.size || 15;
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.font = S.font(size, o.weight || 800);
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'middle';
    if (o.box) {
      var w = ctx.measureText(text).width;
      var bx = ctx.textAlign === 'center' ? x - w / 2 : (ctx.textAlign === 'right' ? x - w : x);
      var padX = 7, h = size + 10;
      S.roundRect(ctx, bx - padX, y - h / 2, w + 2 * padX, h, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = o.boxStroke || S.COLORS.ink;
      ctx.stroke();
    } else if (o.halo !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.haloWidth || 4.5;
      ctx.strokeStyle = o.haloColor || 'rgba(255,255,255,0.92)';
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = o.color || S.COLORS.ink;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  // Greedy word wrap to a pixel width.
  S.wrap = function (ctx, text, maxW, size, weight) {
    ctx.save();
    ctx.font = S.font(size, weight || 700);
    var words = text.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; } else { line = test; }
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  };

  S.arrowHead = function (ctx, x, y, angle, size) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * Math.cos(angle - 0.45), y - size * Math.sin(angle - 0.45));
    ctx.lineTo(x - size * Math.cos(angle + 0.45), y - size * Math.sin(angle + 0.45));
    ctx.closePath();
  };

  // ============ ZOOM STAGE ============
  // Wraps one <div class="stage-card"> containing <div class="stage"><canvas>. The simulation
  // draws in CSS-pixel "world" coordinates (0..W, 0..H) as if zoom were 100 %; this class puts a
  // scale+translate transform on top, so text and lines stay vector-crisp at any zoom level.
  //
  // sim interface: heightFor(W) -> H, layout(ctx, W, H), update(dt), draw(ctx)
  var MAX_ZOOM = 6;

  function ZoomStage(card, sim) {
    this.card = card;
    this.sim = sim;
    this.stage = card.querySelector('.stage');
    this.canvas = this.stage.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.k = 1; this.tx = 0; this.ty = 0;
    this.W = 0; this.H = 0;
    this.full = false;
    this.buildToolbar();
    this.bindInput();
  }

  ZoomStage.prototype.buildToolbar = function () {
    var self = this;
    var bar = document.createElement('div');
    bar.className = 'stage-toolbar';
    bar.innerHTML =
      '<div class="zoom-group">' +
        '<button type="button" class="zb" data-z="out" aria-label="Verkleinern">&minus;</button>' +
        '<span class="zoom-level" aria-live="polite">100&nbsp;%</span>' +
        '<button type="button" class="zb" data-z="in" aria-label="Vergr&ouml;&szlig;ern">+</button>' +
        '<button type="button" class="zb zb-text" data-z="reset">Zur&uuml;cksetzen</button>' +
      '</div>' +
      '<button type="button" class="zb zb-text zb-full" data-z="full">Vollbild</button>';
    this.card.appendChild(bar);

    var hint = document.createElement('p');
    hint.className = 'zoom-hint';
    hint.innerHTML = '<b>Zoomen:</b> Knöpfe +/&minus;, Strg + Mausrad, Doppelklick oder zwei Finger. <b>Verschieben:</b> im gezoomten Bild ziehen.';
    this.card.appendChild(hint);

    var flash = document.createElement('div');
    flash.className = 'wheel-hint';
    flash.textContent = 'Zum Zoomen: Strg + Mausrad (Mac: ⌘ + Mausrad)';
    this.stage.appendChild(flash);
    this.flashEl = flash;

    this.levelEl = bar.querySelector('.zoom-level');
    this.fullBtn = bar.querySelector('.zb-full');

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var z = b.getAttribute('data-z');
      if (z === 'in') self.zoomAt(1.5, self.W / 2, self.H / 2);
      else if (z === 'out') self.zoomAt(1 / 1.5, self.W / 2, self.H / 2);
      else if (z === 'reset') self.resetView();
      else if (z === 'full') self.setFull(!self.full);
    });
  };

  ZoomStage.prototype.setFull = function (on) {
    this.full = on;
    this.card.classList.toggle('is-full', on);
    document.body.classList.toggle('no-scroll', on);
    this.fullBtn.textContent = on ? 'Vollbild schließen' : 'Vollbild';
    this.stage.style.height = '';
    this.resize();
    this.resetView();
  };

  ZoomStage.prototype.resetView = function () {
    this.k = 1; this.tx = 0; this.ty = 0;
    this.applyZoom();
  };

  ZoomStage.prototype.applyZoom = function () {
    this.tx = S.clamp(this.tx, this.W - this.W * this.k, 0);
    this.ty = S.clamp(this.ty, this.H - this.H * this.k, 0);
    this.levelEl.textContent = Math.round(this.k * 100) + ' %';
    // At 100 % a one-finger swipe scrolls the page; once zoomed in it pans the picture instead.
    this.canvas.style.touchAction = (this.k > 1.001 || this.full) ? 'none' : 'pan-y';
    this.canvas.style.cursor = this.k > 1.001 ? 'grab' : 'default';
  };

  ZoomStage.prototype.zoomAt = function (factor, sx, sy) {
    var nk = S.clamp(this.k * factor, 1, MAX_ZOOM);
    var wx = (sx - this.tx) / this.k, wy = (sy - this.ty) / this.k;
    this.k = nk;
    this.tx = sx - wx * nk;
    this.ty = sy - wy * nk;
    this.applyZoom();
  };

  ZoomStage.prototype.localPos = function (clientX, clientY) {
    var r = this.canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  ZoomStage.prototype.showFlash = function () {
    var el = this.flashEl;
    el.classList.add('show');
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(function () { el.classList.remove('show'); }, 1300);
  };

  ZoomStage.prototype.bindInput = function () {
    var self = this, c = this.canvas;

    c.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        var p = self.localPos(e.clientX, e.clientY);
        self.zoomAt(Math.exp(-e.deltaY * 0.0022), p.x, p.y);
      } else {
        self.showFlash();
      }
    }, { passive: false });

    c.addEventListener('dblclick', function (e) {
      var p = self.localPos(e.clientX, e.clientY);
      self.zoomAt(e.shiftKey ? 1 / 1.6 : 1.6, p.x, p.y);
    });

    // Mouse / pen drag to pan (touch is handled separately below, for pinch).
    var drag = null;
    c.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || self.k <= 1.001) return;
      drag = { x: e.clientX, y: e.clientY, tx: self.tx, ty: self.ty };
      c.setPointerCapture(e.pointerId);
      c.style.cursor = 'grabbing';
    });
    c.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerType === 'touch') return;
      self.tx = drag.tx + (e.clientX - drag.x);
      self.ty = drag.ty + (e.clientY - drag.y);
      self.applyZoom();
    });
    function endDrag() { if (drag) { drag = null; self.applyZoom(); } }
    c.addEventListener('pointerup', endDrag);
    c.addEventListener('pointercancel', endDrag);

    // Touch: two fingers pinch-zoom, one finger pans once zoomed in.
    var pinch = null, pan = null;
    function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
    function mid(t) { return self.localPos((t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2); }
    c.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        pan = null;
        var m = mid(e.touches);
        pinch = { d: dist(e.touches), k: self.k, wx: (m.x - self.tx) / self.k, wy: (m.y - self.ty) / self.k };
      } else if (e.touches.length === 1 && self.k > 1.001) {
        e.preventDefault();
        pan = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: self.tx, ty: self.ty };
      }
    }, { passive: false });
    c.addEventListener('touchmove', function (e) {
      if (pinch && e.touches.length === 2) {
        e.preventDefault();
        var m = mid(e.touches);
        var nk = S.clamp(pinch.k * dist(e.touches) / pinch.d, 1, MAX_ZOOM);
        self.k = nk;
        self.tx = m.x - pinch.wx * nk;
        self.ty = m.y - pinch.wy * nk;
        self.applyZoom();
      } else if (pan && e.touches.length === 1) {
        e.preventDefault();
        self.tx = pan.tx + (e.touches[0].clientX - pan.x);
        self.ty = pan.ty + (e.touches[0].clientY - pan.y);
        self.applyZoom();
      }
    }, { passive: false });
    c.addEventListener('touchend', function (e) {
      if (e.touches.length < 2) pinch = null;
      if (e.touches.length === 0) pan = null;
    });
  };

  ZoomStage.prototype.resize = function () {
    var W = this.stage.clientWidth;
    if (!W) return;
    var H;
    if (this.full) {
      H = this.stage.clientHeight;
    } else {
      H = Math.round(this.sim.heightFor(W));
      this.stage.style.height = H + 'px';
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.dpr = dpr;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.W = W; this.H = H;
    this.sim.layout(this.ctx, W, H);
    this.applyZoom();
  };

  ZoomStage.prototype.frame = function (dt) {
    this.sim.update(dt);
    var ctx = this.ctx, d = this.dpr || 1;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.setTransform(d * this.k, 0, 0, d * this.k, d * this.tx, d * this.ty);
    this.sim.draw(ctx);
  };

  S.ZoomStage = ZoomStage;

  // Simple segmented-button helper: buttons inside `el` with data-value; calls onChange(value).
  S.segmented = function (el, onChange) {
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-value]');
      if (!b) return;
      el.querySelectorAll('button[data-value]').forEach(function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      onChange(b.getAttribute('data-value'));
    });
  };
})();

// Shared helpers for all three simulations: math, readable canvas text, and the
// zoomable canvas stage (Ctrl + mouse wheel, two-finger pinch, drag to pan when
// zoomed in). The fullscreen button comes from the kit (js/kit.js).
(() => {
  'use strict';

  const S = (window.SCAPE = window.SCAPE || {});

  // ============ MATH ============
  S.clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  S.clamp01 = v => Math.min(1, Math.max(0, v));
  S.lerp = (a, b, t) => a + (b - a) * t;
  S.smooth = x => { x = S.clamp01(x); return x * x * (3 - 2 * x); };
  S.gate = (v, lo, hi) => S.clamp01((v - lo) / (hi - lo));
  // Exponential approach of `cur` toward `target` with time constant `tau` seconds.
  S.approach = (cur, target, dt, tau) => cur + (target - cur) * Math.min(1, dt / tau);
  S.DEG = Math.PI / 180;

  const parse = c => {
    if (c[0] === '#') {
      const v = parseInt(c.slice(1), 16);
      return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
    }
    const m = c.match(/[\d.]+/g).map(Number);   // rgb(r,g,b)
    return { r: m[0], g: m[1], b: m[2] };
  };
  S.hexToRgb = parse;
  S.rgba = (col, a) => {
    const c = parse(col);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  };
  S.mix = (col1, col2, t) => {
    const a = parse(col1), b = parse(col2);
    t = S.clamp01(t);
    return 'rgb(' + Math.round(S.lerp(a.r, b.r, t)) + ',' + Math.round(S.lerp(a.g, b.g, t)) + ',' + Math.round(S.lerp(a.b, b.b, t)) + ')';
  };

  // Colours and typeface come from the theme (theme/theme.js).
  S.COLORS = window.THEME.circulation;
  S.DATA = window.THEME.data;
  // Temperature colour of a latitude (degrees, either hemisphere) on the CD scale.
  S.tempAt = lat => {
    const C = S.COLORS, a = Math.abs(lat);
    const pts = [[0, C.tempEquator], [30, C.temp30], [60, C.temp60], [90, C.tempPole]];
    for (let i = 1; i < pts.length; i++) {
      if (a <= pts[i][0]) {
        const f = (a - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
        return window.THEME.tempColor(S.lerp(pts[i - 1][1], pts[i][1], f));
      }
    }
    return window.THEME.tempColor(C.tempPole);
  };

  // ============ TEXT ============
  // Every canvas label goes through here so sizes stay consistent (never below 13 px on
  // screen: the drawing works in CSS pixels and zoom only enlarges it) and every label gets
  // a white halo, which keeps it readable on top of any background.
  S.FONT = window.THEME.font;
  // Weights from the old 700/800/900 scale map onto the CD's regular/medium.
  S.font = (size, weight) => ((weight || 700) >= 600 ? 500 : 400) + ' ' + size + 'px ' + S.FONT;

  S.textWidth = (ctx, text, size, weight) => {
    ctx.save();
    ctx.font = S.font(size, weight || 800);
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  };

  // o: { size, weight, color, align, baseline, halo (bool), box (bool), alpha }
  S.label = (ctx, text, x, y, o = {}) => {
    const size = o.size || 15;
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.font = S.font(size, o.weight || 800);
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'middle';
    if (o.box) {
      // flat rectangular box (CD: no rounded rectangles)
      const w = ctx.measureText(text).width;
      const bx = ctx.textAlign === 'center' ? x - w / 2 : (ctx.textAlign === 'right' ? x - w : x);
      const padX = 7, h = size + 10;
      ctx.beginPath();
      ctx.rect(bx - padX, y - h / 2, w + 2 * padX, h);
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
  S.wrap = (ctx, text, maxW, size, weight) => {
    ctx.save();
    ctx.font = S.font(size, weight || 700);
    const words = text.split(' '), lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; } else { line = test; }
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  };

  S.arrowHead = (ctx, x, y, angle, size) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * Math.cos(angle - 0.45), y - size * Math.sin(angle - 0.45));
    ctx.lineTo(x - size * Math.cos(angle + 0.45), y - size * Math.sin(angle + 0.45));
    ctx.closePath();
  };

  // ============ ZOOM STAGE ============
  // Wraps one <div class="stage-frame"> with a <canvas>. The simulation draws in CSS-pixel
  // "world" coordinates (0..W, 0..H) as if zoom were 100 %; this class puts a
  // scale+translate transform on top, so text and lines stay crisp at any zoom level.
  // No zoom buttons (style guide 7): Ctrl + mouse wheel, two-finger pinch, drag to pan.
  //
  // sim interface: heightFor(W) -> H, layout(ctx, W, H), update(dt), draw(ctx)
  // A frame with the class "square" takes its size from CSS; otherwise the height
  // follows heightFor(W), capped to the screen on the desktop.
  const MAX_ZOOM = 6;
  const isFull = f => document.fullscreenElement === f || f.classList.contains('is-full');

  class ZoomStage {
    constructor(frame, sim) {
      this.frame = frame;
      this.sim = sim;
      this.canvas = frame.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.k = 1; this.tx = 0; this.ty = 0;
      this.W = 0; this.H = 0;
      this.bindInput();
    }

    get full() { return isFull(this.frame); }

    resetView() {
      this.k = 1; this.tx = 0; this.ty = 0;
      this.applyZoom();
    }

    applyZoom() {
      if (this.k < 1.02) { this.k = 1; }
      this.tx = S.clamp(this.tx, this.W - this.W * this.k, 0);
      this.ty = S.clamp(this.ty, this.H - this.H * this.k, 0);
      // At 100 % a one-finger swipe scrolls the page; once zoomed in it pans the picture.
      const zoomed = this.k > 1.001;
      this.canvas.style.touchAction = (zoomed || this.full) ? 'none' : 'pan-y';
      this.canvas.style.cursor = zoomed ? 'grab' : '';
    }

    zoomAt(factor, sx, sy) {
      const nk = S.clamp(this.k * factor, 1, MAX_ZOOM);
      const wx = (sx - this.tx) / this.k, wy = (sy - this.ty) / this.k;
      this.k = nk;
      this.tx = sx - wx * nk;
      this.ty = sy - wy * nk;
      this.applyZoom();
    }

    localPos(clientX, clientY) {
      const r = this.canvas.getBoundingClientRect();
      return { x: clientX - r.left, y: clientY - r.top };
    }

    bindInput() {
      const c = this.canvas;

      c.addEventListener('wheel', e => {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        const p = this.localPos(e.clientX, e.clientY);
        this.zoomAt(Math.exp(-e.deltaY * 0.0022), p.x, p.y);
      }, { passive: false });

      // Mouse / pen drag to pan (touch is handled separately below, for pinch).
      let drag = null;
      c.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch' || this.k <= 1.001) return;
        drag = { x: e.clientX, y: e.clientY, tx: this.tx, ty: this.ty };
        c.setPointerCapture(e.pointerId);
        c.style.cursor = 'grabbing';
      });
      c.addEventListener('pointermove', e => {
        if (!drag || e.pointerType === 'touch') return;
        this.tx = drag.tx + (e.clientX - drag.x);
        this.ty = drag.ty + (e.clientY - drag.y);
        this.applyZoom();
      });
      const endDrag = () => { if (drag) { drag = null; this.applyZoom(); } };
      c.addEventListener('pointerup', endDrag);
      c.addEventListener('pointercancel', endDrag);

      // Touch: two fingers pinch-zoom, one finger pans once zoomed in.
      let pinch = null, pan = null;
      const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      const mid = t => this.localPos((t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2);
      c.addEventListener('touchstart', e => {
        if (e.touches.length === 2) {
          e.preventDefault();
          pan = null;
          const m = mid(e.touches);
          pinch = { d: dist(e.touches), k: this.k, wx: (m.x - this.tx) / this.k, wy: (m.y - this.ty) / this.k };
        } else if (e.touches.length === 1 && this.k > 1.001) {
          e.preventDefault();
          pan = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: this.tx, ty: this.ty };
        }
      }, { passive: false });
      c.addEventListener('touchmove', e => {
        if (pinch && e.touches.length === 2) {
          e.preventDefault();
          const m = mid(e.touches);
          const nk = S.clamp(pinch.k * dist(e.touches) / pinch.d, 1, MAX_ZOOM);
          this.k = nk;
          this.tx = m.x - pinch.wx * nk;
          this.ty = m.y - pinch.wy * nk;
          this.applyZoom();
        } else if (pan && e.touches.length === 1) {
          e.preventDefault();
          this.tx = pan.tx + (e.touches[0].clientX - pan.x);
          this.ty = pan.ty + (e.touches[0].clientY - pan.y);
          this.applyZoom();
        }
      }, { passive: false });
      c.addEventListener('touchend', e => {
        if (e.touches.length < 2) pinch = null;
        if (e.touches.length === 0) pan = null;
      });
    }

    resize() {
      const f = this.frame;
      const W = f.clientWidth;
      if (!W) return;
      let H;
      if (this.full || f.classList.contains('square')) {
        H = f.clientHeight;
      } else {
        H = Math.round(this.sim.heightFor(W));
        if (document.documentElement.dataset.view === 'desktop') {
          const head = document.querySelector('.top');
          const room = window.innerHeight - (head ? head.offsetHeight : 0) - 36;
          H = Math.max(360, Math.min(H, room));
        }
        f.style.height = H + 'px';
      }
      if (!H) return;
      const sizeChanged = W !== this.W || H !== this.H;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.dpr = dpr;
      this.canvas.width = Math.round(W * dpr);
      this.canvas.height = Math.round(H * dpr);
      this.W = W; this.H = H;
      this.sim.layout(this.ctx, W, H);
      if (sizeChanged) this.resetView(); else this.applyZoom();
    }

    frameStep(dt) {
      this.sim.update(dt);
      const ctx = this.ctx, d = this.dpr || 1;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, this.W, this.H);
      ctx.setTransform(d * this.k, 0, 0, d * this.k, d * this.tx, d * this.ty);
      this.sim.draw(ctx);
    }
  }

  S.ZoomStage = ZoomStage;

  // Segmented buttons inside `el` with data-value; marks the pressed one and calls onChange(value).
  S.segmented = (el, onChange) => {
    el.addEventListener('click', e => {
      const b = e.target.closest('button[data-value]');
      if (!b) return;
      el.querySelectorAll('button[data-value]').forEach(x => {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      onChange(b.getAttribute('data-value'));
    });
  };
})();

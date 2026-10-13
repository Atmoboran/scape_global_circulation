// Simulation 3 — the full global circulation, built up in five guided steps.
//
// A pseudo-3D globe (orthographic projection on a plain 2D canvas, viewed from above the
// equator, axis vertical). A point at latitude lat / longitude lon on the front hemisphere
// projects to x = cx + R*cos(lat)*sin(lon), y = cy - R*sin(lat).
//
//  - The face is coloured by temperature (warm equator, cold poles).
//  - The meridional circulation cells are drawn as ribbons ("tubes") hugging the RIGHT limb,
//    with their names next to them; air particles ride around each loop.
//  - Pressure belts are H/T badges on the LEFT limb.
//  - Surface winds are white arrows moving across the face.
//
// Steps: 1 heating, 2 one big cell (no rotation), 3 rotation splits it into three cells,
// 4 pressure belts, 5 wind belts. Every visual layer eases in/out, so moving between steps is a
// smooth animation rather than a jump.
(() => {
  'use strict';
  const S = window.SCAPE, C = S.COLORS, DEG = S.DEG;

  const TX = key => window.t('circ.canvas.' + key);
  // `name` is used on wide screens, `short` on phones (the legend below spells the names out).
  const SINGLE = [{ lo: 0, hi: 90, sense: 1, color: C.orange, name: TX('single'), short: TX('singleShort') }];
  const THREE = [
    { lo: 0, hi: 30, sense: 1, color: C.rust, name: TX('hadley'), short: TX('hadleyShort') },
    { lo: 30, hi: 60, sense: -1, color: C.cyan, name: TX('ferrel'), short: TX('ferrelShort') },
    { lo: 60, hi: 90, sense: 1, color: C.navy, name: TX('polar'), short: TX('polarShort') }
  ];
  const RISE = { name: TX('rise'), short: TX('riseShort') };
  const SINK = { name: TX('sink'), short: TX('sinkShort') };
  // Surface wind per band, northern hemisphere, as (east, north) components.
  // Without rotation all surface air simply flows back towards the equator.
  const WIND_NOROT = { u: 0, v: -1 };
  const WIND_ROT = [{ u: -0.85, v: -0.5 }, { u: 0.85, v: 0.45 }, { u: -0.85, v: -0.45 }];
  const ARROWS_PER_BAND = [15, 11, 6];

  const STEPS = [
    { heat: 1, flow: 0, rot: 0, pOuter: 1, pInner: 0, winds: 0, warm: 1 },
    { heat: 1, flow: 1, rot: 0, pOuter: 1, pInner: 0, winds: 0, warm: 0 },
    { heat: 1, flow: 1, rot: 1, pOuter: 1, pInner: 0, winds: 0, warm: 0 },
    { heat: 1, flow: 1, rot: 1, pOuter: 1, pInner: 1, winds: 0, warm: 0 },
    { heat: 1, flow: 1, rot: 1, pOuter: 1, pInner: 1, winds: 1, warm: 0 }
  ];

  function CircSim() {
    this.step = 0;
    this.e = { heat: 0, flow: 0, rot: 0, pOuter: 0, pInner: 0, winds: 0, warm: 0 };
    this.time = 0;
    this.cellParticles = { single: this.makeCellParticles(SINGLE, 16), three: this.makeCellParticles(THREE, 9) };
    this.arrows = this.makeArrows();
  }

  CircSim.prototype.makeCellParticles = function (bands, per) {
    const list = [];
    bands.forEach((b, bi) => {
      [1, -1].forEach((hemi) => {
        for (let j = 0; j < per; j++) list.push({ band: bi, hemi: hemi, s: Math.random(), jit: (Math.random() * 2 - 1) * 0.45 });
      });
    });
    return list;
  };

  CircSim.prototype.makeArrows = function () {
    const list = [];
    [0, 1, 2].forEach((bi) => {
      [1, -1].forEach((hemi) => {
        for (let j = 0; j < ARROWS_PER_BAND[bi]; j++) {
          list.push({ band: bi, hemi: hemi, lat: bi * 30 + 3 + Math.random() * 24, lon: -85 + Math.random() * 170 });
        }
      });
    });
    return list;
  };

  CircSim.prototype.heightFor = function (W) {
    return W >= 620 ? Math.max(480, W * 0.62) : Math.max(340, W * 1.08);
  };

  CircSim.prototype.layout = function (ctx, W, H) {
    this.W = W; this.H = H;
    this.narrow = W < 560;
    const fs = this.narrow ? 14 : 16;
    this.fs = fs;
    const key = this.narrow ? 'short' : 'name';
    this.key = key;
    let L = 0;
    SINGLE.concat(THREE, [RISE, SINK]).forEach((b) => {
      b[key].forEach((t) => { L = Math.max(L, S.textWidth(ctx, t, fs, 800)); });
    });
    this.L = L;
    this.tFrac = this.narrow ? 0.24 : 0.3;
    // horizontal budget: badge margin + globe + tube + gap + label + right margin
    const rH = (W - 16 - 10 - 8 - L) / (2 + this.tFrac);
    const rV = (H / 2 - 48) / 1.3;
    this.R = Math.max(60, Math.min(rH, rV));
    this.T = this.R * this.tFrac;
    const total = 16 + (2 + this.tFrac) * this.R + 10 + L;
    this.cx = Math.max(0, (W - total) / 2) + 16 + this.R;
    this.cy = H / 2;
  };

  // ---------- projection ----------
  CircSim.prototype.proj = function (lat, lon) {
    return { x: this.cx + this.R * Math.cos(lat * DEG) * Math.sin(lon * DEG), y: this.cy - this.R * Math.sin(lat * DEG) };
  };
  // point on the right limb at latitude lat (signed: +N / -S), pushed out by `off` pixels
  CircSim.prototype.limb = function (lat, off) {
    const r = this.R + off;
    return { x: this.cx + r * Math.cos(lat * DEG), y: this.cy - r * Math.sin(lat * DEG) };
  };

  // ---------- cell tubes (same loop model as the original globe version) ----------
  CircSim.prototype.tubeOffset = function (s) {
    const TW = 0.08, T = this.T;
    if (s < 0.5) return s > 0.5 - TW ? T * S.smooth((s - (0.5 - TW)) / TW) : 0;
    return s > 1 - TW ? T * (1 - S.smooth((s - (1 - TW)) / TW)) : T;
  };
  // s in [0,1): first half near the surface, second half aloft. sense +1 = direct cell
  // (surface flow towards the equator), -1 = indirect Ferrel cell (surface flow poleward).
  CircSim.prototype.tubePoint = function (b, hemi, s, jit) {
    const half = s < 0.5, t = half ? s * 2 : (s - 0.5) * 2;
    const equatorward = b.sense > 0 ? half : !half;
    const lat = equatorward ? S.lerp(b.hi, b.lo, t) : S.lerp(b.lo, b.hi, t);
    const off = S.clamp(this.tubeOffset(s) + jit * this.T * 0.5, 2, this.T - 2);
    return this.limb(hemi * lat, off);
  };

  CircSim.prototype.drawTubes = function (ctx, bands, alpha) {
    if (alpha < 0.01) return;
    const self = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    bands.forEach((b) => {
      [1, -1].forEach((hemi) => {
        const N = 16; let i;
        ctx.beginPath();
        for (i = 0; i <= N; i++) { const p = self.limb(hemi * S.lerp(b.lo, b.hi, i / N), 0); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
        for (i = 0; i <= N; i++) { const q = self.limb(hemi * S.lerp(b.hi, b.lo, i / N), self.T); ctx.lineTo(q.x, q.y); }
        ctx.closePath();
        ctx.fillStyle = S.rgba(b.color, 0.35); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
      });
    });
    ctx.restore();
  };

  CircSim.prototype.drawCellParticles = function (ctx, bands, list, alpha) {
    if (alpha < 0.01) return;
    const self = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    list.forEach((p) => {
      const b = bands[p.band];
      const a = self.tubePoint(b, p.hemi, p.s, p.jit);
      let s2 = p.s - 0.025; if (s2 < 0) s2 += 1;
      const t = self.tubePoint(b, p.hemi, s2, p.jit);
      ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(a.x, a.y);
      ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(a.x, a.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = S.rgba(C.ink, 0.6); ctx.stroke();
    });
    ctx.restore();
  };

  CircSim.prototype.drawCellLabels = function (ctx, bands, alpha) {
    if (alpha < 0.01) return;
    const self = this, fs = this.fs;
    bands.forEach((b) => {
      [1, -1].forEach((hemi) => {
        let mid = (b.lo + b.hi) / 2;
        if (b.hi === 90 && b.lo === 0) mid = 45;
        const p = self.limb(hemi * mid, self.T + 10);
        const names = b[self.key], n = names.length;
        for (let i = 0; i < n; i++) {
          const y = p.y + (i - (n - 1) / 2) * (fs + 3);
          S.label(ctx, names[i], p.x, y, { size: fs, color: b.color === C.orange ? C.rust : b.color, alpha: alpha });
        }
      });
    });
  };

  // ---------- globe face ----------
  CircSim.prototype.drawFace = function (ctx) {
    const cx = this.cx, cy = this.cy, R = this.R, h = this.e.heat;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createLinearGradient(0, cy - R, 0, cy + R);
    // temperature by latitude on the CD scale, faded in from neutral by the heating step
    for (let lat = 90; lat >= -90; lat -= 10) g.addColorStop((1 - Math.sin(lat * DEG)) / 2, S.mix(C.neutral, S.tempAt(lat), h));
    ctx.fillStyle = g;
    ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);

    // latitude lines: equator always, 30°/60° once the three cells exist
    ctx.strokeStyle = S.rgba(C.ink, 0.45);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([2, 5]);
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
    const a = this.e.rot;
    if (a > 0.02) {
      ctx.globalAlpha = a;
      [30, 60].forEach((lat) => {
        [1, -1].forEach((hm) => {
          const y = cy - hm * R * Math.sin(lat * DEG), half = R * Math.cos(lat * DEG);
          ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx + half, y); ctx.stroke();
        });
      });
    }
    ctx.restore();

    // ITCZ cloud band
    const cl = this.e.pInner;
    if (cl > 0.02) {
      ctx.save();
      ctx.globalAlpha = cl;
      const r = Math.max(5, R * 0.045);
      for (let lon = -70; lon <= 70; lon += 20) {
        const p = this.proj(0, lon);
        ctx.fillStyle = C.paper; ctx.strokeStyle = S.rgba(C.ink, 0.35); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x - r * 0.8, p.y + r * 0.2, r * 0.75, 0, Math.PI * 2);
        ctx.arc(p.x, p.y - r * 0.2, r, 0, Math.PI * 2);
        ctx.arc(p.x + r * 0.8, p.y + r * 0.2, r * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink; ctx.stroke();
  };

  CircSim.prototype.windAt = function (band, hemi) {
    const r = this.e.rot, w = WIND_ROT[band];
    const u = S.lerp(WIND_NOROT.u, w.u, r), v = S.lerp(WIND_NOROT.v, w.v, r);
    const m = Math.hypot(u, v) || 1;
    return { u: u / m, v: hemi * v / m };
  };

  CircSim.prototype.drawArrows = function (ctx) {
    const a = this.e.flow;
    if (a < 0.02) return;
    const self = this, R = this.R;
    ctx.save();
    ctx.beginPath(); ctx.arc(this.cx, this.cy, R - 1, 0, Math.PI * 2); ctx.clip();
    const len = 9;
    this.arrows.forEach((p) => {
      const w = self.windAt(p.band, p.hemi);
      const lo = p.band * 30, hi = lo + 30;
      const edge = Math.min(p.lat - lo, hi - p.lat);
      const fade = S.clamp01(edge / 4) * S.clamp01((88 - Math.abs(p.lon)) / 18);
      if (fade < 0.02) return;
      const cosl = Math.max(0.3, Math.cos(p.lat * DEG));
      const head = self.proj(p.hemi * p.lat, p.lon);
      const tail = self.proj(p.hemi * p.lat - w.v * len, p.lon - w.u * len / cosl);
      const ang = Math.atan2(head.y - tail.y, head.x - tail.x);
      const sz = Math.max(6, R * 0.05);
      ctx.globalAlpha = a * fade;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(head.x, head.y);
      ctx.lineWidth = 5; ctx.strokeStyle = S.rgba(C.ink, 0.8); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = C.paper; ctx.stroke();
      S.arrowHead(ctx, head.x + Math.cos(ang) * 2, head.y + Math.sin(ang) * 2, ang, sz);
      ctx.fillStyle = C.paper; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = S.rgba(C.ink, 0.8); ctx.stroke();
    });
    ctx.restore();
  };

  // ---------- pressure badges on the left limb ----------
  CircSim.prototype.badge = function (ctx, x, y, letter, alpha) {
    if (alpha < 0.01) return;
    const r = Math.max(13, Math.min(18, this.R * 0.1));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.restore();
    S.label(ctx, letter, x, y + 1, { size: Math.round(r * 1.2), align: 'center', color: letter === TX('low') ? C.low : C.high, halo: false, alpha: alpha });
  };

  CircSim.prototype.drawPressure = function (ctx) {
    const cx = this.cx, cy = this.cy, R = this.R, e = this.e;
    this.badge(ctx, cx - R, cy, TX('low'), e.pOuter);
    const pc = Math.cos(82 * DEG), ps = Math.sin(82 * DEG);
    this.badge(ctx, cx - R * pc, cy - R * ps, TX('high'), e.pOuter);
    this.badge(ctx, cx - R * pc, cy + R * ps, TX('high'), e.pOuter);
    const self = this;
    [[30, TX('high')], [60, TX('low')]].forEach((pr) => {
      [1, -1].forEach((hm) => {
        self.badge(ctx, cx - R * Math.cos(pr[0] * DEG), cy - hm * R * Math.sin(pr[0] * DEG), pr[1], e.pInner);
      });
    });
  };

  // ---------- text on the face ----------
  CircSim.prototype.drawFaceLabels = function (ctx) {
    const cx = this.cx, cy = this.cy, R = this.R, e = this.e, fs = this.fs;
    if (e.warm > 0.02) {
      S.label(ctx, TX('warm'), cx, cy - R * 0.16, { size: fs + 2, align: 'center', color: S.DATA.warm, alpha: e.warm });
      S.label(ctx, TX('cold'), cx + R * 0.16, cy - R * Math.sin(60 * DEG), { size: fs + 2, align: 'center', color: S.DATA.cold, alpha: e.warm });
      S.label(ctx, TX('cold'), cx + R * 0.16, cy + R * Math.sin(60 * DEG), { size: fs + 2, align: 'center', color: S.DATA.cold, alpha: e.warm });
      this.drawRiseSink(ctx, e.warm);
    }
    if (e.winds > 0.02) {
      const wo = { size: fs, align: 'center', box: true, alpha: e.winds };
      const lx = cx + R * 0.12;
      S.label(ctx, TX('tradeNorth'), lx, cy - R * Math.sin(15 * DEG), wo);
      S.label(ctx, TX('tradeSouth'), lx, cy + R * Math.sin(15 * DEG), wo);
      S.label(ctx, TX('westerlies'), lx, cy - R * Math.sin(45 * DEG), wo);
      S.label(ctx, TX('westerlies'), lx, cy + R * Math.sin(45 * DEG), wo);
      // the polar band is too thin on the face -> label beside the pole with a leader line
      const self = this;
      [1, -1].forEach((hm) => {
        const target = self.proj(hm * 75, 45);
        let lines = TX('polarEasterliesLines');
        const single = S.textWidth(ctx, TX('polarEasterlies'), fs, 800);
        const xr = cx - Math.max(20, R * 0.2);
        const ly = cy - hm * (R + 34);
        if (xr - single - 8 > 2) lines = [TX('polarEasterlies')];
        let bw = 0;
        lines.forEach((l) => { bw = Math.max(bw, S.textWidth(ctx, l, fs, 800)); });
        const blockH = lines.length * (fs + 3);
        const yTop = hm > 0 ? ly - blockH + fs * 0.6 : ly - fs * 0.4;
        ctx.save();
        ctx.globalAlpha = e.winds;
        ctx.beginPath();
        ctx.moveTo(xr + 3, hm > 0 ? yTop + blockH - fs * 0.9 : yTop);
        ctx.lineTo(target.x, target.y);
        ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
        ctx.beginPath(); ctx.arc(target.x, target.y, 3, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
        ctx.restore();
        lines.forEach((l, i) => {
          S.label(ctx, l, xr, yTop + i * (fs + 3), { size: fs, align: 'right', alpha: e.winds });
        });
      });
    }
  };

  // Step 1: radial arrows on the right limb, warm air rising at the equator, cold air sinking
  // at the poles (radially outward = upwards into the atmosphere).
  CircSim.prototype.drawRiseSink = function (ctx, alpha) {
    const self = this, fs = this.fs, T = this.T;
    function arrow(lat, outward, col) {
      const a = self.limb(lat, outward ? 4 : T + 6), b = self.limb(lat, outward ? T + 6 : 4);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x - Math.cos(ang) * 6, b.y - Math.sin(ang) * 6);
      ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke();
      S.arrowHead(ctx, b.x + Math.cos(ang) * 4, b.y + Math.sin(ang) * 4, ang, 14);
      ctx.fillStyle = col; ctx.fill();
      ctx.restore();
    }
    function text(lat, lines, col) {
      const p = self.limb(lat, T + 10), n = lines.length;
      lines.forEach((l, i) => {
        S.label(ctx, l, p.x, p.y + (i - (n - 1) / 2) * (fs + 3), { size: fs, color: col, alpha: alpha });
      });
    }
    arrow(0, true, S.DATA.warm);
    text(0, RISE[this.key], S.DATA.warm);
    [1, -1].forEach((hm) => {
      arrow(hm * 70, false, S.DATA.cold);
      text(hm * 70, SINK[self.key], S.DATA.cold);
    });
  };

  // ---------- loop ----------
  CircSim.prototype.setStep = function (i) { this.step = S.clamp(i, 0, STEPS.length - 1); };

  CircSim.prototype.update = function (dt) {
    this.time += dt;
    const tgt = STEPS[this.step], e = this.e;
    Object.keys(e).forEach((k) => {
      const tau = k === 'rot' ? 0.9 : 0.5;
      e[k] = S.approach(e[k], tgt[k], dt, tau);
    });
    const sp = 0.1 * e.flow;
    [this.cellParticles.single, this.cellParticles.three].forEach((list) => {
      list.forEach((p) => { p.s += sp * dt; if (p.s >= 1) p.s -= 1; });
    });
    const self = this, speed = 11 * e.flow;
    this.arrows.forEach((p) => {
      const w = self.windAt(p.band, p.hemi);
      const lo = p.band * 30 + 1, hi = lo + 28;
      const cosl = Math.max(0.3, Math.cos(p.lat * DEG));
      p.lat += w.v * p.hemi * speed * dt;
      p.lon += w.u * speed * dt / cosl;
      if (p.lat > hi) p.lat = lo + (p.lat - hi);
      if (p.lat < lo) p.lat = hi - (lo - p.lat);
      if (p.lon > 88) p.lon -= 176;
      if (p.lon < -88) p.lon += 176;
    });
  };

  CircSim.prototype.draw = function (ctx) {
    ctx.fillStyle = C.sky;
    ctx.fillRect(0, 0, this.W, this.H);
    const e = this.e;
    const single = e.flow * (1 - S.smooth(e.rot)), three = e.flow * S.smooth(e.rot);

    this.drawFace(ctx);
    this.drawArrows(ctx);
    this.drawTubes(ctx, SINGLE, single);
    this.drawTubes(ctx, THREE, three);
    this.drawCellParticles(ctx, SINGLE, this.cellParticles.single, single);
    this.drawCellParticles(ctx, THREE, this.cellParticles.three, three);
    this.drawCellLabels(ctx, SINGLE, single);
    this.drawCellLabels(ctx, THREE, three);
    this.drawPressure(ctx);
    this.drawFaceLabels(ctx);
  };

  // ============ WIRING ============
  S.initCircSim = () => {
    const sim = new CircSim();
    const frame = document.getElementById('circ-frame');
    const zs = new S.ZoomStage(frame, sim);
    const stepBtns = document.querySelectorAll('#circ-steps button');
    const captions = document.querySelectorAll('#circ-captions .step-caption');
    const prev = document.getElementById('circ-prev');
    const next = document.getElementById('circ-next');
    const counter = document.getElementById('circ-counter');
    const badge = SCAPE.badge(frame);
    const tasks = SCAPE.tasks(document.getElementById('circ-tasks'));
    const quiz = document.getElementById('circ-quiz');
    const quizFeedback = document.getElementById('circ-quiz-feedback');

    const go = (i, byVisitor) => {
      sim.setStep(i);
      stepBtns.forEach((b, j) => {
        b.setAttribute('aria-current', j === sim.step ? 'step' : 'false');
        b.classList.toggle('done', j < sim.step);
      });
      captions.forEach((c, j) => { c.hidden = j !== sim.step; });
      prev.disabled = sim.step === 0;
      next.disabled = sim.step === STEPS.length - 1;
      counter.textContent = window.t('circ.counter', sim.step + 1, STEPS.length);
      if (byVisitor) badge.hide();
      // task: reach the last step (the wind belts)
      if (sim.step === STEPS.length - 1) tasks.done('steps');
    };
    stepBtns.forEach((b, j) => { b.addEventListener('click', () => { go(j, true); }); });
    prev.addEventListener('click', () => { go(sim.step - 1, true); });
    next.addEventListener('click', () => { go(sim.step + 1, true); });

    // task: which wind belt is the visitors' home region in? (the westerlies)
    quiz.addEventListener('click', e => {
      const b = e.target.closest('button[data-answer]');
      if (!b) return;
      const right = b.dataset.answer === 'west';
      quiz.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      quizFeedback.textContent = window.t(right ? 'circ.tasks.right' : 'circ.tasks.wrong');
      if (right) tasks.done('quiz');
    });

    go(0, false);
    badge.show(window.t('circ.badge'));
    return zs;
  };
})();

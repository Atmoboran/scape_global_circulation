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
(function () {
  'use strict';
  var S = window.SCAPE, C = S.COLORS, DEG = S.DEG;

  // `name` is used on wide screens, `short` on phones (the legend below spells the names out).
  var SINGLE = [{ lo: 0, hi: 90, sense: 1, color: C.orange, name: ['Ein großer', 'Kreislauf'], short: ['Ein', 'Kreislauf'] }];
  var THREE = [
    { lo: 0, hi: 30, sense: 1, color: C.rust, name: ['Hadley-Zelle'], short: ['Hadley'] },
    { lo: 30, hi: 60, sense: -1, color: C.cyan, name: ['Ferrel-Zelle'], short: ['Ferrel'] },
    { lo: 60, hi: 90, sense: 1, color: C.navy, name: ['Polarzelle'], short: ['Polar'] }
  ];
  var RISE = { name: ['Warme Luft', 'steigt auf'], short: ['Luft', 'steigt', 'auf'] };
  var SINK = { name: ['Kalte Luft', 'sinkt ab'], short: ['Luft', 'sinkt ab'] };
  // Surface wind per band, northern hemisphere, as (east, north) components.
  // Without rotation all surface air simply flows back towards the equator.
  var WIND_NOROT = { u: 0, v: -1 };
  var WIND_ROT = [{ u: -0.85, v: -0.5 }, { u: 0.85, v: 0.45 }, { u: -0.85, v: -0.45 }];
  var ARROWS_PER_BAND = [15, 11, 6];

  var STEPS = [
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
    var list = [];
    bands.forEach(function (b, bi) {
      [1, -1].forEach(function (hemi) {
        for (var j = 0; j < per; j++) list.push({ band: bi, hemi: hemi, s: Math.random(), jit: (Math.random() * 2 - 1) * 0.45 });
      });
    });
    return list;
  };

  CircSim.prototype.makeArrows = function () {
    var list = [];
    [0, 1, 2].forEach(function (bi) {
      [1, -1].forEach(function (hemi) {
        for (var j = 0; j < ARROWS_PER_BAND[bi]; j++) {
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
    var fs = this.narrow ? 14 : 16;
    this.fs = fs;
    var key = this.narrow ? 'short' : 'name';
    this.key = key;
    var L = 0;
    SINGLE.concat(THREE, [RISE, SINK]).forEach(function (b) {
      b[key].forEach(function (t) { L = Math.max(L, S.textWidth(ctx, t, fs, 800)); });
    });
    this.L = L;
    this.tFrac = this.narrow ? 0.24 : 0.3;
    // horizontal budget: badge margin + globe + tube + gap + label + right margin
    var rH = (W - 16 - 10 - 8 - L) / (2 + this.tFrac);
    var rV = (H / 2 - 48) / 1.3;
    this.R = Math.max(60, Math.min(rH, rV));
    this.T = this.R * this.tFrac;
    var total = 16 + (2 + this.tFrac) * this.R + 10 + L;
    this.cx = Math.max(0, (W - total) / 2) + 16 + this.R;
    this.cy = H / 2;
  };

  // ---------- projection ----------
  CircSim.prototype.proj = function (lat, lon) {
    return { x: this.cx + this.R * Math.cos(lat * DEG) * Math.sin(lon * DEG), y: this.cy - this.R * Math.sin(lat * DEG) };
  };
  // point on the right limb at latitude lat (signed: +N / -S), pushed out by `off` pixels
  CircSim.prototype.limb = function (lat, off) {
    var r = this.R + off;
    return { x: this.cx + r * Math.cos(lat * DEG), y: this.cy - r * Math.sin(lat * DEG) };
  };

  // ---------- cell tubes (same loop model as the original globe version) ----------
  CircSim.prototype.tubeOffset = function (s) {
    var TW = 0.08, T = this.T;
    if (s < 0.5) return s > 0.5 - TW ? T * S.smooth((s - (0.5 - TW)) / TW) : 0;
    return s > 1 - TW ? T * (1 - S.smooth((s - (1 - TW)) / TW)) : T;
  };
  // s in [0,1): first half near the surface, second half aloft. sense +1 = direct cell
  // (surface flow towards the equator), -1 = indirect Ferrel cell (surface flow poleward).
  CircSim.prototype.tubePoint = function (b, hemi, s, jit) {
    var half = s < 0.5, t = half ? s * 2 : (s - 0.5) * 2;
    var equatorward = b.sense > 0 ? half : !half;
    var lat = equatorward ? S.lerp(b.hi, b.lo, t) : S.lerp(b.lo, b.hi, t);
    var off = S.clamp(this.tubeOffset(s) + jit * this.T * 0.5, 2, this.T - 2);
    return this.limb(hemi * lat, off);
  };

  CircSim.prototype.drawTubes = function (ctx, bands, alpha) {
    if (alpha < 0.01) return;
    var self = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    bands.forEach(function (b) {
      [1, -1].forEach(function (hemi) {
        var N = 16, i;
        ctx.beginPath();
        for (i = 0; i <= N; i++) { var p = self.limb(hemi * S.lerp(b.lo, b.hi, i / N), 0); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
        for (i = 0; i <= N; i++) { var q = self.limb(hemi * S.lerp(b.hi, b.lo, i / N), self.T); ctx.lineTo(q.x, q.y); }
        ctx.closePath();
        ctx.fillStyle = S.rgba(b.color, 0.35); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
      });
    });
    ctx.restore();
  };

  CircSim.prototype.drawCellParticles = function (ctx, bands, list, alpha) {
    if (alpha < 0.01) return;
    var self = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    list.forEach(function (p) {
      var b = bands[p.band];
      var a = self.tubePoint(b, p.hemi, p.s, p.jit);
      var s2 = p.s - 0.025; if (s2 < 0) s2 += 1;
      var t = self.tubePoint(b, p.hemi, s2, p.jit);
      ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(a.x, a.y);
      ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(a.x, a.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(17,17,17,0.6)'; ctx.stroke();
    });
    ctx.restore();
  };

  CircSim.prototype.drawCellLabels = function (ctx, bands, alpha) {
    if (alpha < 0.01) return;
    var self = this, fs = this.fs;
    bands.forEach(function (b) {
      [1, -1].forEach(function (hemi) {
        var mid = (b.lo + b.hi) / 2;
        if (b.hi === 90 && b.lo === 0) mid = 45;
        var p = self.limb(hemi * mid, self.T + 10);
        var names = b[self.key], n = names.length;
        for (var i = 0; i < n; i++) {
          var y = p.y + (i - (n - 1) / 2) * (fs + 3);
          S.label(ctx, names[i], p.x, y, { size: fs, color: b.color === C.orange ? C.rust : b.color, alpha: alpha });
        }
      });
    });
  };

  // ---------- globe face ----------
  CircSim.prototype.drawFace = function (ctx) {
    var cx = this.cx, cy = this.cy, R = this.R, h = this.e.heat;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    var g = ctx.createLinearGradient(0, cy - R, 0, cy + R);
    var neutral = '#e9e4d6';
    var stops = [[0, '#ffffff'], [0.1, C.pastelBlue], [0.28, C.pastelYellow], [0.5, C.orange], [0.72, C.pastelYellow], [0.9, C.pastelBlue], [1, '#ffffff']];
    stops.forEach(function (s) { g.addColorStop(s[0], S.mix(neutral, s[1], h)); });
    ctx.fillStyle = g;
    ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    // soft 3D shading
    var vg = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
    vg.addColorStop(0, 'rgba(255,255,255,0.25)');
    vg.addColorStop(0.6, 'rgba(255,255,255,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = vg;
    ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);

    // latitude lines: equator always, 30°/60° once the three cells exist
    ctx.strokeStyle = 'rgba(17,17,17,0.45)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([2, 5]);
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
    var a = this.e.rot;
    if (a > 0.02) {
      ctx.globalAlpha = a;
      [30, 60].forEach(function (lat) {
        [1, -1].forEach(function (hm) {
          var y = cy - hm * R * Math.sin(lat * DEG), half = R * Math.cos(lat * DEG);
          ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx + half, y); ctx.stroke();
        });
      });
    }
    ctx.restore();

    // ITCZ cloud band
    var cl = this.e.pInner;
    if (cl > 0.02) {
      ctx.save();
      ctx.globalAlpha = cl;
      var r = Math.max(5, R * 0.045);
      for (var lon = -70; lon <= 70; lon += 20) {
        var p = this.proj(0, lon);
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(17,17,17,0.35)'; ctx.lineWidth = 1;
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
    var r = this.e.rot, w = WIND_ROT[band];
    var u = S.lerp(WIND_NOROT.u, w.u, r), v = S.lerp(WIND_NOROT.v, w.v, r);
    var m = Math.hypot(u, v) || 1;
    return { u: u / m, v: hemi * v / m };
  };

  CircSim.prototype.drawArrows = function (ctx) {
    var a = this.e.flow;
    if (a < 0.02) return;
    var self = this, R = this.R;
    ctx.save();
    ctx.beginPath(); ctx.arc(this.cx, this.cy, R - 1, 0, Math.PI * 2); ctx.clip();
    var len = 9;
    this.arrows.forEach(function (p) {
      var w = self.windAt(p.band, p.hemi);
      var lo = p.band * 30, hi = lo + 30;
      var edge = Math.min(p.lat - lo, hi - p.lat);
      var fade = S.clamp01(edge / 4) * S.clamp01((88 - Math.abs(p.lon)) / 18);
      if (fade < 0.02) return;
      var cosl = Math.max(0.3, Math.cos(p.lat * DEG));
      var head = self.proj(p.hemi * p.lat, p.lon);
      var tail = self.proj(p.hemi * p.lat - w.v * len, p.lon - w.u * len / cosl);
      var ang = Math.atan2(head.y - tail.y, head.x - tail.x);
      var sz = Math.max(6, R * 0.05);
      ctx.globalAlpha = a * fade;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(head.x, head.y);
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(17,17,17,0.8)'; ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      S.arrowHead(ctx, head.x + Math.cos(ang) * 2, head.y + Math.sin(ang) * 2, ang, sz);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(17,17,17,0.8)'; ctx.stroke();
    });
    ctx.restore();
  };

  // ---------- pressure badges on the left limb ----------
  CircSim.prototype.badge = function (ctx, x, y, letter, alpha) {
    if (alpha < 0.01) return;
    var r = Math.max(13, Math.min(18, this.R * 0.1));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.restore();
    S.label(ctx, letter, x, y + 1, { size: Math.round(r * 1.2), align: 'center', color: letter === 'T' ? C.red : C.navy, halo: false, alpha: alpha });
  };

  CircSim.prototype.drawPressure = function (ctx) {
    var cx = this.cx, cy = this.cy, R = this.R, e = this.e;
    this.badge(ctx, cx - R, cy, 'T', e.pOuter);
    var pc = Math.cos(82 * DEG), ps = Math.sin(82 * DEG);
    this.badge(ctx, cx - R * pc, cy - R * ps, 'H', e.pOuter);
    this.badge(ctx, cx - R * pc, cy + R * ps, 'H', e.pOuter);
    var self = this;
    [[30, 'H'], [60, 'T']].forEach(function (pr) {
      [1, -1].forEach(function (hm) {
        self.badge(ctx, cx - R * Math.cos(pr[0] * DEG), cy - hm * R * Math.sin(pr[0] * DEG), pr[1], e.pInner);
      });
    });
  };

  // ---------- text on the face ----------
  CircSim.prototype.drawFaceLabels = function (ctx) {
    var cx = this.cx, cy = this.cy, R = this.R, e = this.e, fs = this.fs;
    if (e.warm > 0.02) {
      S.label(ctx, 'warm', cx, cy - R * 0.16, { size: fs + 2, align: 'center', color: C.red, alpha: e.warm });
      S.label(ctx, 'kalt', cx + R * 0.16, cy - R * Math.sin(60 * DEG), { size: fs + 2, align: 'center', color: C.navy, alpha: e.warm });
      S.label(ctx, 'kalt', cx + R * 0.16, cy + R * Math.sin(60 * DEG), { size: fs + 2, align: 'center', color: C.navy, alpha: e.warm });
      this.drawRiseSink(ctx, e.warm);
    }
    if (e.winds > 0.02) {
      var wo = { size: fs, align: 'center', box: true, alpha: e.winds };
      var lx = cx + R * 0.12;
      S.label(ctx, 'Nordost-Passat', lx, cy - R * Math.sin(15 * DEG), wo);
      S.label(ctx, 'Südost-Passat', lx, cy + R * Math.sin(15 * DEG), wo);
      S.label(ctx, 'Westwinde', lx, cy - R * Math.sin(45 * DEG), wo);
      S.label(ctx, 'Westwinde', lx, cy + R * Math.sin(45 * DEG), wo);
      // the polar band is too thin on the face -> label beside the pole with a leader line
      var self = this;
      [1, -1].forEach(function (hm) {
        var target = self.proj(hm * 75, 45);
        var lines = ['Polare', 'Ostwinde'];
        var single = S.textWidth(ctx, 'Polare Ostwinde', fs, 800);
        var xr = cx - Math.max(20, R * 0.2);
        var ly = cy - hm * (R + 34);
        if (xr - single - 8 > 2) lines = ['Polare Ostwinde'];
        var bw = 0;
        lines.forEach(function (l) { bw = Math.max(bw, S.textWidth(ctx, l, fs, 800)); });
        var blockH = lines.length * (fs + 3);
        var yTop = hm > 0 ? ly - blockH + fs * 0.6 : ly - fs * 0.4;
        ctx.save();
        ctx.globalAlpha = e.winds;
        ctx.beginPath();
        ctx.moveTo(xr + 3, hm > 0 ? yTop + blockH - fs * 0.9 : yTop);
        ctx.lineTo(target.x, target.y);
        ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
        ctx.beginPath(); ctx.arc(target.x, target.y, 3, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
        ctx.restore();
        lines.forEach(function (l, i) {
          S.label(ctx, l, xr, yTop + i * (fs + 3), { size: fs, align: 'right', alpha: e.winds });
        });
      });
    }
  };

  // Step 1: radial arrows on the right limb, warm air rising at the equator, cold air sinking
  // at the poles (radially outward = upwards into the atmosphere).
  CircSim.prototype.drawRiseSink = function (ctx, alpha) {
    var self = this, fs = this.fs, T = this.T;
    function arrow(lat, outward, col) {
      var a = self.limb(lat, outward ? 4 : T + 6), b = self.limb(lat, outward ? T + 6 : 4);
      var ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x - Math.cos(ang) * 6, b.y - Math.sin(ang) * 6);
      ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke();
      S.arrowHead(ctx, b.x + Math.cos(ang) * 4, b.y + Math.sin(ang) * 4, ang, 14);
      ctx.fillStyle = col; ctx.fill();
      ctx.restore();
    }
    function text(lat, lines, col) {
      var p = self.limb(lat, T + 10), n = lines.length;
      lines.forEach(function (l, i) {
        S.label(ctx, l, p.x, p.y + (i - (n - 1) / 2) * (fs + 3), { size: fs, color: col, alpha: alpha });
      });
    }
    arrow(0, true, C.red);
    text(0, RISE[this.key], C.red);
    [1, -1].forEach(function (hm) {
      arrow(hm * 70, false, C.navy);
      text(hm * 70, SINK[self.key], C.navy);
    });
  };

  // ---------- loop ----------
  CircSim.prototype.setStep = function (i) { this.step = S.clamp(i, 0, STEPS.length - 1); };

  CircSim.prototype.update = function (dt) {
    this.time += dt;
    var tgt = STEPS[this.step], e = this.e;
    Object.keys(e).forEach(function (k) {
      var tau = k === 'rot' ? 0.9 : 0.5;
      e[k] = S.approach(e[k], tgt[k], dt, tau);
    });
    var sp = 0.1 * e.flow;
    [this.cellParticles.single, this.cellParticles.three].forEach(function (list) {
      list.forEach(function (p) { p.s += sp * dt; if (p.s >= 1) p.s -= 1; });
    });
    var self = this, speed = 11 * e.flow;
    this.arrows.forEach(function (p) {
      var w = self.windAt(p.band, p.hemi);
      var lo = p.band * 30 + 1, hi = lo + 28;
      var cosl = Math.max(0.3, Math.cos(p.lat * DEG));
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
    var e = this.e;
    var single = e.flow * (1 - S.smooth(e.rot)), three = e.flow * S.smooth(e.rot);

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
  S.initCircSim = function () {
    var sim = new CircSim();
    var zs = new S.ZoomStage(document.getElementById('circ-card'), sim);
    var stepBtns = document.querySelectorAll('#circ-steps button');
    var captions = document.querySelectorAll('#circ-captions .step-caption');
    var prev = document.getElementById('circ-prev');
    var next = document.getElementById('circ-next');
    var counter = document.getElementById('circ-counter');

    function go(i) {
      sim.setStep(i);
      stepBtns.forEach(function (b, j) {
        b.setAttribute('aria-current', j === sim.step ? 'step' : 'false');
        b.classList.toggle('done', j < sim.step);
      });
      captions.forEach(function (c, j) { c.hidden = j !== sim.step; });
      prev.disabled = sim.step === 0;
      next.disabled = sim.step === STEPS.length - 1;
      counter.textContent = 'Schritt ' + (sim.step + 1) + ' von ' + STEPS.length;
    }
    stepBtns.forEach(function (b, j) { b.addEventListener('click', function () { go(j); }); });
    prev.addEventListener('click', function () { go(sim.step - 1); });
    next.addEventListener('click', function () { go(sim.step + 1); });
    go(0);
    return zs;
  };
})();

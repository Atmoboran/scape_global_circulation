// Simulation 1 — why the equator gets more solar energy than the poles.
//
// Left/top: Earth seen from the side, lit by parallel sunlight from the left. Two equally wide
// beams (A at the equator, B at a latitude chosen with the slider) carry the same amount of
// light. Because the surface is curved, beam B hits it at a slant and its light is smeared over
// a longer stretch of ground.
// Right/bottom: a close-up of the ground under each beam, split into equal "tiles". The same
// number of light packets per second lands on 2 tiles at the equator but on many more tiles
// further north, so each tile gets less energy: energy per area = sin(sun elevation).
(function () {
  'use strict';
  var S = window.SCAPE, C = S.COLORS;

  var COL_A = C.red, COL_B = C.cyan;
  var BEAM_HALF = 0.06;        // half beam width as a fraction of the globe radius
  var PACKETS_PER_SEC = 9;

  function SunSim() {
    this.latB = 50;
    this.globePackets = [[], []];
    this.patchPackets = [[], []];
    this.flashes = [];
    this.spawnAcc = 0;
  }

  SunSim.prototype.heightFor = function (W) {
    return W >= 620 ? Math.max(460, W * 0.56) : W * 1.5;
  };

  SunSim.prototype.layout = function (ctx, W, H) {
    this.W = W; this.H = H;
    var pad = 12;
    this.wide = W >= 620 && W / H > 1.2;
    if (this.wide) {
      this.G = { x: 0, y: 0, w: Math.round(W * 0.56), h: H };
      var px = this.G.w + pad, pw = W - this.G.w - 2 * pad, ph = (H - 3 * pad) / 2;
      this.P = [{ x: px, y: pad, w: pw, h: ph }, { x: px, y: 2 * pad + ph, w: pw, h: ph }];
    } else {
      var gh = Math.round(H * 0.56);
      this.G = { x: 0, y: 0, w: W, h: gh };
      var pw2 = (W - 3 * pad) / 2, ph2 = H - gh - pad;
      this.P = [{ x: pad, y: gh, w: pw2, h: ph2 }, { x: 2 * pad + pw2, y: gh, w: pw2, h: ph2 }];
    }
    var G = this.G;
    var titleH = 36, bottomReserve = this.wide ? 0 : 26;
    var avail = G.h - titleH - bottomReserve;
    this.Rg = Math.max(40, Math.min(G.w * 0.34, (avail - 58) / 2));
    this.gx = G.x + G.w - this.Rg - Math.max(22, G.w * 0.07);
    this.gy = G.y + titleH + avail / 2;
    this.sunR = Math.max(16, Math.min(26, this.Rg * 0.17));
    this.sx = G.x + this.sunR + 14;
    this.sy = this.gy;
    this.beamX0 = this.sx + this.sunR + 10;
    this.globePackets = [[], []];
    this.patchPackets = [[], []];
    this.flashes = [];
  };

  // x of the sunlit (left) surface at screen height y
  SunSim.prototype.surfaceX = function (y) {
    var dy = y - this.gy;
    return this.gx - Math.sqrt(Math.max(0, this.Rg * this.Rg - dy * dy));
  };

  SunSim.prototype.beamY = function (i) {
    var lat = i === 0 ? 0 : this.latB;
    return this.gy - this.Rg * Math.sin(lat * S.DEG);
  };

  // Geometry of the close-up for beam i: sun elevation, ground patch, tiles.
  SunSim.prototype.patchGeom = function (i) {
    var P = this.P[i];
    var lat = i === 0 ? 0 : this.latB;
    var elev = 90 - lat;
    var sinE = Math.sin(elev * S.DEG);
    var top = P.y + 58;
    var gl = P.y + P.h - 80;
    var t = Math.min(P.w * 0.12, (gl - top) * 0.32);
    var bw = 2 * t;                                  // beam width, perpendicular to the rays
    var L = bw / sinE;                               // lit ground length
    var Lmax = bw / Math.sin(20 * S.DEG);
    var x0 = P.x + Math.max(8, (P.w - Lmax) / 2);
    return { P: P, lat: lat, elev: elev, sinE: sinE, top: top, gl: gl, t: t, bw: bw, L: L, x0: x0,
      dx: -Math.cos(elev * S.DEG), dy: -sinE };
  };

  SunSim.prototype.setLat = function (lat) { this.latB = lat; this.patchPackets[1] = []; };

  SunSim.prototype.update = function (dt) {
    var self = this;
    this.spawnAcc += dt * PACKETS_PER_SEC;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      for (var i = 0; i < 2; i++) {
        var yc = this.beamY(i), hb = this.Rg * BEAM_HALF;
        this.globePackets[i].push({ x: this.beamX0 + 30, y: yc + (Math.random() * 2 - 1) * hb * 0.85 });
        this.patchPackets[i].push({ u: 0.06 + Math.random() * 0.88, s: 0 });
      }
    }
    var speedG = Math.max(120, this.Rg * 1.6);
    for (var i2 = 0; i2 < 2; i2++) {
      this.globePackets[i2] = this.globePackets[i2].filter(function (p) {
        p.x += speedG * dt;
        var sx = self.surfaceX(p.y);
        if (p.x >= sx) { self.flashes.push({ x: sx, y: p.y, age: 0 }); return false; }
        return true;
      });
      var g = this.patchGeom(i2);
      var len = (g.gl - g.top) / g.sinE;
      var speedP = Math.max(110, len * 0.9);
      this.patchPackets[i2] = this.patchPackets[i2].filter(function (p) {
        p.s += speedP * dt / len;
        if (p.s >= 1) {
          self.flashes.push({ x: g.x0 + p.u * g.L, y: g.gl, age: 0, onPatch: i2 + 1 });
          return false;
        }
        return true;
      });
    }
    this.flashes = this.flashes.filter(function (f) { f.age += dt; return f.age < 0.45; });
  };

  // ============ DRAW: globe panel ============
  SunSim.prototype.drawGlobe = function (ctx) {
    var G = this.G, gx = this.gx, gy = this.gy, R = this.Rg;

    S.label(ctx, 'Die Erde von der Seite', G.x + 14, G.y + 22, { size: 16 });

    // faint background rays
    ctx.save();
    ctx.strokeStyle = S.rgba(C.mustard, 0.45);
    ctx.fillStyle = S.rgba(C.mustard, 0.45);
    ctx.lineWidth = 1.5;
    var step = Math.max(16, R * 0.2);
    for (var y = gy - R * 1.2; y <= gy + R * 1.2 + 0.1; y += step) {
      var xEnd = Math.abs(y - gy) < R ? this.surfaceX(y) - 3 : G.x + G.w - 10;
      if (xEnd - this.beamX0 < 20) continue;
      ctx.beginPath(); ctx.moveTo(this.beamX0, y); ctx.lineTo(xEnd - 6, y); ctx.stroke();
      S.arrowHead(ctx, xEnd, y, 0, 7); ctx.fill();
    }
    ctx.restore();

    // atmosphere shell
    ctx.beginPath(); ctx.arc(gx, gy, R * 1.07, 0, Math.PI * 2);
    ctx.fillStyle = S.rgba(C.cyan, 0.14); ctx.fill();

    // globe: temperature colouring (warm equator, cold poles)
    ctx.save();
    ctx.beginPath(); ctx.arc(gx, gy, R, 0, Math.PI * 2); ctx.clip();
    var grad = ctx.createLinearGradient(0, gy - R, 0, gy + R);
    grad.addColorStop(0, C.paper);
    grad.addColorStop(0.12, C.pastelBlue);
    grad.addColorStop(0.3, C.pastelYellow);
    grad.addColorStop(0.5, C.orange);
    grad.addColorStop(0.7, C.pastelYellow);
    grad.addColorStop(0.88, C.pastelBlue);
    grad.addColorStop(1, C.paper);
    ctx.fillStyle = grad;
    ctx.fillRect(gx - R, gy - R, 2 * R, 2 * R);
    // night side
    ctx.fillStyle = S.rgba(C.ink, 0.42);
    ctx.fillRect(gx, gy - R, R, 2 * R);
    // latitude lines
    ctx.strokeStyle = S.rgba(C.ink, 0.45);
    ctx.lineWidth = 1.3;
    ctx.setLineDash([2, 5]);
    [0, 30, 60].forEach(function (lat) {
      [1, -1].forEach(function (h) {
        if (lat === 0 && h < 0) return;
        var yy = gy - h * R * Math.sin(lat * S.DEG), half = R * Math.cos(lat * S.DEG);
        ctx.beginPath(); ctx.moveTo(gx - half, yy); ctx.lineTo(gx + half, yy); ctx.stroke();
      });
    });
    ctx.setLineDash([]);
    ctx.restore();
    ctx.beginPath(); ctx.arc(gx, gy, R, 0, Math.PI * 2);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5; ctx.stroke();

    // latitude labels on the night side
    var fs = R > 120 ? 14 : 13;
    S.label(ctx, 'Äquator 0°', gx + R - 8, gy + 10, { size: fs, align: 'right', color: C.paper, halo: false });
    S.label(ctx, '30°', gx + R * Math.cos(30 * S.DEG) - 8, gy - R * Math.sin(30 * S.DEG) + 10, { size: fs, align: 'right', color: C.paper, halo: false });
    S.label(ctx, '60°', gx + R * Math.cos(60 * S.DEG) - 6, gy - R * Math.sin(60 * S.DEG) + 10, { size: fs, align: 'right', color: C.paper, halo: false });
    S.label(ctx, 'Nordpol', gx, gy - R - 16, { size: 14, align: 'center' });
    S.label(ctx, 'Südpol', gx, gy + R + 16, { size: 14, align: 'center' });

    // the two beams
    for (var i = 0; i < 2; i++) this.drawGlobeBeam(ctx, i);

    // packets
    for (var j = 0; j < 2; j++) {
      this.globePackets[j].forEach(function (p) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = C.yellow; ctx.fill();
        ctx.lineWidth = 1.2; ctx.strokeStyle = C.ink; ctx.stroke();
      });
    }

    this.drawBeamTag(ctx, 0);
    this.drawBeamTag(ctx, 1);

    // flashes where packets hit the globe
    var gx0 = this.G.x + this.G.w;
    this.flashes.forEach(function (f) {
      if (f.x > gx0 || f.y === undefined || f.onPatch) return;
      var k = f.age / 0.45;
      ctx.beginPath(); ctx.arc(f.x, f.y, 2 + k * 7, 0, Math.PI * 2);
      ctx.strokeStyle = S.rgba(C.red, (1 - k)); ctx.lineWidth = 1.5; ctx.stroke();
    });

    // sun
    ctx.beginPath(); ctx.arc(this.sx, this.sy, this.sunR * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = S.rgba(C.yellow, 0.35); ctx.fill();
    ctx.beginPath(); ctx.arc(this.sx, this.sy, this.sunR, 0, Math.PI * 2);
    ctx.fillStyle = C.yellow; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink; ctx.stroke();
    S.label(ctx, 'Sonne', this.sx - this.sunR + 2, this.sy + this.sunR * 1.6 + 14, { size: 14 });
  };

  SunSim.prototype.drawGlobeBeam = function (ctx, i) {
    var col = i === 0 ? COL_A : COL_B;
    var yc = this.beamY(i), hb = this.Rg * BEAM_HALF;
    var y1 = yc - hb, y2 = yc + hb, N = 14, k, yy;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.beamX0, y1);
    for (k = 0; k <= N; k++) { yy = y1 + (y2 - y1) * k / N; ctx.lineTo(this.surfaceX(yy), yy); }
    ctx.lineTo(this.beamX0, y2);
    ctx.closePath();
    ctx.fillStyle = S.rgba(C.yellow, 0.55);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = col;
    ctx.stroke();
    // lit stretch of surface
    ctx.beginPath();
    for (k = 0; k <= N; k++) { yy = y1 + (y2 - y1) * k / N; if (k === 0) ctx.moveTo(this.surfaceX(yy), yy); else ctx.lineTo(this.surfaceX(yy), yy); }
    ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.stroke();
    ctx.restore();
  };

  SunSim.prototype.drawBeamTag = function (ctx, i) {
    var col = i === 0 ? COL_A : COL_B, yc = this.beamY(i);
    var tag = i === 0 ? 'A' : 'B';
    var tx = this.beamX0 + 16, r = 11;
    ctx.beginPath(); ctx.arc(tx, yc, r, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
    S.label(ctx, tag, tx, yc + 1, { size: 14, align: 'center', color: C.paper, halo: false });
  };

  // ============ DRAW: close-up panels ============
  SunSim.prototype.drawPatch = function (ctx, i) {
    var g = this.patchGeom(i), P = g.P, col = i === 0 ? COL_A : COL_B;

    // frame
    ctx.fillStyle = C.closeUp;
    ctx.fillRect(P.x, P.y, P.w, P.h);
    ctx.lineWidth = 3; ctx.strokeStyle = col;
    ctx.strokeRect(P.x + 1.5, P.y + 1.5, P.w - 3, P.h - 3);

    var title = i === 0 ? 'A: Äquator' : 'B: ' + g.lat + '° Nord';
    S.label(ctx, title, P.x + 12, P.y + 20, { size: 16, color: col });
    S.label(ctx, 'Sonne ' + Math.round(g.elev) + '° hoch', P.x + 12, P.y + 42, { size: 14, weight: 700 });

    // beam (clipped to the sky area of the panel)
    var far = (g.gl - g.top) / g.sinE + 40;
    ctx.save();
    ctx.beginPath(); ctx.rect(P.x + 3, g.top - 6, P.w - 6, g.gl - g.top + 6); ctx.clip();
    ctx.beginPath();
    ctx.moveTo(g.x0, g.gl);
    ctx.lineTo(g.x0 + g.L, g.gl);
    ctx.lineTo(g.x0 + g.L + g.dx * far, g.gl + g.dy * far);
    ctx.lineTo(g.x0 + g.dx * far, g.gl + g.dy * far);
    ctx.closePath();
    ctx.fillStyle = S.rgba(C.yellow, 0.5); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();
    // packets
    var len = (g.gl - g.top) / g.sinE;
    this.patchPackets[i].forEach(function (p) {
      var gxp = g.x0 + p.u * g.L;
      var d = (1 - p.s) * len;
      var x = gxp + g.dx * d, y = g.gl + g.dy * d;
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = C.yellow; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = C.ink; ctx.stroke();
    });
    ctx.restore();

    // ground tiles, each shaded by how much light it receives
    var tileH = 16, x, j;
    ctx.fillStyle = C.ground;
    ctx.fillRect(P.x + 3, g.gl, P.w - 6, tileH);
    for (j = -1; ; j++) {
      x = g.x0 + j * g.t;
      if (x > P.x + P.w - 4) break;
      var a = Math.max(x, g.x0), b = Math.min(x + g.t, g.x0 + g.L);
      var share = Math.max(0, b - a) / g.L;           // fraction of the beam on this tile
      var e = share * 2;                               // 1.0 == an equator tile
      var xa = Math.max(x, P.x + 3), xb = Math.min(x + g.t, P.x + P.w - 3);
      if (xb <= xa) continue;
      ctx.fillStyle = e > 0.001 ? (e > 0.5 ? S.mix(C.yellow, C.red, (e - 0.5) * 2) : S.mix(C.ground, C.yellow, e * 2)) : C.ground;
      ctx.fillRect(xa, g.gl, xb - xa, tileH);
      ctx.lineWidth = 1.5; ctx.strokeStyle = C.ink;
      ctx.strokeRect(xa, g.gl, xb - xa, tileH);
    }

    // flashes where packets land
    this.flashes.forEach(function (f) {
      if (f.onPatch !== i + 1) return;
      var k = f.age / 0.45;
      ctx.beginPath(); ctx.arc(f.x, f.y, 3 + k * 9, 0, Math.PI * 2);
      ctx.strokeStyle = S.rgba(C.red, (1 - k)); ctx.lineWidth = 2; ctx.stroke();
    });

    // bracket over the lit stretch
    var by = g.gl + tileH + 8;
    ctx.beginPath();
    ctx.moveTo(g.x0, by - 4); ctx.lineTo(g.x0, by); ctx.lineTo(g.x0 + g.L, by); ctx.lineTo(g.x0 + g.L, by - 4);
    ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();

    var tiles = g.L / g.t;
    var pct = Math.round(g.sinE * 100);
    S.label(ctx, 'Fläche: ' + tiles.toFixed(1).replace('.', ',') + ' Kacheln', P.x + 12, by + 16, { size: 14, weight: 700 });
    S.label(ctx, 'Je Kachel: ' + pct + ' %', P.x + 12, by + 38, { size: 16, color: col });
  };

  SunSim.prototype.draw = function (ctx) {
    ctx.fillStyle = C.sky;
    ctx.fillRect(0, 0, this.W, this.H);
    this.drawGlobe(ctx);
    this.drawPatch(ctx, 0);
    this.drawPatch(ctx, 1);
    if (!this.wide) {
      S.label(ctx, 'Nahaufnahme vom Boden unter A und B', this.W / 2, this.G.h - 10, { size: 14, align: 'center' });
    }
  };

  // ============ WIRING ============
  S.initSunSim = function () {
    var sim = new SunSim();
    var zs = new S.ZoomStage(document.getElementById('sun-card'), sim);
    var slider = document.getElementById('lat-slider');
    var valEl = document.getElementById('lat-value');
    var resEl = document.getElementById('sun-result');

    function refresh() {
      var lat = +slider.value;
      sim.setLat(lat);
      var elev = 90 - lat, f = Math.sin(elev * S.DEG);
      valEl.textContent = lat + '° Nord';
      resEl.innerHTML = 'Bei <b>' + lat + '° Nord</b> steht die Sonne nur <b>' + elev + '°</b> hoch. ' +
        'Dasselbe Licht verteilt sich auf <b>' + (1 / f).toFixed(1).replace('.', ',') + '-mal</b> so viel Fläche. ' +
        'Jeder Quadratmeter bekommt nur <b>' + Math.round(f * 100) + ' %</b> der Energie, die am Äquator ankommt.';
    }
    slider.addEventListener('input', refresh);
    document.querySelectorAll('#sun-presets button').forEach(function (b) {
      b.addEventListener('click', function () { slider.value = b.getAttribute('data-lat'); refresh(); });
    });
    refresh();
    return zs;
  };
})();

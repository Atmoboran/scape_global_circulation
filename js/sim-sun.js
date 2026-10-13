// Simulation 1 — why the equator gets more solar energy than the poles.
//
// Left/top: Earth seen from the side, lit by parallel sunlight from the left. Two equally wide
// beams (A at the equator, B at a latitude chosen with the slider) carry the same amount of
// light. Because the surface is curved, beam B hits it at a slant and its light is smeared over
// a longer stretch of ground.
// Right/bottom: a close-up of the ground under each beam, split into equal "tiles". The same
// number of light packets per second lands on 2 tiles at the equator but on many more tiles
// further north, so each tile gets less energy: energy per area = sin(sun elevation).
(() => {
  'use strict';
  const S = window.SCAPE, C = S.COLORS;
  const T = key => window.t('sun.canvas.' + key);

  const COL_A = C.beamA, COL_B = C.beamB;    // two things compared: red vs blue
  const BEAM_HALF = 0.06;        // half beam width as a fraction of the globe radius
  const PACKETS_PER_SEC = 9;
  const num = (v, d) => v.toFixed(d).replace('.', ',');

  // Globe colours by latitude on the CD temperature scale (warm equator, cold poles).
  const globeGradient = (ctx, gy, R) => {
    const g = ctx.createLinearGradient(0, gy - R, 0, gy + R);
    for (let lat = 90; lat >= -90; lat -= 10) g.addColorStop((1 - Math.sin(lat * S.DEG)) / 2, S.tempAt(lat));
    return g;
  };
  S.globeGradient = globeGradient;

  class SunSim {
    constructor() {
      this.latB = 50;
      this.globePackets = [[], []];
      this.patchPackets = [[], []];
      this.flashes = [];
      this.spawnAcc = 0;
    }

    heightFor(W) {
      return W >= 620 ? Math.max(460, W * 0.56) : W * 1.5;
    }

    layout(ctx, W, H) {
      this.W = W; this.H = H;
      const pad = 12;
      this.wide = W >= 620 && W / H > 1.2;
      if (this.wide) {
        this.G = { x: 0, y: 0, w: Math.round(W * 0.56), h: H };
        const px = this.G.w + pad, pw = W - this.G.w - 2 * pad, ph = (H - 3 * pad) / 2;
        this.P = [{ x: px, y: pad, w: pw, h: ph }, { x: px, y: 2 * pad + ph, w: pw, h: ph }];
      } else {
        const gh = Math.round(H * 0.56);
        this.G = { x: 0, y: 0, w: W, h: gh };
        const pw = (W - 3 * pad) / 2, ph = H - gh - pad;
        this.P = [{ x: pad, y: gh, w: pw, h: ph }, { x: 2 * pad + pw, y: gh, w: pw, h: ph }];
      }
      const G = this.G;
      const titleH = 36, bottomReserve = this.wide ? 0 : 26;
      const avail = G.h - titleH - bottomReserve;
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
    }

    // x of the sunlit (left) surface at screen height y
    surfaceX(y) {
      const dy = y - this.gy;
      return this.gx - Math.sqrt(Math.max(0, this.Rg * this.Rg - dy * dy));
    }

    beamY(i) {
      const lat = i === 0 ? 0 : this.latB;
      return this.gy - this.Rg * Math.sin(lat * S.DEG);
    }

    // Geometry of the close-up for beam i: sun elevation, ground patch, tiles.
    patchGeom(i) {
      const P = this.P[i];
      const lat = i === 0 ? 0 : this.latB;
      const elev = 90 - lat;
      const sinE = Math.sin(elev * S.DEG);
      const top = P.y + 58;
      const gl = P.y + P.h - 80;
      const t = Math.min(P.w * 0.12, (gl - top) * 0.32);
      const bw = 2 * t;                                  // beam width, perpendicular to the rays
      const L = bw / sinE;                               // lit ground length
      const Lmax = bw / Math.sin(20 * S.DEG);
      const x0 = P.x + Math.max(8, (P.w - Lmax) / 2);
      return { P, lat, elev, sinE, top, gl, t, bw, L, x0, dx: -Math.cos(elev * S.DEG), dy: -sinE };
    }

    setLat(lat) { this.latB = lat; this.patchPackets[1] = []; }

    update(dt) {
      this.spawnAcc += dt * PACKETS_PER_SEC;
      while (this.spawnAcc >= 1) {
        this.spawnAcc -= 1;
        for (let i = 0; i < 2; i++) {
          const yc = this.beamY(i), hb = this.Rg * BEAM_HALF;
          this.globePackets[i].push({ x: this.beamX0 + 30, y: yc + (Math.random() * 2 - 1) * hb * 0.85 });
          this.patchPackets[i].push({ u: 0.06 + Math.random() * 0.88, s: 0 });
        }
      }
      const speedG = Math.max(120, this.Rg * 1.6);
      for (let i = 0; i < 2; i++) {
        this.globePackets[i] = this.globePackets[i].filter(p => {
          p.x += speedG * dt;
          const sx = this.surfaceX(p.y);
          if (p.x >= sx) { this.flashes.push({ x: sx, y: p.y, age: 0 }); return false; }
          return true;
        });
        const g = this.patchGeom(i);
        const len = (g.gl - g.top) / g.sinE;
        const speedP = Math.max(110, len * 0.9);
        this.patchPackets[i] = this.patchPackets[i].filter(p => {
          p.s += speedP * dt / len;
          if (p.s >= 1) {
            this.flashes.push({ x: g.x0 + p.u * g.L, y: g.gl, age: 0, onPatch: i + 1 });
            return false;
          }
          return true;
        });
      }
      this.flashes = this.flashes.filter(f => { f.age += dt; return f.age < 0.45; });
    }

    // ============ DRAW: globe panel ============
    drawGlobe(ctx) {
      const G = this.G, gx = this.gx, gy = this.gy, R = this.Rg;

      S.label(ctx, T('sideView'), G.x + 14, G.y + 22, { size: 16 });

      // faint background rays
      ctx.save();
      ctx.strokeStyle = S.rgba(C.mustard, 0.45);
      ctx.fillStyle = S.rgba(C.mustard, 0.45);
      ctx.lineWidth = 1.5;
      const step = Math.max(16, R * 0.2);
      for (let y = gy - R * 1.2; y <= gy + R * 1.2 + 0.1; y += step) {
        const xEnd = Math.abs(y - gy) < R ? this.surfaceX(y) - 3 : G.x + G.w - 10;
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
      ctx.fillStyle = globeGradient(ctx, gy, R);
      ctx.fillRect(gx - R, gy - R, 2 * R, 2 * R);
      // night side
      ctx.fillStyle = S.rgba(C.ink, 0.42);
      ctx.fillRect(gx, gy - R, R, 2 * R);
      // latitude lines
      ctx.strokeStyle = S.rgba(C.ink, 0.45);
      ctx.lineWidth = 1.3;
      ctx.setLineDash([2, 5]);
      [0, 30, 60].forEach(lat => {
        [1, -1].forEach(h => {
          if (lat === 0 && h < 0) return;
          const yy = gy - h * R * Math.sin(lat * S.DEG), half = R * Math.cos(lat * S.DEG);
          ctx.beginPath(); ctx.moveTo(gx - half, yy); ctx.lineTo(gx + half, yy); ctx.stroke();
        });
      });
      ctx.setLineDash([]);
      ctx.restore();
      ctx.beginPath(); ctx.arc(gx, gy, R, 0, Math.PI * 2);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5; ctx.stroke();

      // latitude labels on the night side
      const fs = R > 120 ? 14 : 13;
      const night = { size: fs, align: 'right', color: C.paper, halo: true, haloColor: 'rgba(0,0,0,0.55)', haloWidth: 3 };
      S.label(ctx, T('equator'), gx + R - 8, gy + 10, night);
      S.label(ctx, T('lat30'), gx + R * Math.cos(30 * S.DEG) - 8, gy - R * Math.sin(30 * S.DEG) + 10, night);
      S.label(ctx, T('lat60'), gx + R * Math.cos(60 * S.DEG) - 6, gy - R * Math.sin(60 * S.DEG) + 10, night);
      S.label(ctx, T('northPole'), gx, gy - R - 16, { size: 14, align: 'center' });
      S.label(ctx, T('southPole'), gx, gy + R + 16, { size: 14, align: 'center' });

      // the two beams
      for (let i = 0; i < 2; i++) this.drawGlobeBeam(ctx, i);

      // packets
      for (let j = 0; j < 2; j++) {
        this.globePackets[j].forEach(p => {
          ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = C.yellow; ctx.fill();
          ctx.lineWidth = 1.2; ctx.strokeStyle = C.ink; ctx.stroke();
        });
      }

      this.drawBeamTag(ctx, 0);
      this.drawBeamTag(ctx, 1);

      // flashes where packets hit the globe
      const gx0 = this.G.x + this.G.w;
      this.flashes.forEach(f => {
        if (f.x > gx0 || f.y === undefined || f.onPatch) return;
        const k = f.age / 0.45;
        ctx.beginPath(); ctx.arc(f.x, f.y, 2 + k * 7, 0, Math.PI * 2);
        ctx.strokeStyle = S.rgba(C.red, (1 - k)); ctx.lineWidth = 1.5; ctx.stroke();
      });

      // sun
      ctx.beginPath(); ctx.arc(this.sx, this.sy, this.sunR * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = S.rgba(C.yellow, 0.35); ctx.fill();
      ctx.beginPath(); ctx.arc(this.sx, this.sy, this.sunR, 0, Math.PI * 2);
      ctx.fillStyle = C.yellow; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink; ctx.stroke();
      S.label(ctx, T('sun'), this.sx - this.sunR + 2, this.sy + this.sunR * 1.6 + 14, { size: 14 });
    }

    drawGlobeBeam(ctx, i) {
      const col = i === 0 ? COL_A : COL_B;
      const yc = this.beamY(i), hb = this.Rg * BEAM_HALF;
      const y1 = yc - hb, y2 = yc + hb, N = 14;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.beamX0, y1);
      for (let k = 0; k <= N; k++) { const yy = y1 + (y2 - y1) * k / N; ctx.lineTo(this.surfaceX(yy), yy); }
      ctx.lineTo(this.beamX0, y2);
      ctx.closePath();
      ctx.fillStyle = S.rgba(C.yellow, 0.55);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = col;
      ctx.stroke();
      // lit stretch of surface
      ctx.beginPath();
      for (let k = 0; k <= N; k++) {
        const yy = y1 + (y2 - y1) * k / N;
        if (k === 0) ctx.moveTo(this.surfaceX(yy), yy); else ctx.lineTo(this.surfaceX(yy), yy);
      }
      ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.stroke();
      ctx.restore();
    }

    drawBeamTag(ctx, i) {
      const col = i === 0 ? COL_A : COL_B, yc = this.beamY(i);
      const tag = i === 0 ? T('tagA') : T('tagB');
      const tx = this.beamX0 + 16, r = 11;
      ctx.beginPath(); ctx.arc(tx, yc, r, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
      S.label(ctx, tag, tx, yc + 1, { size: 14, align: 'center', color: C.paper, halo: false });
    }

    // ============ DRAW: close-up panels ============
    drawPatch(ctx, i) {
      const g = this.patchGeom(i), P = g.P, col = i === 0 ? COL_A : COL_B;

      // frame
      ctx.fillStyle = C.closeUp;
      ctx.fillRect(P.x, P.y, P.w, P.h);
      ctx.lineWidth = 3; ctx.strokeStyle = col;
      ctx.strokeRect(P.x + 1.5, P.y + 1.5, P.w - 3, P.h - 3);

      const title = i === 0 ? T('patchA') : window.t('sun.canvas.patchB', g.lat);
      S.label(ctx, title, P.x + 12, P.y + 20, { size: 16, color: col });
      S.label(ctx, window.t('sun.canvas.elevation', Math.round(g.elev)), P.x + 12, P.y + 42, { size: 14, weight: 700 });

      // beam (clipped to the sky area of the panel)
      const far = (g.gl - g.top) / g.sinE + 40;
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
      const len = (g.gl - g.top) / g.sinE;
      this.patchPackets[i].forEach(p => {
        const gxp = g.x0 + p.u * g.L;
        const d = (1 - p.s) * len;
        const x = gxp + g.dx * d, y = g.gl + g.dy * d;
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = C.yellow; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = C.ink; ctx.stroke();
      });
      ctx.restore();

      // ground tiles, each shaded by how much light it receives
      const tileH = 16;
      ctx.fillStyle = C.ground;
      ctx.fillRect(P.x + 3, g.gl, P.w - 6, tileH);
      for (let j = -1; ; j++) {
        const x = g.x0 + j * g.t;
        if (x > P.x + P.w - 4) break;
        const a = Math.max(x, g.x0), b = Math.min(x + g.t, g.x0 + g.L);
        const share = Math.max(0, b - a) / g.L;           // fraction of the beam on this tile
        const e = share * 2;                               // 1.0 == an equator tile
        const xa = Math.max(x, P.x + 3), xb = Math.min(x + g.t, P.x + P.w - 3);
        if (xb <= xa) continue;
        ctx.fillStyle = e > 0.001 ? (e > 0.5 ? S.mix(C.yellow, C.red, (e - 0.5) * 2) : S.mix(C.ground, C.yellow, e * 2)) : C.ground;
        ctx.fillRect(xa, g.gl, xb - xa, tileH);
        ctx.lineWidth = 1.5; ctx.strokeStyle = C.ink;
        ctx.strokeRect(xa, g.gl, xb - xa, tileH);
      }

      // flashes where packets land
      this.flashes.forEach(f => {
        if (f.onPatch !== i + 1) return;
        const k = f.age / 0.45;
        ctx.beginPath(); ctx.arc(f.x, f.y, 3 + k * 9, 0, Math.PI * 2);
        ctx.strokeStyle = S.rgba(C.red, (1 - k)); ctx.lineWidth = 2; ctx.stroke();
      });

      // bracket over the lit stretch
      const by = g.gl + tileH + 8;
      ctx.beginPath();
      ctx.moveTo(g.x0, by - 4); ctx.lineTo(g.x0, by); ctx.lineTo(g.x0 + g.L, by); ctx.lineTo(g.x0 + g.L, by - 4);
      ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();

      const tiles = g.L / g.t;
      const pct = Math.round(g.sinE * 100);
      S.label(ctx, window.t('sun.canvas.area', num(tiles, 1)), P.x + 12, by + 16, { size: 14, weight: 700 });
      S.label(ctx, window.t('sun.canvas.perTile', pct), P.x + 12, by + 38, { size: 16, color: col });
    }

    draw(ctx) {
      ctx.fillStyle = C.sky;
      ctx.fillRect(0, 0, this.W, this.H);
      this.drawGlobe(ctx);
      this.drawPatch(ctx, 0);
      this.drawPatch(ctx, 1);
      if (!this.wide) {
        S.label(ctx, T('closeUp'), this.W / 2, this.G.h - 10, { size: 14, align: 'center' });
      }
    }
  }

  // ============ WIRING ============
  S.initSunSim = () => {
    const sim = new SunSim();
    const frame = document.getElementById('sun-frame');
    const zs = new S.ZoomStage(frame, sim);
    const slider = document.getElementById('lat-slider');
    const valEl = document.getElementById('lat-value');
    const resEl = document.getElementById('sun-result');
    const badge = SCAPE.badge(frame);
    const tasks = SCAPE.tasks(document.getElementById('sun-tasks'));
    const visited = { sahara: false, nordkap: false };

    const refresh = () => {
      const lat = +slider.value;
      sim.setLat(lat);
      const elev = 90 - lat, f = Math.sin(elev * S.DEG);
      valEl.textContent = window.t('sun.latValue', lat);
      resEl.innerHTML = window.t('sun.result', lat, elev, num(1 / f, 1), Math.round(f * 100));
      document.querySelectorAll('#sun-presets button').forEach(b => {
        b.setAttribute('aria-pressed', String(+b.dataset.lat === lat));
      });
    };
    // tasks: half the energy per tile (60°: sin 30° = 0.5); Sahara and Nordkap visited
    const checkTasks = () => {
      const lat = +slider.value;
      if (lat === 60) tasks.done('half');
      if (lat <= 25) visited.sahara = true;
      if (lat >= 69) visited.nordkap = true;
      if (visited.sahara && visited.nordkap) tasks.done('trip');
    };
    const act = () => { badge.hide(); refresh(); checkTasks(); };

    slider.addEventListener('input', act);
    document.querySelectorAll('#sun-presets button').forEach(b => {
      b.addEventListener('click', () => { slider.value = b.dataset.lat; act(); });
    });
    refresh();
    badge.show(window.t('sun.badge'));
    return zs;
  };
})();

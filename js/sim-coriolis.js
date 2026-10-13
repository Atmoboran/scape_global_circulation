// Simulation 2 — what the Coriolis force does.
//
// Scenario "Karussell": a ball is thrown from the centre of a turning merry-go-round towards a
// friend standing at the rim. Left: seen from above (from space) the ball flies dead straight
// while the disc turns away underneath it. Right: the same throw as seen by someone riding the
// disc; for them the ball bends off to the right (anticlockwise disc). That apparent sideways
// push is the Coriolis force.
//
// Scenario "Erde": the Earth seen from above the North Pole is exactly such a disc. Air starting
// at 30° N is sent towards the equator (or towards the pole). Left: an Earth that does not turn,
// the air goes straight. Right: the real, turning Earth; the air is deflected to the right
// (west for equatorward air -> north-east trade wind, east for poleward air -> westerlies).
// Here the deflection is integrated with the Coriolis parameter f = 2*omega*sin(latitude),
// so it is strongest near the pole and vanishes at the equator.
(() => {
  'use strict';
  const S = window.SCAPE, C = S.COLORS;
  const T = (key, ...a) => window.t('cor.' + key, ...a);

  const BALL_SPEED = 1 / 2.4;     // disc radii per second (carousel)
  const AIR_SPEED = 0.18;         // disc radii per second (earth)
  // path length after which the air parcel stops (long enough to reach the target when
  // undeflected, short enough that strong deflection never turns into a full loop)
  const AIR_PATH = { aequator: 0.5, pol: 0.33 };
  const R0_EARTH = 2 / 3;         // 30° latitude on the polar map (r = (90 - lat) / 90)

  const rot = (p, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
  };

  class CoriolisSim {
    constructor() {
      this.mode = 'karussell';
      this.dir = 1;               // +1 anticlockwise (northern hemisphere), -1 clockwise
      this.level = 5;
      this.earthDir = 'aequator';
      this.theta = 0;
      this.shot = null;
      this.onResult = null;
    }

    side() { return this.dir > 0 ? window.t('common.sideRight') : window.t('common.sideLeft'); }

    omega() {
      return this.mode === 'karussell' ? this.level * 0.07 : this.level * 0.12;
    }

    heightFor(W) {
      return W >= 620 ? Math.max(430, W * 0.56) : W * 2.25;
    }

    layout(ctx, W, H) {
      this.W = W; this.H = H; this.ctx = ctx;
      const pad = 12;
      this.wide = W >= 620 && W / H > 1.3;
      if (this.wide) {
        const w = (W - 3 * pad) / 2;
        this.panels = [{ x: pad, y: pad, w, h: H - 2 * pad }, { x: 2 * pad + w, y: pad, w, h: H - 2 * pad }];
      } else {
        const h = (H - 3 * pad) / 2;
        this.panels = [{ x: pad, y: pad, w: W - 2 * pad, h }, { x: pad, y: 2 * pad + h, w: W - 2 * pad, h }];
      }
      this.panels.forEach(P => {
        P.headH = this.wide ? 80 : 100;
        P.Rd = Math.max(50, Math.min(P.w / 2 - 44, (P.h - P.headH - 64) / 2));
        P.cx = P.x + P.w / 2;
        P.cy = P.y + P.headH + 30 + P.Rd + Math.max(0, (P.h - P.headH - 64 - 2 * P.Rd) / 2);
      });
    }

    // ============ THROW ============
    throwNow(byVisitor = true) {
      if (this.mode === 'karussell') {
        this.shot = { t: 0, theta0: this.theta, done: false, trailIn: [{ x: 0, y: 0 }], trailRot: [{ x: 0, y: 0 }], acc: 0 };
      } else {
        const sgn = this.earthDir === 'aequator' ? 1 : -1;
        const mk = () => ({ x: 0, y: R0_EARTH, vx: 0, vy: sgn * AIR_SPEED, path: 0, trail: [{ x: 0, y: R0_EARTH }], done: false });
        this.shot = { t: 0, done: false, straight: mk(), turning: mk(), acc: 0 };
      }
      // what this throw was set up with (the tasks look at it once it lands)
      this.shot.setup = { byVisitor, mode: this.mode, level: this.level, dir: this.dir, earthDir: this.earthDir };
      if (this.onResult) this.onResult(null);
    }

    stepAir(a, f, dt) {
      if (a.done) return;
      const n = 6, h = dt / n;
      for (let i = 0; i < n; i++) {
        let r = Math.hypot(a.x, a.y);
        const lat = S.clamp(90 * (1 - r), 0, 90);
        const ff = f * Math.sin(lat * S.DEG);
        const ax = ff * a.vy, ay = -ff * a.vx;   // rotates velocity clockwise for ff > 0 (to the right)
        a.vx += ax * h; a.vy += ay * h;
        const sp = Math.hypot(a.vx, a.vy);      // Coriolis does no work: keep the speed exact
        a.vx *= AIR_SPEED / sp; a.vy *= AIR_SPEED / sp;
        a.x += a.vx * h; a.y += a.vy * h;
        a.path += AIR_SPEED * h;
        r = Math.hypot(a.x, a.y);
        const reached = this.earthDir === 'aequator' ? r >= 1 : r <= 1 / 3;
        if (reached || a.path >= AIR_PATH[this.earthDir] || r >= 1) { a.done = true; break; }
      }
    }

    update(dt) {
      const w = this.omega();
      this.theta += this.dir * w * dt;
      const s = this.shot;
      if (!s || s.done) return;
      s.t += dt;
      s.acc += dt;
      if (this.mode === 'karussell') {
        const a0 = Math.PI / 2 + s.theta0;
        const d = Math.min(1, BALL_SPEED * s.t);
        const p = { x: d * Math.cos(a0), y: d * Math.sin(a0) };
        s.pIn = p;
        s.pRot = rot(p, -(this.theta));
        if (s.acc > 0.05 || d >= 1) {
          s.acc = 0;
          s.trailIn.push(p);
          s.trailRot.push(s.pRot);
        }
        if (d >= 1) { s.done = true; this.report(); }
      } else {
        this.stepAir(s.straight, 0, dt);
        this.stepAir(s.turning, 2 * this.dir * w, dt);
        if (s.acc > 0.05 || s.turning.done) {
          s.acc = 0;
          [s.straight, s.turning].forEach(a => { a.trail.push({ x: a.x, y: a.y }); });
        }
        if (s.straight.done && s.turning.done) { s.done = true; this.report(); }
      }
    }

    report() {
      if (this.onLanded) this.onLanded(this.shot.setup);
      if (!this.onResult) return;
      const side = this.side();
      let msg;
      if (this.level === 0) {
        msg = this.mode === 'karussell' ? T('result.hit') : T('result.still');
      } else if (this.mode === 'karussell') {
        msg = T('result.miss', side);
      } else {
        const nh = this.dir > 0;
        msg = this.earthDir === 'aequator' ? T('result.toEquator', side, nh) : T('result.toPole', side, nh);
      }
      this.onResult(msg);
    }

    // ============ DRAW ============
    toScreen(P, p) {
      return { x: P.cx + p.x * P.Rd, y: P.cy - p.y * P.Rd };
    }

    drawHeader(ctx, P, title, sub) {
      S.label(ctx, title, P.x + 12, P.y + 20, { size: 17 });
      const lines = S.wrap(ctx, sub, P.w - 24, 15, 600);
      for (let i = 0; i < Math.min(P.headH > 90 ? 3 : 2, lines.length); i++) {
        S.label(ctx, lines[i], P.x + 12, P.y + 44 + i * 20, { size: 15, weight: 600, halo: false });
      }
    }

    drawRotationArrows(ctx, P, angle) {
      // two curved arrows just outside the rim, showing the sense of rotation
      const r = P.Rd + 12, dir = this.dir;
      ctx.save();
      ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineWidth = 2.5;
      [-0.6, Math.PI - 0.6].forEach(base => {
        const a1 = base + angle - 0.35, a2 = base + angle + 0.35;
        // math angles (y up) -> canvas angles (y down) are negated
        ctx.beginPath();
        ctx.arc(P.cx, P.cy, r, -a1, -a2, true);
        ctx.stroke();
        const end = dir > 0 ? a2 : a1;
        const ex = P.cx + r * Math.cos(end), ey = P.cy - r * Math.sin(end);
        const tangent = dir > 0 ? -end - Math.PI / 2 : -end + Math.PI / 2;
        S.arrowHead(ctx, ex + 3 * Math.cos(tangent), ey + 3 * Math.sin(tangent), tangent, 10);
        ctx.fill();
      });
      ctx.restore();
    }

    drawCarousel(ctx, P, angle) {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a1 = angle + i * 2 * Math.PI / n, a2 = a1 + 2 * Math.PI / n;
        ctx.beginPath();
        ctx.moveTo(P.cx, P.cy);
        ctx.arc(P.cx, P.cy, P.Rd, -a1, -a2, true);
        ctx.closePath();
        ctx.fillStyle = i % 2 ? C.pastelYellow : C.cream;
        ctx.fill();
      }
      ctx.beginPath(); ctx.arc(P.cx, P.cy, P.Rd, 0, Math.PI * 2);
      ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();

      // aim line from centre to the friend (fixed on the disc)
      const fa = Math.PI / 2 + angle;
      const f = this.toScreen(P, { x: 0.92 * Math.cos(fa), y: 0.92 * Math.sin(fa) });
      ctx.save();
      ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = S.rgba(C.ink, 0.55);
      ctx.beginPath(); ctx.moveTo(P.cx, P.cy); ctx.lineTo(f.x, f.y); ctx.stroke();
      ctx.restore();

      // friend
      ctx.beginPath(); ctx.arc(f.x, f.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = C.purple; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
      const fl = this.toScreen(P, { x: 0.62 * Math.cos(fa + 0.28), y: 0.62 * Math.sin(fa + 0.28) });
      S.label(ctx, T('canvas.friend'), fl.x, fl.y, { size: 14, align: 'center', color: C.purple });

      // thrower in the middle
      ctx.beginPath(); ctx.arc(P.cx, P.cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = C.ink; ctx.fill();
      S.label(ctx, T('canvas.you'), P.cx, P.cy + 1, { size: 13, align: 'center', color: C.paper, halo: false });
    }

    drawEarth(ctx, P, showRotation) {
      const nh = this.dir > 0;
      ctx.beginPath(); ctx.arc(P.cx, P.cy, P.Rd, 0, Math.PI * 2);
      ctx.fillStyle = C.pastelBlue; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();

      ctx.save();
      ctx.setLineDash([3, 6]); ctx.lineWidth = 1.6; ctx.strokeStyle = S.rgba(C.ink, 0.55);
      [1 / 3, 2 / 3].forEach(r => { ctx.beginPath(); ctx.arc(P.cx, P.cy, r * P.Rd, 0, Math.PI * 2); ctx.stroke(); });
      ctx.restore();

      // ring labels on the left, away from the air paths at the top and the pole label
      S.label(ctx, T('canvas.lat60'), P.cx - P.Rd / 3, P.cy, { size: 13, align: 'center', box: true });
      S.label(ctx, T('canvas.lat30'), P.cx - 2 * P.Rd / 3, P.cy, { size: 13, align: 'center', box: true });

      ctx.beginPath(); ctx.arc(P.cx, P.cy, 4, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
      S.label(ctx, nh ? T('canvas.northPole') : T('canvas.southPole'), P.cx, P.cy + 22, { size: 14, align: 'center' });
      S.label(ctx, T('canvas.equatorRim'), P.cx, P.cy + P.Rd + 18, { size: 14, align: 'center' });

      // compass hint at the top: in an anticlockwise-turning view east is to the left at 12 o'clock
      const y = P.cy - P.Rd - 16, dx = P.Rd * 0.62;
      S.label(ctx, nh ? T('canvas.eastLeft') : T('canvas.westLeft'), P.cx - dx, y, { size: 14, align: 'center' });
      S.label(ctx, nh ? T('canvas.westRight') : T('canvas.eastRight'), P.cx + dx, y, { size: 14, align: 'center' });

      if (showRotation) this.drawRotationArrows(ctx, P, 0);

      // start point and the planned straight path
      const st = this.toScreen(P, { x: 0, y: R0_EARTH });
      const endR = this.earthDir === 'aequator' ? 1 : 1 / 3 + 0.02;
      const en = this.toScreen(P, { x: 0, y: endR });
      ctx.save();
      ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = S.rgba(C.ink, 0.5);
      ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(en.x, en.y); ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(st.x, st.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
    }

    drawTrail(ctx, P, trail, head, col) {
      if (!trail || !trail.length) return;
      ctx.save();
      ctx.lineWidth = 3.5; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      trail.forEach((p, i) => { const s = this.toScreen(P, p); if (i) ctx.lineTo(s.x, s.y); else ctx.moveTo(s.x, s.y); });
      if (head) { const hs = this.toScreen(P, head); ctx.lineTo(hs.x, hs.y); }
      ctx.stroke();
      ctx.restore();
      const h = this.toScreen(P, head || trail[trail.length - 1]);
      ctx.beginPath(); ctx.arc(h.x, h.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
    }

    draw(ctx) {
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, this.W, this.H);
      const [P0, P1] = this.panels, s = this.shot;
      const side = this.side();

      this.panels.forEach((P, i) => {
        ctx.fillStyle = i === 0 ? C.panelA : C.panelB;
        ctx.fillRect(P.x, P.y, P.w, P.h);
        ctx.lineWidth = 2; ctx.strokeStyle = C.ink;
        ctx.strokeRect(P.x, P.y, P.w, P.h);
      });

      if (this.mode === 'karussell') {
        this.drawHeader(ctx, P0, T('canvas.carouselTop'), T('canvas.carouselTopSub'));
        this.drawHeader(ctx, P1, T('canvas.carouselRide'), T('canvas.carouselRideSub', side));
        this.drawCarousel(ctx, P0, this.theta);
        this.drawRotationArrows(ctx, P0, this.theta);
        this.drawCarousel(ctx, P1, 0);
        if (s && s.trailIn) {
          this.drawTrail(ctx, P0, s.trailIn, s.done ? null : s.pIn, C.red);
          this.drawTrail(ctx, P1, s.trailRot, s.done ? null : s.pRot, C.red);
        }
      } else {
        this.drawHeader(ctx, P0, T('canvas.earthStill'), T('canvas.earthStillSub'));
        this.drawHeader(ctx, P1, T('canvas.earthTurn'), T('canvas.earthTurnSub', side));
        this.drawEarth(ctx, P0, false);
        this.drawEarth(ctx, P1, this.level > 0);
        if (s && s.straight) {
          this.drawTrail(ctx, P0, s.straight.trail, s.straight.done ? null : s.straight, C.cyan);
          this.drawTrail(ctx, P1, s.turning.trail, s.turning.done ? null : s.turning, C.cyan);
        }
      }
    }
  }

  // ============ WIRING ============
  S.initCoriolisSim = () => {
    const sim = new CoriolisSim();
    const frame = document.getElementById('cor-frame');
    const zs = new S.ZoomStage(frame, sim);
    const throwBtn = document.getElementById('cor-throw');
    const throwLabel = document.getElementById('cor-throw-label');
    const speed = document.getElementById('cor-speed');
    const speedVal = document.getElementById('cor-speed-value');
    const earthRow = document.getElementById('cor-earthdir-row');
    const dirLabel = document.getElementById('cor-dir-label');
    const resEl = document.getElementById('cor-result');
    const badge = SCAPE.badge(frame);
    const tasks = SCAPE.tasks(document.getElementById('cor-tasks'));

    const setResult = msg => {
      resEl.innerHTML = msg || (sim.mode === 'karussell' ? T('result.flyingBall') : T('result.flyingAir'));
    };
    sim.onResult = setResult;
    // tasks: a miss on a turning carousel, a hit without rotation, air sent to the equator on a turning Earth
    sim.onLanded = st => {
      if (!st.byVisitor) return;
      if (st.mode === 'karussell' && st.level > 0) tasks.done('miss');
      if (st.mode === 'karussell' && st.level === 0) tasks.done('still');
      if (st.mode === 'erde' && st.level > 0 && st.earthDir === 'aequator') tasks.done('earth');
    };

    const refreshSpeed = () => {
      sim.level = +speed.value;
      const w = sim.omega();
      const word = sim.level === 0 ? T('speedNone') : (sim.level <= 3 ? T('speedSlow') : (sim.level <= 7 ? T('speedMid') : T('speedFast')));
      speedVal.textContent = word + (w > 0 ? T('speedPeriod', Math.round(2 * Math.PI / w)) : '');
    };
    const refreshMode = () => {
      const k = sim.mode === 'karussell';
      throwLabel.textContent = k ? T('throwBall') : T('throwAir');
      earthRow.hidden = k;
      dirLabel.textContent = k ? T('dirLabel') : T('hemiLabel');
      document.querySelector('#cor-hemi [data-value="1"]').textContent = k ? T('ccw') : T('north');
      document.querySelector('#cor-hemi [data-value="-1"]').textContent = k ? T('cw') : T('south');
      refreshSpeed();
    };

    S.segmented(document.getElementById('cor-mode'), v => { sim.mode = v; refreshMode(); sim.throwNow(); });
    S.segmented(document.getElementById('cor-hemi'), v => { sim.dir = +v; sim.throwNow(); });
    S.segmented(document.getElementById('cor-earthdir'), v => { sim.earthDir = v; sim.throwNow(); });
    speed.addEventListener('input', refreshSpeed);
    speed.addEventListener('change', () => { sim.throwNow(); });
    throwBtn.addEventListener('click', () => { badge.hide(); sim.throwNow(); });

    refreshMode();
    resEl.innerHTML = T('result.start');
    badge.show(T('badge'));
    zs.onFirstShow = () => { sim.throwNow(false); };
    return zs;
  };
})();

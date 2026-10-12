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
(function () {
  'use strict';
  var S = window.SCAPE, C = S.COLORS;

  var BALL_SPEED = 1 / 2.4;       // disc radii per second (carousel)
  var AIR_SPEED = 0.18;           // disc radii per second (earth)
  // path length after which the air parcel stops (long enough to reach the target when
  // undeflected, short enough that strong deflection never turns into a full loop)
  var AIR_PATH = { aequator: 0.5, pol: 0.33 };
  var R0_EARTH = 2 / 3;           // 30° latitude on the polar map (r = (90 - lat) / 90)

  function CoriolisSim() {
    this.mode = 'karussell';
    this.dir = 1;                 // +1 anticlockwise (northern hemisphere), -1 clockwise
    this.level = 5;
    this.earthDir = 'aequator';
    this.theta = 0;
    this.shot = null;
    this.onResult = null;
  }

  CoriolisSim.prototype.omega = function () {
    return this.mode === 'karussell' ? this.level * 0.07 : this.level * 0.12;
  };

  CoriolisSim.prototype.heightFor = function (W) {
    return W >= 620 ? Math.max(430, W * 0.56) : W * 2.25;
  };

  CoriolisSim.prototype.layout = function (ctx, W, H) {
    this.W = W; this.H = H; this.ctx = ctx;
    var pad = 12;
    this.wide = W >= 620 && W / H > 1.3;
    if (this.wide) {
      var w = (W - 3 * pad) / 2;
      this.panels = [{ x: pad, y: pad, w: w, h: H - 2 * pad }, { x: 2 * pad + w, y: pad, w: w, h: H - 2 * pad }];
    } else {
      var h = (H - 3 * pad) / 2;
      this.panels = [{ x: pad, y: pad, w: W - 2 * pad, h: h }, { x: pad, y: 2 * pad + h, w: W - 2 * pad, h: h }];
    }
    var self = this;
    this.panels.forEach(function (P) {
      P.headH = self.wide ? 80 : 100;
      P.Rd = Math.max(50, Math.min(P.w / 2 - 44, (P.h - P.headH - 64) / 2));
      P.cx = P.x + P.w / 2;
      P.cy = P.y + P.headH + 30 + P.Rd + Math.max(0, (P.h - P.headH - 64 - 2 * P.Rd) / 2);
      P.ctxRef = self;
    });
  };

  // ============ THROW ============
  CoriolisSim.prototype.throwNow = function () {
    if (this.mode === 'karussell') {
      this.shot = { t: 0, theta0: this.theta, done: false, trailIn: [{ x: 0, y: 0 }], trailRot: [{ x: 0, y: 0 }], acc: 0 };
    } else {
      var sgn = this.earthDir === 'aequator' ? 1 : -1;
      var mk = function () { return { x: 0, y: R0_EARTH, vx: 0, vy: sgn * AIR_SPEED, path: 0, trail: [{ x: 0, y: R0_EARTH }], done: false }; };
      this.shot = { t: 0, done: false, straight: mk(), turning: mk(), acc: 0 };
    }
    if (this.onResult) this.onResult(null);
  };

  function rot(p, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
  }

  CoriolisSim.prototype.stepAir = function (a, f, dt) {
    if (a.done) return;
    var n = 6, h = dt / n;
    for (var i = 0; i < n; i++) {
      var r = Math.hypot(a.x, a.y);
      var lat = S.clamp(90 * (1 - r), 0, 90);
      var ff = f * Math.sin(lat * S.DEG);
      var ax = ff * a.vy, ay = -ff * a.vx;     // rotates velocity clockwise for ff > 0 (to the right)
      a.vx += ax * h; a.vy += ay * h;
      var sp = Math.hypot(a.vx, a.vy);        // Coriolis does no work: keep the speed exact
      a.vx *= AIR_SPEED / sp; a.vy *= AIR_SPEED / sp;
      a.x += a.vx * h; a.y += a.vy * h;
      a.path += AIR_SPEED * h;
      r = Math.hypot(a.x, a.y);
      var reached = this.earthDir === 'aequator' ? r >= 1 : r <= 1 / 3;
      if (reached || a.path >= AIR_PATH[this.earthDir] || r >= 1) { a.done = true; break; }
    }
  };

  CoriolisSim.prototype.update = function (dt) {
    var w = this.omega();
    this.theta += this.dir * w * dt;
    var s = this.shot;
    if (!s || s.done) return;
    s.t += dt;
    s.acc += dt;
    if (this.mode === 'karussell') {
      var a0 = Math.PI / 2 + s.theta0;
      var d = Math.min(1, BALL_SPEED * s.t);
      var p = { x: d * Math.cos(a0), y: d * Math.sin(a0) };
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
        [s.straight, s.turning].forEach(function (a) { a.trail.push({ x: a.x, y: a.y }); });
      }
      if (s.straight.done && s.turning.done) { s.done = true; this.report(); }
    }
  };

  CoriolisSim.prototype.report = function () {
    if (!this.onResult) return;
    var side = this.dir > 0 ? 'rechts' : 'links';
    var msg;
    if (this.level === 0) {
      msg = this.mode === 'karussell'
        ? '<b>Treffer!</b> Ohne Drehung fliegt der Ball in beiden Ansichten einfach geradeaus. Stell die Drehgeschwindigkeit hoch und wirf noch einmal.'
        : '<b>Keine Ablenkung.</b> Ohne Erddrehung strömt die Luft auf beiden Bildern geradeaus. Stell die Drehgeschwindigkeit hoch.';
    } else if (this.mode === 'karussell') {
      msg = '<b>Daneben!</b> Von außen gesehen (oben/links) fliegt der Ball <b>geradeaus</b>. Aber während er fliegt, dreht sich das Karussell weiter. ' +
        'Für dich auf dem Karussell sieht es so aus, als würde der Ball nach <b>' + side + '</b> abbiegen. Diese scheinbare Kraft heißt <b>Corioliskraft</b>.';
    } else {
      var nh = this.dir > 0;
      if (this.earthDir === 'aequator') {
        msg = 'Die Luft strömt Richtung Äquator und wird nach <b>' + side + '</b> abgelenkt – also nach <b>Westen</b>. ' +
          'Sie kommt dadurch aus <b>' + (nh ? 'Nordosten' : 'Südosten') + '</b>: Das ist der <b>' + (nh ? 'Nordost' : 'Südost') + '-Passat</b>.';
      } else {
        msg = 'Die Luft strömt Richtung Pol und wird nach <b>' + side + '</b> abgelenkt – also nach <b>Osten</b>. ' +
          'Sie kommt dadurch aus <b>' + (nh ? 'Südwesten' : 'Nordwesten') + '</b>: Das sind die <b>Westwinde</b>' + (nh ? ', die auch unser Wetter in Deutschland bringen.' : '.');
      }
    }
    this.onResult(msg);
  };

  // ============ DRAW ============
  CoriolisSim.prototype.toScreen = function (P, p) {
    return { x: P.cx + p.x * P.Rd, y: P.cy - p.y * P.Rd };
  };

  CoriolisSim.prototype.drawHeader = function (ctx, P, title, sub) {
    S.label(ctx, title, P.x + 12, P.y + 20, { size: 17 });
    var lines = S.wrap(ctx, sub, P.w - 24, 15, 600);
    for (var i = 0; i < Math.min(P.headH > 90 ? 3 : 2, lines.length); i++) {
      S.label(ctx, lines[i], P.x + 12, P.y + 44 + i * 20, { size: 15, weight: 600, halo: false });
    }
  };

  CoriolisSim.prototype.drawRotationArrows = function (ctx, P, angle) {
    // two curved arrows just outside the rim, showing the sense of rotation
    var r = P.Rd + 12, dir = this.dir;
    ctx.save();
    ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineWidth = 2.5;
    [-0.6, Math.PI - 0.6].forEach(function (base) {
      var a1 = base + angle - 0.35, a2 = base + angle + 0.35;
      // math angles (y up) -> canvas angles (y down) are negated
      ctx.beginPath();
      ctx.arc(P.cx, P.cy, r, -a1, -a2, true);
      ctx.stroke();
      var end = dir > 0 ? a2 : a1;
      var ex = P.cx + r * Math.cos(end), ey = P.cy - r * Math.sin(end);
      var tangent = dir > 0 ? -end - Math.PI / 2 : -end + Math.PI / 2;
      S.arrowHead(ctx, ex + 3 * Math.cos(tangent), ey + 3 * Math.sin(tangent), tangent, 10);
      ctx.fill();
    });
    ctx.restore();
  };

  CoriolisSim.prototype.drawCarousel = function (ctx, P, angle) {
    var n = 12;
    for (var i = 0; i < n; i++) {
      var a1 = angle + i * 2 * Math.PI / n, a2 = a1 + 2 * Math.PI / n;
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
    var fa = Math.PI / 2 + angle;
    var f = this.toScreen(P, { x: 0.92 * Math.cos(fa), y: 0.92 * Math.sin(fa) });
    ctx.save();
    ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = S.rgba(C.ink, 0.55);
    ctx.beginPath(); ctx.moveTo(P.cx, P.cy); ctx.lineTo(f.x, f.y); ctx.stroke();
    ctx.restore();

    // friend
    ctx.beginPath(); ctx.arc(f.x, f.y, 13, 0, Math.PI * 2);
    ctx.fillStyle = C.purple; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
    var fl = this.toScreen(P, { x: 0.62 * Math.cos(fa + 0.28), y: 0.62 * Math.sin(fa + 0.28) });
    S.label(ctx, 'Freund', fl.x, fl.y, { size: 14, align: 'center', color: C.purple });

    // thrower in the middle
    ctx.beginPath(); ctx.arc(P.cx, P.cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = C.ink; ctx.fill();
    S.label(ctx, 'Du', P.cx, P.cy + 1, { size: 13, align: 'center', color: C.paper, halo: false });
  };

  CoriolisSim.prototype.drawEarth = function (ctx, P, showRotation) {
    var nh = this.dir > 0;
    ctx.beginPath(); ctx.arc(P.cx, P.cy, P.Rd, 0, Math.PI * 2);
    var g = ctx.createRadialGradient(P.cx, P.cy, 0, P.cx, P.cy, P.Rd);
    g.addColorStop(0, C.paper);
    g.addColorStop(0.35, C.pastelBlue);
    g.addColorStop(1, C.sea);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();

    ctx.save();
    ctx.setLineDash([3, 6]); ctx.lineWidth = 1.6; ctx.strokeStyle = S.rgba(C.ink, 0.55);
    [1 / 3, 2 / 3].forEach(function (r) { ctx.beginPath(); ctx.arc(P.cx, P.cy, r * P.Rd, 0, Math.PI * 2); ctx.stroke(); });
    ctx.restore();

    // ring labels on the left, away from the air paths at the top and the pole label
    S.label(ctx, '60°', P.cx - P.Rd / 3, P.cy, { size: 13, align: 'center', box: true });
    S.label(ctx, '30°', P.cx - 2 * P.Rd / 3, P.cy, { size: 13, align: 'center', box: true });

    ctx.beginPath(); ctx.arc(P.cx, P.cy, 4, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
    S.label(ctx, nh ? 'Nordpol' : 'Südpol', P.cx, P.cy + 22, { size: 14, align: 'center' });
    S.label(ctx, 'Äquator (Rand)', P.cx, P.cy + P.Rd + 18, { size: 14, align: 'center' });

    // compass hint at the top: in an anticlockwise-turning view east is to the left at 12 o'clock
    var y = P.cy - P.Rd - 16, dx = P.Rd * 0.62;
    S.label(ctx, nh ? '← Osten' : '← Westen', P.cx - dx, y, { size: 14, align: 'center' });
    S.label(ctx, nh ? 'Westen →' : 'Osten →', P.cx + dx, y, { size: 14, align: 'center' });

    if (showRotation) this.drawRotationArrows(ctx, P, 0);

    // start point and the planned straight path
    var st = this.toScreen(P, { x: 0, y: R0_EARTH });
    var endR = this.earthDir === 'aequator' ? 1 : 1 / 3 + 0.02;
    var en = this.toScreen(P, { x: 0, y: endR });
    ctx.save();
    ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = S.rgba(C.ink, 0.5);
    ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(en.x, en.y); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(st.x, st.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
  };

  CoriolisSim.prototype.drawTrail = function (ctx, P, trail, head, col) {
    if (!trail || !trail.length) return;
    var self = this;
    ctx.save();
    ctx.lineWidth = 3.5; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    trail.forEach(function (p, i) { var s = self.toScreen(P, p); if (i) ctx.lineTo(s.x, s.y); else ctx.moveTo(s.x, s.y); });
    if (head) { var hs = this.toScreen(P, head); ctx.lineTo(hs.x, hs.y); }
    ctx.stroke();
    ctx.restore();
    var h = this.toScreen(P, head || trail[trail.length - 1]);
    ctx.beginPath(); ctx.arc(h.x, h.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
  };

  CoriolisSim.prototype.draw = function (ctx) {
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, this.W, this.H);
    var P0 = this.panels[0], P1 = this.panels[1], s = this.shot;
    var side = this.dir > 0 ? 'rechts' : 'links';

    this.panels.forEach(function (P, i) {
      ctx.fillStyle = i === 0 ? C.panelA : C.panelB;
      ctx.fillRect(P.x, P.y, P.w, P.h);
      ctx.lineWidth = 2; ctx.strokeStyle = C.ink;
      ctx.strokeRect(P.x, P.y, P.w, P.h);
    });

    if (this.mode === 'karussell') {
      this.drawHeader(ctx, P0, '1  Von oben (aus dem Weltall)', 'Der Ball fliegt geradeaus. Das Karussell dreht sich unter ihm weg.');
      this.drawHeader(ctx, P1, '2  Auf dem Karussell', 'Du drehst dich mit. Für dich sieht es so aus, als biegt der Ball nach ' + side + ' ab.');
      this.drawCarousel(ctx, P0, this.theta);
      this.drawRotationArrows(ctx, P0, this.theta);
      this.drawCarousel(ctx, P1, 0);
      if (s) {
        this.drawTrail(ctx, P0, s.trailIn, s.done ? null : s.pIn, C.red);
        this.drawTrail(ctx, P1, s.trailRot, s.done ? null : s.pRot, C.red);
      }
    } else {
      this.drawHeader(ctx, P0, '1  Ohne Erddrehung', 'Die Luft strömt geradeaus.');
      this.drawHeader(ctx, P1, '2  Mit Erddrehung (echte Erde)', 'Wir drehen uns mit der Erde mit. Die Luft wird nach ' + side + ' abgelenkt.');
      this.drawEarth(ctx, P0, false);
      this.drawEarth(ctx, P1, this.level > 0);
      if (s) {
        this.drawTrail(ctx, P0, s.straight.trail, s.straight.done ? null : s.straight, C.cyan);
        this.drawTrail(ctx, P1, s.turning.trail, s.turning.done ? null : s.turning, C.cyan);
      }
    }
  };

  // ============ WIRING ============
  S.initCoriolisSim = function () {
    var sim = new CoriolisSim();
    var zs = new S.ZoomStage(document.getElementById('cor-card'), sim);
    var throwBtn = document.getElementById('cor-throw');
    var throwLabel = document.getElementById('cor-throw-label');
    var speed = document.getElementById('cor-speed');
    var speedVal = document.getElementById('cor-speed-value');
    var earthRow = document.getElementById('cor-earthdir-row');
    var dirLabel = document.getElementById('cor-dir-label');
    var resEl = document.getElementById('cor-result');

    function setResult(msg) {
      resEl.innerHTML = msg || (sim.mode === 'karussell'
        ? 'Der Ball fliegt … beobachte beide Bilder gleichzeitig!'
        : 'Die Luft strömt … beobachte beide Bilder gleichzeitig!');
    }
    sim.onResult = setResult;

    function refreshSpeed() {
      sim.level = +speed.value;
      var w = sim.omega();
      var word = sim.level === 0 ? 'keine Drehung' : (sim.level <= 3 ? 'langsam' : (sim.level <= 7 ? 'mittel' : 'schnell'));
      speedVal.textContent = word + (w > 0 ? ' (1 Umdrehung in ' + Math.round(2 * Math.PI / w) + ' s)' : '');
    }
    function refreshMode() {
      var k = sim.mode === 'karussell';
      throwLabel.textContent = k ? 'Ball werfen' : 'Luft losschicken';
      earthRow.hidden = k;
      dirLabel.textContent = k ? 'Drehrichtung' : 'Halbkugel';
      document.querySelector('#cor-hemi [data-value="1"]').textContent = k ? 'gegen den Uhrzeigersinn (wie die Nordhalbkugel)' : 'Nordhalbkugel (Blick auf den Nordpol)';
      document.querySelector('#cor-hemi [data-value="-1"]').textContent = k ? 'im Uhrzeigersinn (wie die Südhalbkugel)' : 'Südhalbkugel (Blick auf den Südpol)';
      refreshSpeed();
    }

    S.segmented(document.getElementById('cor-mode'), function (v) { sim.mode = v; refreshMode(); sim.throwNow(); });
    S.segmented(document.getElementById('cor-hemi'), function (v) { sim.dir = +v; sim.throwNow(); });
    S.segmented(document.getElementById('cor-earthdir'), function (v) { sim.earthDir = v; sim.throwNow(); });
    speed.addEventListener('input', refreshSpeed);
    speed.addEventListener('change', function () { sim.throwNow(); });
    throwBtn.addEventListener('click', function () { sim.throwNow(); });

    refreshMode();
    setResult('Drücke auf <b>„Ball werfen“</b> und beobachte beide Bilder gleichzeitig.');
    zs.onFirstShow = function () { sim.throwNow(); };
    return zs;
  };
})();

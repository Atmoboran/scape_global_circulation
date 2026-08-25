# SCAPE° — Die Windgürtel der Erde

A browser-only simulation of Earth's global atmospheric circulation,
illustrating how the same "warm rises, cold sinks, wind fills the gap"
principle behind a simple sea breeze — scaled up to a whole planet and bent
by rotation — produces the Hadley, Ferrel and Polar cells, and the pressure
and wind belts that ride on top of them.

Press **Start** and watch a single guided build-up: the sun starts heating
the equator far more than the poles (same energy, concentrated at a steep
sun angle vs. spread thin at a shallow one), and a single convective loop
forms per hemisphere — rising at the equator, sinking at the pole, exactly
Hadley's original 1735 model. A few seconds in, Earth's rotation "switches
on": the Coriolis force deflects the flow and tears that one loop into three
smaller cells — Hadley (0–30°), the reversed, indirect Ferrel cell (30–60°),
and the Polar cell (60–90°). Latitude tick marks, four pressure badges
(equatorial low / ITCZ, subtropical high, subpolar low, polar high) and the
three surface wind belts (Passat, Westwind, Polarer Ostwind) fade in as the
cells settle into their steady state, which then keeps circulating
indefinitely — this is a one-way build-up, not a day/night-style cycle,
since the real circulation never switches its rotation off. **Reset** returns
to a calm, pre-sunrise start.

- Pure client-side canvas + JavaScript — no build step, no server, no
  dependencies beyond a Google Fonts stylesheet.
- Physics: the flow field is an analytic, divergence-free streamfunction —
  a linear blend of a single equator-to-pole cell and a three-lobed cell
  pattern (alternating rotational sense: direct / indirect / direct, which
  is what turns Hadley's simple model into the real three-cell structure).
  Being a streamfunction blend, it stays exactly mass-conserving at every
  point along the transition, so particles never pile up or leak, whatever
  the mix. Verified analytically and against a Python streamplot before
  being ported into the animation. Small Brownian jitter gives the "air
  molecules jiggling" feel even at rest.
- The ground colour band runs through the actual climate zones this
  circulation produces — tropical, subtropical desert (the sinking, drying
  air under the 30° high), temperate, subpolar, polar — as a small payoff
  connecting the abstract cells above to the real world below.
- Design: SCAPE° corporate design (Archivo, thick ink borders, poster-hero
  layout), mobile-first and optimized for touch — matching the sibling
  `landwind_simulation` and `chaotic_pendel` projects.

Open `index.html` directly, or serve the folder with any static file server.

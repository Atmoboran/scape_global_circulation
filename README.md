# SCAPE° — Die Windgürtel der Erde

A browser-only simulation of Earth's global atmospheric circulation,
illustrating how the same "warm rises, cold sinks, wind fills the gap"
principle behind a simple sea breeze — scaled up to a whole planet and bent
by rotation — produces the Hadley, Ferrel and Polar cells, and the pressure
and wind belts that ride on top of them.

Press **Start** and watch a single guided build-up on a pseudo-3D globe: the
sun starts heating the equator far more than the poles (same energy,
concentrated at a steep sun angle vs. spread thin at a shallow one), and a
single convective loop forms per hemisphere — drawn as one big ribbon
hugging each side of the globe's limb, rising at the equator and sinking at
the pole, exactly Hadley's original 1735 model. A few seconds in, Earth's
rotation "switches on": the Coriolis force deflects the flow and tears that
one loop into three smaller cells — Hadley (0–30°), the reversed, indirect
Ferrel cell (30–60°), and the Polar cell (60–90°) — cross-fading into the
familiar three-cell globe diagram, with latitude rings, four pressure
badges (equatorial low / ITCZ, subtropical high, subpolar low, polar high)
and a Passat / Westwind / Polarer-Ostwind legend fading in as the cells
settle into their steady state, which then keeps circulating indefinitely —
this is a one-way build-up, not a day/night-style cycle, since the real
circulation never switches its rotation off. **Reset** returns to a calm,
pre-sunrise start.

- Pure client-side canvas + JavaScript — no build step, no server, no
  libraries (no WebGL/three.js either), no dependencies beyond a Google
  Fonts stylesheet. The "3D" globe is a hand-rolled orthographic projection
  on a plain 2D canvas: a latitude circle projects to a horizontal chord at
  y = R·sin(latitude), which is the one formula the whole scene is built on
  (sphere shading, climate-zone bands, and the tubes all reuse it).
- Physics: each latitude band's circulation is a closed loop — surface
  branch hugging the sphere's edge, aloft branch bulging outward, joined by
  two smooth caps — whose rotational sense (direct/equatorward-surface for
  Hadley and Polar, indirect/poleward-surface for Ferrel) was derived
  analytically and cross-checked against a Python streamplot of the
  equivalent flat-earth version before being carried over. Particles ride
  that loop directly (not a 2D vector field), so there's no risk of mass
  piling up anywhere. The single-cell and three-cell tube sets both exist
  and animate at all times; only their drawn opacity cross-fades as
  rotation ramps in, which is a simpler and equally smooth way to dissolve
  one cell structure into the other than morphing geometry.
- The globe's face is banded through the actual climate zones this
  circulation produces — tropical, temperate, polar — as a small payoff
  connecting the abstract cells at the limb to the real world on the
  surface.
- Design: SCAPE° corporate design (Archivo, thick ink borders, poster-hero
  layout), mobile-first and optimized for touch — matching the sibling
  `landwind_simulation` and `chaotic_pendel` projects.

Open `index.html` directly, or serve the folder with any static file server.

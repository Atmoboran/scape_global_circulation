# SCAPE° — Die Windgürtel der Erde

A browser-only, German-language explainer of Earth's global atmospheric
circulation for non-experts, built as three short interactive experiments
that each add one idea:

1. **Die Sonne — why the equator is warm and the poles are cold.** Two
   equally wide sunbeams (same amount of light) hit Earth, one at the equator
   and one at a latitude chosen with a slider. A close-up of the ground,
   split into equal tiles, shows the slanted beam spreading the same light
   over more tiles, so each tile gets less energy (∝ sin of the sun's
   elevation).
2. **Die Erddrehung — what the Coriolis force does.** A ball thrown across a
   turning merry-go-round, shown side by side from space (it flies straight)
   and from the rider's point of view (it curves right, or left on a
   clockwise disc). A second scenario swaps the carousel for Earth seen from
   above the pole: air sent from 30° towards the equator is deflected west
   (→ north-east trade wind), air sent towards the pole is deflected east
   (→ westerlies). The Earth version integrates f = 2Ω·sin(latitude), so the
   deflection is strongest near the pole and zero at the equator.
3. **Alles zusammen — the full circulation**, in five guided steps on a
   pseudo-3D globe: uneven heating → one big Hadley cell (no rotation) →
   rotation splits it into Hadley, Ferrel and Polar cells → pressure belts
   (ITCZ, subtropical highs, subpolar lows, polar highs) → surface wind
   belts (trades, westerlies, polar easterlies). Each step has its own
   caption below the globe, and every layer fades in smoothly.

## Readability

- Canvas text is never smaller than 13 px at 100 % zoom and always has a
  white halo or box behind it. Each simulation has a separate layout for
  narrow (phone) and wide screens, so labels don't overlap.
- **Every simulation window can be zoomed and panned**: +/− buttons,
  Ctrl/⌘ + mouse wheel, double-click, or a two-finger pinch. Once zoomed
  in, drag to pan. There is also a fullscreen button. The zoom is a canvas
  transform, so text and lines stay sharp.

## Files

- `index.html`: page structure and all explanatory text
- `style.css`: SCAPE° corporate design (Archivo, thick ink borders, poster hero)
- `js/common.js`: shared helpers and the zoomable canvas stage
- `js/sim-sun.js`, `js/sim-coriolis.js`, `js/sim-circulation.js`: the three simulations
- `js/app.js`: chapter tabs and the animation loop (only the visible simulation runs)

Pure client-side canvas and JavaScript. No build step, no libraries, no
dependencies apart from a Google Fonts stylesheet. Open `index.html`
directly, or serve the folder with any static file server.

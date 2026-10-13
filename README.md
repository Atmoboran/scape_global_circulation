# SCAPE° — Die Windgürtel der Erde

A browser-only explainer of Earth's global atmospheric circulation for
non-experts, in three short parts that each add one idea. The parts are
numbered buttons in the header (hash routes `#sonne`, `#coriolis`,
`#zirkulation`); every part ends with a "Weiter zu …" button.

1. **Die Sonne — why the equator is warm and the poles are cold.** Two
   equally wide sunbeams (red A at the equator, blue B at a latitude chosen
   with the slider or the presets Sahara / Deutschland / Nordkap) carry the
   same amount of light. A close-up of the ground, split into equal tiles,
   shows the slanted beam spreading the same light over more tiles, so each
   tile gets less energy (∝ sin of the sun's elevation).
   Tasks: find the latitude where a tile gets half the energy (60°); send B
   to the Sahara and to the Nordkap.
2. **Die Erddrehung — what the Coriolis force does.** A ball thrown across a
   turning merry-go-round, shown side by side from space (it flies straight)
   and from the rider's point of view (it curves right, or left on a
   clockwise disc). The second scenario swaps the carousel for Earth seen
   from above the pole: air sent from 30° towards the equator is deflected
   west (→ trade wind), air sent towards the pole east (→ westerlies). The
   Earth version integrates f = 2Ω·sin(latitude), so the deflection is
   strongest near the pole and zero at the equator.
   Tasks: throw on a turning carousel; throw without rotation; send air
   towards the equator on the turning Earth.
3. **Alles zusammen — the full circulation**, in five guided steps (stepper +
   Zurück/Weiter) on a pseudo-3D globe: uneven heating → one big cell (no
   rotation) → rotation splits it into Hadley, Ferrel and Polar cells →
   pressure belts (T red, H blue) → surface wind belts (trades, westerlies,
   polar easterlies).
   Tasks: reach step 5; answer which wind belt Germany lies in (westerlies).

Solving a part's tasks unlocks its "Merke" box. Each part has a one-sentence
instruction (more behind the "i" button), a hint saying what the model
simplifies, and collapsible topics with the longer explanations.

## Run

Open `index.html` (double-click works, no build, no server, works offline),
or serve the folder with any static file server / GitHub Pages.

URL switches for staff: `?kiosk` (exhibit mode: back to part 1 after
3 minutes without touch). The app has no staff panel.

Zoom: two fingers on touch screens, Ctrl (⌘) + mouse wheel on desktop; drag
to pan once zoomed in. Every stage has a fullscreen button.

## Files

```
index.html             structure only (data-t placeholders for every text)
css/kit.css            shared SCAPE° components (same in every app)
css/app.css            layout of this app
js/view.js             phone/desktop layout switch (loaded in <head>)
js/texts.js            fills the texts from content/
js/brand.js            fills logo and footer line from the theme
js/kit.js              fullscreen button, hint badge, info notes, tasks/Merke, kiosk mode
js/common.js           maths, canvas labels, the zoomable canvas stage
js/sim-sun.js          part 1: sunlight on a sphere
js/sim-coriolis.js     part 2: carousel and Earth seen from above the pole
js/sim-circulation.js  part 3: the circulation globe in five steps
js/app.js              parts/routing, poster kicker, animation loop (only the visible part runs)
content/texts.de.js    every visible text, including canvas labels (edit or translate here)
theme/                 the design: font, palette, logo, colours (see theme/README.md)
```

## Layout

Phone: instruction, the stage at full width, controls, result, hint, tasks,
Merke, topics. Desktop (automatic from 1000 px, or via the
"Desktop-/Handy-Ansicht" toggle, remembered for this app only): the stage on
the left, sized to the screen; instruction, controls, tasks and Merke on the
right. Parts 1 and 2 keep their natural wide shape on the desktop (globe +
two close-ups; two discs side by side) and stack vertically on a phone;
the part 3 globe is square. Canvas text is drawn in CSS pixels and never
smaller than 13 px on screen.

## Adapting

Design: `theme/` only (simulation colours in `THEME.circulation`; the globes
use the CD temperature scale `THEME.tempColor`, T/H and beams A/B follow
`THEME.data`; the poster colours vary per part via `html[data-part]` at the
end of `theme.css`). Texts: `content/texts.de.js` only (lines marked `LOCAL`
refer to Germany or the visitors' region). Founders Grotesk is used when
installed, otherwise the system fallback.

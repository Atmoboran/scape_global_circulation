// THEME – brand and colours used from JavaScript (logo, footer, canvas
// drawings). The CSS side lives in theme.css. For another institution,
// replace the values here; the keys are what the app looks up.
window.THEME = {
  brand: {
    name: 'SCAPE°',
    // Wordmark: name with the subtitle spread over its full width.
    logoHtml:
      '<span class="logo-word">SCAPE°</span>' +
      '<span class="logo-sub" aria-hidden="true"><span>Wetter</span><span>Klima</span><span>Mensch</span></span>',
    logoLabel: 'SCAPE° – Wetter Klima Mensch',
    // The one line in every footer.
    line: 'SCAPE° – Wetter. Klima. Mensch.',
    titleSuffix: ' – SCAPE°',
    themeColor: '#F2E4BA',
    // Short mark S° for the browser tab.
    favicon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#FFF487"/><text x="16" y="23.5" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="19" fill="#000">S°</text></svg>'
  },

  // Typeface for canvas text (the same stack as --font in theme.css).
  font: '"Founders Grotesk","Helvetica Neue",Inter,Arial,sans-serif',

  // The SCAPE° palette by name. Drawings refer to these names.
  palette: {
    black: '#000000', white: '#FFFFFF',
    olive: '#726B1E', sand: '#D4BFA3',
    gold: '#E09F00', amber: '#F59E24', yellow: '#FFE547', yellowStrong: '#FFD500', yellowBright: '#FFED00', yellowS: '#FDC618',
    yellowPastel: '#FFF487', yellowPale: '#FDF6B7',
    rust: '#D55117', orange: '#EE7518', salmon: '#EF887F', pink: '#F8E1E6', cream: '#F2E4BA',
    red: '#E41513', red2: '#E8472E',
    purple: '#442683', purple2: '#523E91', lavender: '#E0E5F5', lilac: '#C5B8DB',
    greenStrong: '#00983A', green: '#62BA91', greenPale: '#B0D8C0', mint: '#CFE6CE', paleGreen: '#D0E8DC',
    cyan: '#0097BE', cyan2: '#44ABCC', cyan3: '#80C0DA', petrol: '#1F6C8E', teal: '#007B73', grey: '#AEC4C2',
    navy: '#28348B', blue: '#0253A0', blue2: '#3274BA', bluePale: '#98B8DD', ice: '#D4EDF8'
  },

  // Meaningful data colours, the same in every app (style guide 4.3).
  data: {
    cold: '#3274BA', neutral: '#D9D6CF', warm: '#E41513',   // temperature scale
    low: '#E41513', high: '#3274BA',                        // T (Tief) red, H (Hoch) blue
    pairA: '#E41513', pairB: '#28348B'                      // two things compared: red vs blue
  }
};

// Colour on the CD temperature scale: t = 0 (cold) … 0.5 (neutral) … 1 (warm).
THEME.tempColor = function (t) {
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = t < 0.5 ? [hex(THEME.data.cold), hex(THEME.data.neutral)] : [hex(THEME.data.neutral), hex(THEME.data.warm)];
  const f = Math.max(0, Math.min(1, t < 0.5 ? t * 2 : (t - 0.5) * 2));
  return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',') + ')';
};

// ---- Windgürtel: colours the three simulations draw with ----
// Names are what js/sim-*.js look up (SCAPE.COLORS). Temperature on the
// globes comes from THEME.tempColor, T/H and beams A/B from THEME.data.
THEME.circulation = {
  ink: '#000000', paper: '#FFFFFF',
  olive: '#726B1E', mustard: '#C89F09', orange: '#EE7518', rust: '#D55117', red: '#E41513',
  purple: '#442683', green: '#00983A', cyan: '#0097BE', navy: '#28348B',
  cream: '#F2E4BA', pastelYellow: '#FFF487', yellow: '#FFED00', pastelBlue: '#D4EDF8',
  lavender: '#E0E5F5', mint: '#62BA91',
  sky: '#EAF6FB',          // simulation background
  ground: '#D9C9A0',       // unlit ground tiles (experiment 1)
  neutral: '#E9E4D6',      // globe without heating colours
  sea: '#9FD0EA',          // earth disc seen from above the pole
  panelA: '#F4F9FC',       // left panel of the side-by-side view
  panelB: '#FFFBEA',       // right panel of the side-by-side view
  closeUp: '#F7FBFE',      // background of the ground close-up
  beamA: '#E41513',        // experiment 1: beam A (equator) …
  beamB: '#28348B',        // … and beam B (two things compared: red vs blue)
  low: '#E41513',          // T (Tief) – same as THEME.data.low
  high: '#3274BA',         // H (Hoch) – same as THEME.data.high
  // where the globes sit on the CD temperature scale (0 cold … 1 warm)
  tempPole: 0.1, temp60: 0.3, temp30: 0.6, tempEquator: 0.8
};

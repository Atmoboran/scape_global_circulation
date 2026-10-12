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
    claim: 'Wetter, Klima, Wandel. Wir erklären es.',
    contactHtml: 'SCAPE°<br>Frankfurter Straße 39<br>63065 Offenbach am Main<br>Instagram: @scape_offenbach<br>scape@offenbach.de',
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
  }
};

// ---- Windgürtel: colours the three simulations draw with ----
// Names are what js/sim-*.js look up (window.SCAPE.COLORS).
THEME.circulation = {
  ink: '#000000', paper: '#FFFFFF',
  olive: '#726B1E', mustard: '#C89F09', orange: '#EE7518', rust: '#D55117', red: '#E41513',
  purple: '#442683', green: '#00983A', cyan: '#0097BE', navy: '#28348B',
  cream: '#F2E4BA', pastelYellow: '#FFF487', yellow: '#FFED00', pastelBlue: '#D4EDF8',
  lavender: '#E0E5F5', mint: '#62BA91',
  sky: '#EAF6FB',          // simulation background
  ground: '#D9C9A0',       // unlit ground tiles (experiment 1)
  neutral: '#E9E4D6',      // globe without heating colours
  sea: '#9FD0EA',          // carousel / earth disc rim
  panelA: '#F4F9FC',       // left panel of the side-by-side view
  panelB: '#FFFBEA',       // right panel of the side-by-side view
  closeUp: '#F7FBFE'       // background of the ground close-up
};

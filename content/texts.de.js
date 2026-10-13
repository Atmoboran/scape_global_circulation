// Every visible text of the app. Edit or translate this file to adapt the
// exhibit; index.html only holds data-t="path.to.key" placeholders that
// js/texts.js fills from here. Entries written as functions build a sentence
// around runtime values. Lines marked LOCAL refer to SCAPE° or its region.
window.TEXTS = {
  lang: 'de',
  pageTitle: 'Die Windgürtel der Erde',
  description: 'Drei Experimente, die zeigen, wie die großen Winde der Erde entstehen: ungleiche Erwärmung durch die Sonne, die Corioliskraft und die globale Zirkulation mit Passat, Westwinden und Polaren Ostwinden.',

  // Texts of the shared kit (js/view.js, js/kit.js).
  kit: {
    viewToDesktop: 'Desktop-Ansicht',
    viewToMobile: 'Handy-Ansicht',
    viewToDesktopAria: 'Zur Desktop-Ansicht wechseln',
    viewToMobileAria: 'Zur Handy-Ansicht wechseln',
    fullscreenEnter: 'Vollbild',
    fullscreenExit: 'Vollbild beenden',
    infoAria: 'Erklärung anzeigen',
    merke: 'Merke',
    tasks: 'Aufgaben',
    merkeLocked: 'Löse die Aufgaben – dann erscheint hier, was du herausgefunden hast.',
    devLink: '(dev)'
  },

  // ---- header navigation and poster ----------------------------------------
  nav: {
    aria: 'Die drei Teile',
    sonne: 'Sonne',
    coriolis: 'Erddrehung',
    zirkulation: 'Windgürtel'
  },
  poster: {
    headline: 'Die Windgürtel<br>der Erde',
    kicker: (n, total, topic) => 'Teil ' + n + ' von ' + total + ' · ' + topic
  },
  parts: {
    sonne: { topic: 'Die Sonne', lead: 'Warum ist es am Äquator heiß und an den Polen kalt?' },
    coriolis: { topic: 'Die Erddrehung', lead: 'Was macht die Corioliskraft mit dem Wind?' },
    zirkulation: { topic: 'Alles zusammen', lead: 'Wie entstehen die Windgürtel der Erde?' }
  },
  common: {
    tasks: 'Aufgaben',
    merke: 'Merke',
    howtoAria: 'Mehr zur Anleitung',
    zoom: 'Zoomen: zwei Finger oder Strg + Mausrad. Im gezoomten Bild kannst du das Bild mit dem Finger oder der Maus verschieben.',
    sideRight: 'rechts',
    sideLeft: 'links'
  },

  // ---- Teil 1: Die Sonne ----------------------------------------------------
  sun: {
    title: 'Teil 1: Die Sonne',
    howto: '<b>So geht’s:</b> Schieb den Regler und schick Strahl <b class="c-b">B</b> nach Norden.',
    howtoNote: '<p>Die beiden Lichtstrahlen <b class="c-a">A</b> und <b class="c-b">B</b> sind gleich breit und bringen gleich viel Licht (gelbe Punkte). Strahl <b class="c-a">A</b> trifft den Äquator.</p><p>Unten siehst du den Boden in der Nahaufnahme, aufgeteilt in gleich große Kacheln.</p>',
    stageAria: 'Simulation: Sonnenlicht trifft am Äquator steil und am Pol flach auf',
    badge: 'Schieb den Regler: Strahl B wandert nach Norden',
    sliderLabel: 'Wo trifft Strahl B auf?',
    latValue: lat => lat + '° Nord',
    presetsAria: 'Beispielorte',
    presetSahara: '23° – Sahara',
    // LOCAL: example place for the visitors' home region
    presetHome: '50° – Deutschland',
    presetNordkap: '70° – Nordkap',
    result: (lat, elev, factor, pct) => 'Bei <b>' + lat + '° Nord</b> steht die Sonne nur <b>' + elev + '°</b> hoch. ' +
      'Dasselbe Licht verteilt sich auf <b>' + factor + '-mal</b> so viel Fläche. ' +
      'Jeder Quadratmeter bekommt nur <b>' + pct + ' %</b> der Energie, die am Äquator ankommt.',
    hint: 'Im Modell zählt nur der Winkel, unter dem das Licht auftrifft. Wolken, Jahreszeiten und die schräge Erdachse lassen wir weg.',
    tasks: {
      half: 'Schick Strahl B so weit nach Norden, dass jede Kachel nur noch halb so viel Licht bekommt wie am Äquator.',
      trip: 'Schick Strahl B erst in die Sahara und dann ans Nordkap. Wo verteilt sich das Licht auf mehr Kacheln?'
    },
    merke: 'Am Äquator trifft das Sonnenlicht steil auf. Jeder Quadratmeter bekommt dort viel mehr Energie als an den Polen. Deshalb ist es am Äquator warm und an den Polen kalt. Warme Luft steigt auf, kalte Luft sinkt ab. Dieser Unterschied ist der Motor aller großen Winde.',
    canvas: {
      sideView: 'Die Erde von der Seite',
      equator: 'Äquator 0°',
      lat30: '30°',
      lat60: '60°',
      northPole: 'Nordpol',
      southPole: 'Südpol',
      sun: 'Sonne',
      tagA: 'A',
      tagB: 'B',
      patchA: 'A: Äquator',
      patchB: lat => 'B: ' + lat + '° Nord',
      elevation: deg => 'Sonne ' + deg + '° hoch',
      area: tiles => 'Fläche: ' + tiles + ' Kacheln',
      perTile: pct => 'Je Kachel: ' + pct + ' %',
      closeUp: 'Nahaufnahme vom Boden unter A und B'
    },
    topics: {
      intro: {
        title: 'Zwei Zutaten für die großen Winde',
        // LOCAL: "in Deutschland"
        body: '<p>Warum weht der Wind in Deutschland meistens von Westen? Warum gibt es am Äquator Regenwald und etwas weiter nördlich die Sahara?</p><p>Die Antwort steckt in einem riesigen Kreislauf der Luft rund um die Erde. Um ihn zu verstehen, brauchst du nur <b>zwei Zutaten</b>: die ungleiche Erwärmung durch die Sonne (Teil 1) und die Drehung der Erde (Teil 2). In Teil 3 kommt beides zusammen.</p>'
      },
      what: {
        title: 'Was passiert hier?',
        body: '<p>Die Sonne scheint auf die ganze Erde. Trotzdem ist es am Äquator das ganze Jahr über heiß, und an den Polen liegt Eis. Dabei ist der Äquator der Sonne kaum näher als der Nordpol. Woran liegt es also?</p>' +
          '<ol>' +
          '<li><b>Am Äquator trifft das Licht fast senkrecht auf.</b> Die ganze Energie des Strahls landet auf einer kleinen Fläche – hier auf 2 Kacheln. Jede Kachel wird kräftig aufgeheizt.</li>' +
          '<li><b>Weiter im Norden trifft es schräg auf</b>, weil die Erde eine Kugel ist. Dieselbe Menge Licht verteilt sich jetzt auf viel mehr Kacheln. Jede einzelne bekommt weniger ab und bleibt kühler.</li>' +
          '<li><b>Probier’s mit einer Taschenlampe:</b> Leuchte senkrecht auf den Tisch – ein kleiner, heller Fleck. Halte sie schräg – der Fleck wird groß und schwach. Genau das passiert auf der Erde.</li>' +
          '<li><b>Dazu kommt noch:</b> Schräge Strahlen müssen einen längeren Weg durch die Lufthülle (hellblauer Rand) zurücklegen. Dabei geht zusätzlich Energie verloren.</li>' +
          '</ol>'
      }
    },
    next: 'Weiter zu Teil 2: Die Erddrehung →'
  },

  // ---- Teil 2: Die Erddrehung ------------------------------------------------
  cor: {
    title: 'Teil 2: Die Erddrehung',
    howto: '<b>So geht’s:</b> Drück auf „Ball werfen“ und vergleiche die beiden Bilder.',
    howtoNote: '<p>Stell dir ein Karussell vor. Du stehst in der Mitte und wirfst einem Freund am Rand einen Ball zu.</p><p>Das erste Bild zeigt den Wurf von oben aus dem Weltall, das zweite so, wie du ihn auf dem Karussell erlebst. Danach kannst du dasselbe mit der <b>Erde</b> ausprobieren.</p>',
    stageAria: 'Simulation: Ball auf einem drehenden Karussell, von außen und von innen gesehen',
    badge: 'Drück auf „Ball werfen“',
    modeLabel: 'Was soll sich drehen?',
    modeCarousel: 'Ein Karussell',
    modeEarth: 'Die Erde (Blick von oben auf den Pol)',
    throwBall: 'Ball werfen',
    throwAir: 'Luft losschicken',
    earthDirLabel: 'Wohin soll die Luft strömen? (Start bei 30° Breite)',
    toEquator: 'Richtung Äquator',
    toPole: 'Richtung Pol',
    speedLabel: 'Drehung',
    speedNone: 'keine Drehung',
    speedSlow: 'langsam',
    speedMid: 'mittel',
    speedFast: 'schnell',
    speedPeriod: s => ' (1 Umdrehung in ' + s + ' s)',
    dirLabel: 'Drehrichtung',
    hemiLabel: 'Halbkugel',
    ccw: 'gegen den Uhrzeigersinn (wie die Nordhalbkugel)',
    cw: 'im Uhrzeigersinn (wie die Südhalbkugel)',
    north: 'Nordhalbkugel (Blick auf den Nordpol)',
    south: 'Südhalbkugel (Blick auf den Südpol)',
    result: {
      start: 'Drück auf <b>„Ball werfen“</b> und beobachte beide Bilder gleichzeitig.',
      flyingBall: 'Der Ball fliegt … beobachte beide Bilder gleichzeitig!',
      flyingAir: 'Die Luft strömt … beobachte beide Bilder gleichzeitig!',
      hit: '<b>Treffer!</b> Ohne Drehung fliegt der Ball in beiden Ansichten einfach geradeaus. Stell die Drehung hoch und wirf noch einmal.',
      still: '<b>Keine Ablenkung.</b> Ohne Erddrehung strömt die Luft auf beiden Bildern geradeaus. Stell die Drehung hoch.',
      miss: side => '<b>Daneben!</b> Von außen gesehen (Bild 1) fliegt der Ball <b>geradeaus</b>. Aber während er fliegt, dreht sich das Karussell weiter. ' +
        'Für dich auf dem Karussell sieht es so aus, als würde der Ball nach <b>' + side + '</b> abbiegen. Diese scheinbare Kraft heißt <b>Corioliskraft</b>.',
      toEquator: (side, north) => 'Die Luft strömt Richtung Äquator und wird nach <b>' + side + '</b> abgelenkt – also nach <b>Westen</b>. ' +
        'Sie kommt dadurch aus <b>' + (north ? 'Nordosten' : 'Südosten') + '</b>: Das ist der <b>' + (north ? 'Nordost' : 'Südost') + '-Passat</b>.',
      // LOCAL: "unser Wetter in Deutschland"
      toPole: (side, north) => 'Die Luft strömt Richtung Pol und wird nach <b>' + side + '</b> abgelenkt – also nach <b>Osten</b>. ' +
        'Sie kommt dadurch aus <b>' + (north ? 'Südwesten' : 'Nordwesten') + '</b>: Das sind die <b>Westwinde</b>' + (north ? ', die auch unser Wetter in Deutschland bringen.' : '.')
    },
    hint: 'Im Modell drehen sich Karussell und Erde viel schneller als in Wirklichkeit. Die echte Erde braucht für eine Umdrehung einen ganzen Tag.',
    tasks: {
      miss: 'Wirf den Ball, während sich das Karussell dreht. Trifft er deinen Freund?',
      still: 'Stell die Drehung auf „keine Drehung“ und wirf noch einmal.',
      earth: 'Wähle „Die Erde“ und schick Luft Richtung Äquator. Wohin wird sie abgelenkt?'
    },
    merke: 'Die Erde dreht sich unter dem Wind weg. Deshalb wird alles, was weit strömt – Wind und Meeresströmungen –, auf der Nordhalbkugel nach rechts abgelenkt und auf der Südhalbkugel nach links. Das ist die Corioliskraft. Luft, die zum Äquator strömt, wird so nach Westen abgelenkt.',
    canvas: {
      carouselTop: '1  Von oben (aus dem Weltall)',
      carouselTopSub: 'Der Ball fliegt geradeaus. Das Karussell dreht sich unter ihm weg.',
      carouselRide: '2  Auf dem Karussell',
      carouselRideSub: side => 'Du drehst dich mit. Für dich sieht es so aus, als biegt der Ball nach ' + side + ' ab.',
      earthStill: '1  Ohne Erddrehung',
      earthStillSub: 'Die Luft strömt geradeaus.',
      earthTurn: '2  Mit Erddrehung (echte Erde)',
      earthTurnSub: side => 'Wir drehen uns mit der Erde mit. Die Luft wird nach ' + side + ' abgelenkt.',
      friend: 'Freund',
      you: 'Du',
      lat60: '60°',
      lat30: '30°',
      northPole: 'Nordpol',
      southPole: 'Südpol',
      equatorRim: 'Äquator (Rand)',
      eastLeft: '← Osten',
      westLeft: '← Westen',
      westRight: 'Westen →',
      eastRight: 'Osten →'
    },
    topics: {
      what: {
        title: 'Was passiert hier?',
        body: '<p>Wind ist Luft, die von einem Ort zum anderen strömt. Man könnte meinen, sie strömt einfach geradeaus. Aber die Erde unter ihr dreht sich. Was bedeutet das für den Wind?</p>' +
          '<ol>' +
          '<li><b>Der Ball fliegt in Wirklichkeit geradeaus.</b> Niemand schubst ihn zur Seite – das siehst du im ersten Bild von oben.</li>' +
          '<li><b>Aber das Karussell dreht sich weiter,</b> während der Ball fliegt. Wenn er am Rand ankommt, ist dein Freund schon ein Stück weitergefahren.</li>' +
          '<li><b>Für dich auf dem Karussell sieht es so aus, als würde der Ball abbiegen.</b> Diese scheinbare Kraft nennt man <b>Corioliskraft</b>. Je schneller die Drehung, desto stärker die Ablenkung.</li>' +
          '<li><b>Die Erde ist ein riesiges Karussell.</b> Von oben auf den Nordpol geschaut, dreht sie sich gegen den Uhrzeigersinn. Wir drehen uns mit – deshalb sehen wir, wie der Wind abgelenkt wird. Wähle oben <b>„Die Erde“</b> und probier es aus.</li>' +
          '<li><b>Am Pol ist die Ablenkung am stärksten, am Äquator gibt es sie nicht.</b> Dort dreht sich der Boden nicht unter der Luft weg, sondern trägt sie nur mit.</li>' +
          '</ol>'
      }
    },
    next: 'Weiter zu Teil 3: Alles zusammen →'
  },

  // ---- Teil 3: Alles zusammen ------------------------------------------------
  circ: {
    title: 'Teil 3: Alles zusammen',
    howto: '<b>So geht’s:</b> Geh mit „Weiter“ Schritt für Schritt durch und schau zu, wie die Windgürtel entstehen.',
    howtoNote: '<p>Jetzt kombinieren wir beide Zutaten: <b>ungleiche Erwärmung</b> (Teil 1) und <b>Erddrehung</b> (Teil 2). Jeder Schritt fügt dem Globus eine Idee hinzu.</p>',
    stageAria: 'Simulation: Globus mit den drei Zirkulationszellen je Halbkugel und den Bodenwinden',
    badge: 'Tippe auf „Weiter“ – Schritt für Schritt',
    stepsAria: 'Schritte',
    steps: ['1 · Sonne heizt', '2 · Ein Kreislauf', '3 · Erde dreht sich', '4 · Hoch & Tief', '5 · Windgürtel'],
    prev: '← Zurück',
    next: 'Weiter →',
    counter: (n, total) => 'Schritt ' + n + ' von ' + total,
    captions: [
      {
        title: '1 · Die Sonne heizt ungleich',
        body: '<p>Wie in Teil 1: Am Äquator wird es warm, an den Polen bleibt es kalt (die Farben auf dem Globus).</p>' +
          '<p>Die <b>warme Luft am Äquator</b> ist leicht und steigt auf. Am Boden fehlt dann Luft, der Luftdruck sinkt: ein <b class="c-low">Tiefdruckgebiet (T)</b>. ' +
          'Die <b>kalte Luft an den Polen</b> ist schwer und sinkt ab. Dort drückt mehr Luft auf den Boden: ein <b class="c-high">Hochdruckgebiet (H)</b>.</p>'
      },
      {
        title: '2 · Ohne Erddrehung: ein großer Kreislauf',
        body: '<p>Würde sich die Erde nicht drehen, gäbe es auf jeder Halbkugel <b>nur einen einzigen Kreislauf</b> (rechts am Globus): ' +
          'Die Luft steigt am Äquator auf, strömt hoch oben zum Pol, sinkt dort ab und fließt am Boden zurück zum Äquator.</p>' +
          '<p>Die weißen Pfeile zeigen den Wind am Boden: überall <b>geradewegs zum Äquator</b>. So stellte man sich das schon vor fast 300 Jahren vor.</p>'
      },
      {
        title: '3 · Die Erde dreht sich: aus einem Kreislauf werden drei',
        body: '<p>Jetzt kommt die <b>Corioliskraft</b> aus Teil 2 dazu. Die Luft, die hoch oben vom Äquator Richtung Pol strömt, wird immer stärker nach Osten abgelenkt. ' +
          'Bei etwa <b>30° Breite</b> kommt sie kaum noch weiter nach Norden, staut sich und sinkt ab.</p>' +
          '<p>So zerfällt der große Kreislauf in <b>drei kleinere Zellen</b> pro Halbkugel: ' +
          'die <b class="c-hadley">Hadley-Zelle</b> (0–30°), die <b class="c-ferrel">Ferrel-Zelle</b> (30–60°, sie dreht andersherum) und die <b class="c-polar">Polarzelle</b> (60–90°). ' +
          'Auch die Bodenwinde (weiße Pfeile) werden jetzt abgelenkt.</p>'
      },
      {
        title: '4 · Hoch- und Tiefdruckgürtel',
        body: '<p>Wo Luft <b>aufsteigt</b>, entsteht am Boden ein <b class="c-low">Tief (T)</b>. Aufsteigende Luft kühlt ab, es bilden sich Wolken und Regen. ' +
          'Wo Luft <b>absinkt</b>, entsteht ein <b class="c-high">Hoch (H)</b>. Absinkende Luft erwärmt sich, Wolken lösen sich auf, es bleibt trocken.</p>' +
          '<ul>' +
          '<li><b class="c-low">T am Äquator</b> („ITCZ“): jeden Tag Gewitter – hier wächst der tropische Regenwald.</li>' +
          '<li><b class="c-high">H bei 30°</b>: trockene, absinkende Luft – hier liegen die großen Wüsten wie die Sahara.</li>' +
          // LOCAL: "wie in Deutschland"
          '<li><b class="c-low">T bei 60°</b>: hier bilden sich immer wieder Tiefdruckgebiete – wechselhaftes Wetter wie in Deutschland.</li>' +
          '<li><b class="c-high">H am Pol</b>: kalte, schwere, absinkende Luft.</li>' +
          '</ul>'
      },
      {
        title: '5 · Die Windgürtel',
        body: '<p>Am Boden strömt die Luft immer <b>vom Hoch zum Tief</b>, und die Corioliskraft lenkt sie dabei ab (Nordhalbkugel nach rechts, Südhalbkugel nach links). So entstehen drei Windgürtel je Halbkugel:</p>' +
          '<ul>' +
          '<li><b>Passat</b> (0–30°): weht vom Hoch bei 30° zum Äquator und kommt aus Nordosten bzw. Südosten. Seeleute nutzten ihn früher, um über den Atlantik zu segeln.</li>' +
          // LOCAL: "Deutschland liegt in dieser Zone"
          '<li><b>Westwinde</b> (30–60°): wehen vom Hoch bei 30° zum Tief bei 60° und kommen aus Westen. <b>Deutschland liegt in dieser Zone</b> – deshalb kommt unser Wetter meistens vom Atlantik im Westen.</li>' +
          '<li><b>Polare Ostwinde</b> (60–90°): kalte Luft strömt vom Polarhoch weg und kommt aus Osten.</li>' +
          '</ul>'
      }
    ],
    legend: {
      title: 'Legende',
      hadley: '<b>Hadley-Zelle</b> (0–30°)',
      ferrel: '<b>Ferrel-Zelle</b> (30–60°)',
      polar: '<b>Polarzelle</b> (60–90°)',
      low: '<b>Tiefdruck</b>: Luft steigt auf, Wolken und Regen',
      high: '<b>Hochdruck</b>: Luft sinkt ab, trocken',
      arrows: '<b>Weiße Pfeile</b>: Wind am Boden',
      dots: '<b>Weiße Punkte</b>: Luft, die im Kreislauf mitströmt'
    },
    hint: 'Das Modell ist stark vereinfacht: In Wirklichkeit wandern die Gürtel mit den Jahreszeiten, und Kontinente, Meere und Gebirge verbiegen sie.',
    tasks: {
      steps: 'Geh alle fünf Schritte durch.',
      // LOCAL: question about the visitors' home region
      quiz: 'In welchem Windgürtel liegt Deutschland?',
      quizAria: 'Antwort wählen',
      answers: { passat: 'Passat', west: 'Westwinde', polar: 'Polare Ostwinde' },
      // LOCAL
      wrong: 'Nicht ganz. Deutschland liegt bei etwa 50° Nord – schau dir Schritt 5 an.',
      right: 'Richtig! Deshalb kommt unser Wetter meistens von Westen.'
    },
    merke: 'Die Sonne heizt ungleich: Warme Luft steigt auf, kalte sinkt ab. Die Erddrehung lenkt die strömende Luft ab und teilt den Kreislauf in drei Zellen. So entstehen die Druckgürtel – Regenwald am Äquator, Wüsten bei 30° – und die Windgürtel: Passat, Westwinde und Polare Ostwinde.',
    canvas: {
      single: ['Ein großer', 'Kreislauf'],
      singleShort: ['Ein', 'Kreislauf'],
      hadley: ['Hadley-Zelle'],
      hadleyShort: ['Hadley'],
      ferrel: ['Ferrel-Zelle'],
      ferrelShort: ['Ferrel'],
      polar: ['Polarzelle'],
      polarShort: ['Polar'],
      rise: ['Warme Luft', 'steigt auf'],
      riseShort: ['Luft', 'steigt', 'auf'],
      sink: ['Kalte Luft', 'sinkt ab'],
      sinkShort: ['Luft', 'sinkt ab'],
      warm: 'warm',
      cold: 'kalt',
      tradeNorth: 'Nordost-Passat',
      tradeSouth: 'Südost-Passat',
      westerlies: 'Westwinde',
      polarEasterlies: 'Polare Ostwinde',
      polarEasterliesLines: ['Polare', 'Ostwinde'],
      low: 'T',
      high: 'H'
    },
    topics: {
      model: {
        title: 'Was das Modell weglässt',
        body: '<p>In Wirklichkeit liegen die Gürtel nicht genau bei 0°, 30° und 60°. Sie wandern mit dem Sonnenstand: Im Nordsommer zieht der Regengürtel am Äquator (ITCZ) nach Norden, im Nordwinter nach Süden. Daher kommen zum Beispiel Regenzeit und Trockenzeit in den Tropen.</p>' +
          '<p>Über Kontinenten und Gebirgen zerfallen die Druckgürtel in einzelne Hochs und Tiefs. In Europa sind das vor allem das Azorenhoch und das Islandtief – zwischen ihnen wehen die Westwinde, die unser Wetter bringen.</p>' +
          '<p>Hoch oben an den Grenzen der Zellen wehen außerdem sehr schnelle Windbänder, die <b>Jetstreams</b>. Sie schlängeln sich um die Erde und lenken die Tiefdruckgebiete.</p>'
      }
    },
    again: '↺ Noch einmal von vorn: Teil 1'
  }
};

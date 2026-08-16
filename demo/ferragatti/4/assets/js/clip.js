/* ============================================================
   FERRAGATTI — clip di apertura
   ------------------------------------------------------------
   Due strati sovrapposti:

   1. <video>  è il posto del montato vero. Punta già a
      assets/media/hero.mp4 (e .webm). Se il file c'è, parte,
      compare in dissolvenza e spegne lo stand-in.
   2. <canvas> è lo stand-in WebGL: tessuto scuro in movimento
      lento, con deriva di camera e grana da pellicola.

   Il puntatore agisce su entrambi, in due modi diversi:
   — sullo stand-in il gesto lascia una scia (vedi sotto);
   — sul video, che è un filmato e non si può illuminare,
     accende un alone caldo e sposta l'inquadratura di pochi
     pixel (micro-parallasse).

   ------------------------------------------------------------
   LA SCIA

   Il cursore non "illumina" il tessuto: lo tira. Ogni volta che
   la mano percorre un tratto di schermo lascia un punto in una
   coda circolare, con la direzione e la velocità di quel tratto
   — purché quel tratto sia stato percorso abbastanza in fretta.

   Sotto una certa velocità la mano non lascia segno: il tessuto
   resta al suo respiro e la scia non nasce proprio. Non è una
   rinuncia, è il rimedio a un difetto che sta nel principio
   stesso della scia — i punti nascono ogni tot di strada, quindi
   piano nascono radi, e radi si vedono uno per uno invece che
   come un solco. La soglia e i suoi numeri stanno sopra
   pushTrail.

   La luce invece segue il cursore sempre, a qualunque velocità:
   quella non passa dalla coda.
   Ogni punto della coda fa due cose:

     1. TRASCINA — sposta il tessuto nel verso del gesto, con
        presa che molla man mano che ci si allontana. I punti
        vecchi tengono ancora un po' di spostamento mentre si
        spengono: è questo ritardo che fa la piega dietro la
        mano, invece di un rigonfiamento che segue il cursore.

     2. ONDA — da lì parte un fronte che si allarga nel tempo e
        si smorza. Non è un cerchio: è un'ellisse stesa di
        traverso al gesto, perché è così che si apre una piega
        quando si tira un lenzuolo. Sovrapposti, i fronti dei
        punti vicini fanno l'onda che si allontana dalla mano e
        si posa da sé.

        L'onda è lunga e bassa, non corta e fitta: una cresta
        sola con due avvallamenti ai lati, non un treno di
        anelli. È tutta lì la differenza fra un panno e una
        pozza d'acqua, e i numeri che la reggono stanno sopra
        waveH.

   Il fronte porta anche la luce: dove c'è cresta il tessuto
   prende più riflesso, altrimenti la deformazione si vedrebbe
   solo come un tremolio del disegno e non come rilievo.

   Quanti punti stiano nella coda lo decide la scheda video:
   WebGL garantisce pochissimi uniform, quindi la lunghezza si
   ricava a runtime e lo shader si scrive attorno a quel numero.

   Con "riduci movimento" la scia non si accumula: resta la sola
   presa smorzata sotto il cursore, e nessun fronte in giro.

   Non c'è niente da modificare quando arriva il video: basta
   copiarlo in assets/media/ con quel nome.

   ------------------------------------------------------------
   PERCHÉ SCATTAVA COL CURSORE

   Il disegno era già pesante, ma lo strappo che si sentiva
   muovendo il mouse veniva quasi tutto dal lato JavaScript, e
   nasceva da tre cose che ora non ci sono più:

     1. il ciclo di disegno chiedeva la misura del canvas a ogni
        fotogramma, subito dopo che il puntatore aveva scritto le
        variabili CSS dell'apertura. Scrivere stile e poi chiedere
        geometria obbliga il browser a rifare stile e
        impaginazione in sincrono, prima di rispondere: non
        succedeva da fermi, succedeva esattamente muovendo la
        mano. Ora la misura arriva da un ResizeObserver e il
        ciclo non chiede più niente al documento;

     2. quelle variabili CSS servono solo allo strato video —
        alone e micro-parallasse — ma si scrivevano comunque, a
        ogni evento, anche quando in campo c'era lo stand-in e
        non si vedeva nulla. Ora si scrivono solo col video vero,
        e una volta per fotogramma invece che una per evento;

     3. la scia si percorreva tutta a ogni pixel, punti spenti
        compresi, e per il fronte d'onda la si percorreva tre
        volte. Ora i posti liberi e i punti troppo lontani per
        contare si saltano.

   ------------------------------------------------------------
   DUE STRADE PROVATE E RITIRATE

   Segnate qui perché sembrano entrambe giuste sulla carta, e
   sullo schermo peggioravano proprio il movimento lento — il
   caso in cui gli scatti si vedono.

     — SMORZAMENTO SCRITTO SUL TEMPO. Corretto in fisica, ma
       converte l'irregolarità dei tempi di fotogramma in
       irregolarità del movimento. Il perché per esteso sta sopra
       la funzione step().

     — RISOLUZIONE CHE SI ADATTA DA SOLA. Il costo del disegno
       segue quanti punti vivi ha la scia, quindi a mano lenta il
       carico oscilla attorno alla soglia e la scala si mette a
       ballare, riallocando il buffer a ogni cambio. Il perché
       per esteso sta sopra la funzione resize().

   Restano ferme, e vanno tenute ferme, la frazione di
   smorzamento (0,09 e 0,06 per fotogramma) e la scala del canvas.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('clip');
  var video = document.getElementById('hero-video');
  var note = document.getElementById('clip-note');
  var hero = document.querySelector('.hero');
  if (!canvas || !hero) return;

  /* CANTIERE (provvisorio) — sotto i 900 px l'apertura è
     display:none dietro al cartello. Un canvas nascosto misura zero
     per zero, ma il contesto WebGL, gli shader e il video si
     aprirebbero lo stesso: batteria e dati spesi per qualcosa che
     nessuno guarda. La soglia è quella del foglio di stile, sezione
     CANTIERE, e se ne va insieme a lui. */
  if (!window.matchMedia('(min-width: 900px)').matches) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var running = true;

  /* ==========================================================
     STAND-IN WEBGL — contesto e taglia della coda
     Va aperto per primo: la lunghezza della scia dipende da
     quanti uniform regge la scheda, e lo shader si scrive
     attorno a quel numero.
     ========================================================== */
  var gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    powerPreference: 'default'
  });

  // senza WebGL resta un fondo pieno, ma nella tinta del drappo
  if (!gl) { canvas.style.background = '#060A18'; return; }

  /* Ogni punto della scia costa due vettori uniform (posizione +
     età + forza in un vec4, direzione in un vec2). WebGL ne
     garantisce appena 16 in tutto, e qualcuno serve al resto:
     su una scheda al minimo la scia si accorcia invece di far
     fallire la compilazione. */
  var budget = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 16;
  var TRAIL = Math.max(4, Math.min(18, Math.floor((budget - 8) / 2)));

  /* ==========================================================
     PUNTATORE
     Una sola sorgente, letta da tutti e due gli strati.
     ptr è in spazio uv dello shader: y positivo verso l'alto.
     ========================================================== */
  var ptr = { x: 0, y: 0 };        // posizione smorzata
  var ptrTo = { x: 0, y: 0 };      // posizione grezza
  var amt = 0, amtTo = 0;          // 0 = nessun puntatore, 1 = attivo
  var moved = true;

  // coda circolare della scia
  var tp = new Float32Array(TRAIL * 4);   // x, y, età, forza
  var tv = new Float32Array(TRAIL * 2);   // direzione del gesto
  var head = 0;
  var lastX = 0, lastY = 0, lastT = 0;
  var hasLast = false;

  var STEP = 0.03;   // passo minimo fra due punti, in uv

  /* ----------------------------------------------------------
     LA SOGLIA DI VELOCITÀ

     La scia non nasce nel tempo, nasce nello spazio: un punto
     ogni STEP di strada percorsa, cioè ogni 27 px su un'apertura
     alta 900. Ne segue che la frequenza dei punti non la decide
     il disegno, la decide la mano — è la velocità divisa STEP:

         50 px/s  ->   1,9 punti/s      un fronte ogni mezzo secondo
        200 px/s  ->   7,4 punti/s      si contano a occhio
        450 px/s  ->  16,7 punti/s      cominciano a fondersi
       1200 px/s  ->  44,4 punti/s      scia continua

     Sotto i quattrocento e rotti pixel al secondo, quindi, non
     si vede una scia: si vedono fronti d'onda separati che si
     accendono uno per uno. Non è un fotogramma perso — è
     esattamente quello che il codice ha chiesto di disegnare, e
     nessuna quantità di fluidità lo può aggiustare, perché non è
     un problema di fluidità.

     Da qui la soglia: sotto V_MIN la mano non lascia segno sul
     tessuto. Fra V_MIN e V_PIENA i fronti entrano in dissolvenza
     — se la soglia fosse netta, muovendosi proprio sul confine
     si accenderebbero e spegnerebbero, che è un altro sfarfallio.

     Questo taglia soltanto la scia. La luce continua a seguire
     il cursore sempre, a qualunque velocità, perché quella non
     passa di qui: sta in ptrTo e in amt, che onMove aggiorna a
     ogni movimento comunque.

     Le due soglie sono in uv al secondo. Per averle in pixel al
     secondo si moltiplicano per l'altezza dell'apertura.
     ---------------------------------------------------------- */
  var V_MIN = 0.45;    // ~400 px/s: sotto, nessun segno
  var V_PIENA = 0.80;  // ~720 px/s: sopra, forza piena

  function pushTrail(x, y) {
    var now = performance.now();

    if (!hasLast) {
      lastX = x; lastY = y; lastT = now; hasLast = true;
      return;
    }

    var dx = x - lastX, dy = y - lastY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < STEP) return;

    // velocità in uv/s, con un tetto: una sciabolata non deve
    // strappare il tessuto più di quanto già non faccia
    var dt = Math.max(now - lastT, 8) / 1000;
    var speed = Math.min(dist / dt, 5.0);

    // quanto di quel tratto arriva sul tessuto: 0 sotto soglia,
    // pieno sopra, con la S di raccordo in mezzo
    var f = (speed - V_MIN) / (V_PIENA - V_MIN);
    f = f <= 0 ? 0 : (f >= 1 ? 1 : f * f * (3 - 2 * f));

    // Sotto soglia il punto di partenza si sposta lo stesso. È la
    // parte che conta: se restasse fermo, la strada percorsa piano
    // si accumulerebbe fino a STEP e uscirebbe comunque un punto,
    // isolato e in ritardo — cioè proprio il pop che si voleva
    // togliere, solo più raro.
    if (f <= 0) {
      lastX = x; lastY = y; lastT = now;
      return;
    }

    var i4 = head * 4, i2 = head * 2;
    tp[i4] = x;
    tp[i4 + 1] = y;
    tp[i4 + 2] = 0;                                      // età
    tp[i4 + 3] = Math.min(0.30 + speed * 0.30, 1.0) * f; // forza
    tv[i2] = dx / dist;
    tv[i2 + 1] = dy / dist;

    head = (head + 1) % TRAIL;
    lastX = x; lastY = y; lastT = now;
  }

  function ageTrail(dt) {
    for (var i = 0; i < TRAIL; i++) {
      var i4 = i * 4;
      if (tp[i4 + 3] <= 0.0) continue;

      tp[i4 + 2] += dt;
      // il tessuto non rimbalza: si placa. Smorzamento un po' più
      // lungo di prima, così la piega si posa invece di sparire
      tp[i4 + 3] *= Math.exp(-dt * 1.05);

      // sotto una certa soglia non si vede più: si libera il posto
      if (tp[i4 + 3] < 0.004) tp[i4 + 3] = 0.0;
    }
  }

  /* ----------------------------------------------------------
     IL RIQUADRO DELL'APERTURA, LETTO QUANDO CAMBIA

     getBoundingClientRect() costringe il browser a ricalcolare
     l'impaginazione se qualcosa nel documento è stato toccato.
     Chiamarlo a ogni movimento del puntatore significa pagarlo
     anche sessanta volte al secondo, e su questa pagina non è
     poco: c'è il cartamodello da qualche centinaio di nodi e una
     barra con backdrop-filter.

     Il riquadro cambia solo quando la finestra si ridimensiona o
     quando si scorre (l'apertura è agganciata in cima, quindi
     scorrendo il suo bordo alto si muove). Si segna che è da
     rileggere e lo si rilegge al primo movimento utile, una volta.
     ---------------------------------------------------------- */
  var rect = null;
  var rectDirty = true;

  function markRect() { rectDirty = true; }

  /* ----------------------------------------------------------
     LE VARIABILI CSS DELLO STRATO VIDEO

     Alone e micro-parallasse vivono in CSS e servono soltanto
     quando c'è il montato vero: senza video l'alone sta a
     opacità zero e la parallasse non è dichiarata. Scriverle
     comunque a ogni movimento costa un ricalcolo di stile su
     tutto il sottoalbero dell'apertura — le proprietà
     personalizzate si ereditano, quindi tocca ogni discendente,
     marchio SVG compreso — e non si vede nulla in cambio.

     Quindi: si scrivono solo quando il video è davvero in campo,
     e una volta per fotogramma invece che una volta per evento.
     Il ciclo è suo, separato da quello del disegno, perché lo
     stand-in si spegne quando il video subentra ma queste due
     variabili devono continuare a muoversi.
     ---------------------------------------------------------- */
  var hasVideo = false;
  var cssQueued = false;
  var cssX = 0.5, cssY = 0.5;

  function flushCss() {
    cssQueued = false;
    hero.style.setProperty('--mx', (cssX * 100).toFixed(2) + '%');
    hero.style.setProperty('--my', (cssY * 100).toFixed(2) + '%');
    hero.style.setProperty('--px', (-(cssX - 0.5) * 18).toFixed(1) + 'px');
    hero.style.setProperty('--py', (-(cssY - 0.5) * 18).toFixed(1) + 'px');
  }

  function onMove(e) {
    if (rectDirty || !rect) {
      rect = hero.getBoundingClientRect();
      rectDirty = false;
    }

    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    if (!rect.height) return;

    ptrTo.x = (mx - rect.width / 2) / rect.height;
    ptrTo.y = (rect.height / 2 - my) / rect.height;
    amtTo = 1;

    if (!reduce) pushTrail(ptrTo.x, ptrTo.y);

    if (hasVideo) {
      cssX = mx / rect.width;
      cssY = my / rect.height;
      if (!cssQueued) { cssQueued = true; requestAnimationFrame(flushCss); }
    }

    moved = true;
  }

  // uscendo si perde il filo del gesto: rientrando non deve
  // partire un'onda dal punto in cui si era usciti
  function onLeave() { amtTo = 0; hasLast = false; moved = true; }

  hero.addEventListener('pointermove', onMove, { passive: true });
  hero.addEventListener('pointerleave', onLeave, { passive: true });

  // il dito non "sorvola": su touch si lascia il moto automatico
  hero.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') { amtTo = 0; }
  }, { passive: true });

  /* ==========================================================
     SUBENTRO DEL VIDEO VERO
     ========================================================== */
  if (video) {
    video.addEventListener('loadeddata', function () {
      if (video.readyState < 2) return;
      video.classList.add('ready');
      canvas.classList.add('stood-down');
      hero.classList.add('has-video');
      if (note) note.classList.add('gone');
      // da qui in poi alone e parallasse hanno un senso: prima no
      hasVideo = true;
      // lo stand-in non serve più: si ferma per non consumare GPU
      setTimeout(function () { running = false; }, 1000);
    });
  }

  /* ==========================================================
     SHADER
     ========================================================== */
  var vert = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

  var frag = [
    'precision highp float;',
    'uniform vec2  u_res;',
    'uniform float u_t;',
    'uniform vec2  u_ptr;                // puntatore in spazio uv',
    'uniform float u_amt;                // 0 = automatico, 1 = guidato dal puntatore',
    'uniform float u_wave;               // 0 con "riduci movimento"',
    'uniform vec4  u_tp[' + TRAIL + '];  // scia: xy posizione, z età, w forza',
    'uniform vec2  u_tv[' + TRAIL + '];  // scia: direzione del gesto',
    '',
    '// il blu della palette — #0B132B, lo stesso di --gold in CSS —',
    '// in valori 0-1. È l\'unica tinta dichiarata: tutto il resto',
    '// del drappo si ricava da qui.',
    'const vec3 TINTA = vec3(0.043, 0.075, 0.169);',
    '',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    '',
    'float noise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
    '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',
    '',
    '// Il calo di ampiezza fra un\'ottava e l\'altra è ciò che decide',
    '// la mano del tessuto. A metà per volta — il valore da manuale —',
    '// le ottave fini pesano quanto le grosse, e quello che si vede',
    '// è carta accartocciata. Più il numero cala, più le pieghe',
    '// larghe comandano e le fini restano a fare il pelo: è la',
    '// stessa forma, senza il tritume sopra. A 0,38 la crespa fine',
    '// si sente ancora sotto la luce radente ma non disegna più.',
    '// Sotto lo 0,35 diventa gomma.',
    'float fbm(vec2 p){',
    '  float v = 0.0, a = 0.5;',
    '  for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.38; }',
    '  return v;',
    '}',
    '',
    '// PIEGHE DI TESSUTO: fbm con dominio deformato.',
    '// L\'ultimo numero è quanto forte il campo si torce su sé',
    '// stesso. Tanta torsione fa curve strette, e curve strette',
    '// leggono come stagnola sgualcita; poca fa pieghe lunghe che',
    '// si stendono, che è il modo in cui cade la stoffa. 2,05 sta',
    '// dove il drappo si legge ancora mosso ma le pieghe arrivano',
    '// intere da un capo all\'altro invece di spezzarsi per strada.',
    '//',
    '// Prima della torsione il campo si allunga in verticale. Un',
    '// panneggio vero non è rumore isotropo: la stoffa pende, e',
    '// pendendo le pieghe corrono per il lungo, larghe in basso e',
    '// strette dove il tessuto è preso. Leggendo la y più piano',
    '// della x le stesse pieghe si stirano nel verso della caduta —',
    '// non è un effetto in più, è togliere l\'unica cosa che',
    '// tradiva il rumore.',
    'float folds(vec2 p, float t){',
    '  p *= vec2(1.0, 0.66);',
    '  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.05)), fbm(p + vec2(3.7, -t * 0.035)));',
    '  vec2 r = vec2(fbm(p + 2.1 * q + vec2(1.7, 9.2) + t * 0.025),',
    '                fbm(p + 2.1 * q + vec2(8.3, 2.8) - t * 0.018));',
    '  return fbm(p + 2.05 * r);',
    '}',
    '',
    '// LA SCIA, primo pezzo: il TRASCINAMENTO.',
    '// Sposta il punto in cui si va a leggere il tessuto, nel verso',
    '// del gesto. I punti vecchi tengono ancora un po\' di spinta',
    '// mentre si spengono, ed è quel ritardo a fare la piega dietro',
    '// la mano invece di un rigonfiamento che le sta appresso.',
    'vec2 drag(vec2 uv){',
    '  vec2 d = vec2(0.0);',
    '  for (int i = 0; i < ' + TRAIL + '; i++){',
    '    vec4 s = u_tp[i];',
    '    if (s.w <= 0.0) continue;          // posto libero nella coda',
    '    vec2 v = uv - s.xy;',
    '    float q = dot(v, v);',
    '    if (q > 1.5) continue;             // exp(-21.0): sotto il quanto di un canale a 8 bit',
    '    d -= u_tv[i] * exp(-q * 14.0) * s.w * 0.013;',
    '  }',
    '  return d;',
    '}',
    '',
    '// La scia, secondo pezzo: il RILIEVO del fronte d\'onda.',
    '// Da ogni punto della coda parte una cresta che si allarga',
    '// con l\'età e si smorza.',
    '//',
    '// TESSUTO, NON ACQUA. Sono tre cose a separarli, e stanno',
    '// tutte nei numeri qui sotto.',
    '//',
    '//   — QUANTE CRESTE. L\'acqua fa treni d\'anelli: molte',
    '//     oscillazioni dentro l\'inviluppo. Un panno ne fa una,',
    '//     con due avvallamenti bassi ai lati. Conta il rapporto',
    '//     fra lunghezza d\'onda e larghezza dell\'inviluppo: prima',
    '//     ci stavano due anelli e mezzo, adesso poco più di uno.',
    '//',
    '//   — QUANTO È RIPIDA. La pendenza è ampiezza per frequenza:',
    '//     allungando l\'onda si perde rilievo, e va restituito',
    '//     sull\'ampiezza — ma non tutto, se no torna dura. Da',
    '//     0,014 x 26 a 0,022 x 12: circa tre quarti della',
    '//     pendenza di prima, distribuita su uno spazio doppio.',
    '//',
    '//   — CHE FORMA HA. Una piega vera non è un cerchio: si',
    '//     stende di traverso al gesto, come quando si tira un',
    '//     lenzuolo. Il fronte si misura quindi su un\'ellisse,',
    '//     schiacciata lungo la direzione della mano e allargata',
    '//     di traverso. I due fattori sono scelti col prodotto',
    '//     vicino a uno, così l\'ellisse cambia forma senza',
    '//     cambiare quanta strada fa il fronte.',
    '//',
    '// E si allarga più piano: un panno porta l\'onda con più',
    '// peso dell\'acqua.',
    '//',
    '// Qui esce solo l\'altezza: la si legge',
    '// in tre punti vicini e si passa la pendenza alla normale,',
    '// perché l\'onda deve prendere luce come una piega vera e non',
    '// comparire come una macchia chiara sopra al disegno.',
    '//',
    '// La pendenza si ricaverebbe anche a mano, derivando: costa un',
    '// terzo, perché la coda si percorre una volta invece di tre.',
    '// Provato e tolto — la derivata esatta è più nitida della',
    '// differenza finita, che su un passo di 0,006 fa da filtro e',
    '// smussa le creste. Sono mezzo grado di normale, ma è mezzo',
    '// grado che cambia il disegno, e il disegno non si tocca.',
    'float waveH(vec2 uv){',
    '  float h = 0.0;',
    '  for (int i = 0; i < ' + TRAIL + '; i++){',
    '    vec4 s = u_tp[i];',
    '    if (s.w <= 0.0) continue;          // posto libero nella coda',
    '    vec2 v = uv - s.xy;',
    '    vec2 d = u_tv[i];',
    '    // distanza sull\'ellisse: lungo il gesto e di traverso',
    '    float r = length(vec2(dot(v, d) * 1.30, dot(v, vec2(-d.y, d.x)) * 0.76));',
    '    float off = r - s.z * 0.60;',
    '    if (off * off > 1.25) continue;    // exp(-17.5): sotto il quanto di un canale a 8 bit',
    '    h += cos(off * 12.0) * exp(-off * off * 14.0) * s.w;',
    '  }',
    '  return h * 0.022 * u_wave;',
    '}',
    '',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;',
    '  float t = u_t;',
    '',
    '  // deriva di camera lentissima: è ciò che fa leggere',
    '  // l\'immagine come una ripresa e non come una texture ferma',
    '  float zoom = 1.0 + 0.06 * sin(t * 0.045);',
    '  vec2 p = (uv * zoom + vec2(t * 0.008, sin(t * 0.03) * 0.02)) * 2.2;',
    '',
    '  // respiro di fondo: anche senza mano il drappo non è fermo',
    '  p += vec2(sin(uv.y * 2.6 + t * 0.30), cos(uv.x * 2.2 - t * 0.24)) * 0.045 * u_wave;',
    '',
    '  // il trascinamento, riportato nella scala del campo di rumore',
    '  p += drag(uv) * 2.2;',
    '',
    '  // presa ferma sotto il cursore: tiene il tessuto raccolto',
    '  // anche quando la mano si appoggia e non si muove',
    '  vec2 toP = uv - u_ptr;',
    '  float pull = exp(-dot(toP, toP) * 3.2) * u_amt;',
    '  p -= toP * pull * 0.30;',
    '',
    '  float e = 0.014;',
    '  float h  = folds(p, t);',
    '  float hx = folds(p + vec2(e, 0.0), t);',
    '  float hy = folds(p + vec2(0.0, e), t);',
    '',
    '  // il fronte d\'onda entra qui, come pendenza che si somma a',
    '  // quella delle pieghe: da questo punto in poi è luce vera e',
    '  // non un ritocco sul colore',
    '  float w = 0.006;',
    '  float wh = waveH(uv);',
    '  float wx = (wh - waveH(uv + vec2(w, 0.0))) / w;',
    '  float wy = (wh - waveH(uv + vec2(0.0, w))) / w;',
    '',
    '  // La z della normale è quanto il rilievo si fa sentire: più',
    '  // è alta, più il drappo è schiacciato. Le ottave fini pesano',
    '  // meno di prima (vedi fbm), quindi la pendenza è calata da',
    '  // sola: questo numero la restituisce, e il drappo resta',
    '  // profondo come era. Le pieghe tornano dov\'erano, l\'onda',
    '  // della mano no — quella l\'abbiamo ammorbidita apposta.',
    '  vec3 n = normalize(vec3((h - hx) / e + wx, (h - hy) / e + wy, 1.5));',
    '',
    '  // la luce: in automatico gira lenta, col puntatore lo segue',
    '  vec3 autoDir = vec3(cos(t * 0.11) * 0.8, 0.5 + sin(t * 0.08) * 0.28, 0.85);',
    '  vec3 handDir = vec3(u_ptr.x * 1.9, 0.35 + u_ptr.y * 1.7, 0.8);',
    '  vec3 lightDir = normalize(mix(autoDir, handDir, u_amt));',
    '',
    '  vec3 viewDir = vec3(0.0, 0.0, 1.0);',
    '  vec3 halfDir = normalize(lightDir + viewDir);',
    '',
    '  float diff = max(dot(n, lightDir), 0.0);',
    '  // L\'esponente del colpo di luce è la finitura della',
    '  // superficie. Alto, il riflesso si stringe in un filo e',
    '  // ridisegna ogni piega come uno spigolo: si può ammorbidire',
    '  // il rilievo quanto si vuole, il riflesso lo rifà duro. Qui',
    '  // il lume si allarga sulla piega invece di correrle sopra —',
    '  // seta e non lamiera. Chi rivuole il taglio di prima rimette',
    '  // 42, ed è l\'unico numero da toccare.',
    '  float spec = pow(max(dot(n, halfDir), 0.0), 30.0);',
    '  float sheen = pow(max(dot(n, halfDir), 0.0), 5.0) * 0.22;',
    '',
    '  // Tutti i colori del drappo escono da un solo valore:',
    '  // il blu della palette, #0B132B. Cambiare quello li cambia',
    '  // tutti insieme e la seta resta in tinta.',
    '  //',
    '  // Non è un drappo in piena luce: è un blu visto al buio.',
    '  // L\'ombra scende quasi a nero — con un soffio di freddo',
    '  // dentro, se no il nero della stessa tinta impasta e il',
    '  // tessuto sembra piatto — la luce diffusa porta la tinta, e',
    '  // solo il colpo di luce sale al chiaro. La distanza fra',
    '  // questi tre è la seta.',
    '  vec3 col = TINTA * 0.075 + vec3(0.006, 0.005, 0.014);',
    '  col += TINTA * 0.80 * diff * 0.46;',
    '',
    '  col += TINTA * 0.80 * sheen;',
    '  col += mix(TINTA, vec3(1.0), 0.55) * spec * 0.55;',
    '',
    '  // un soffio di tinta attorno al cursore, appena percepibile',
    '  col += TINTA * pull * 0.11;',
    '',
    '  // la vignettatura si sposta con la luce: tiene lo sguardo',
    '  vec2 vc = uv - u_ptr * 0.28 * u_amt;',
    '  float vig = smoothstep(1.45, 0.28, length(vc * vec2(0.78, 1.0)));',
    '  col *= mix(0.24, 1.0, vig);',
    '',
    '  // grana da pellicola',
    '  col += (hash(gl_FragCoord.xy + fract(t) * 91.7) - 0.5) * 0.030;',
    '',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Shader non compilato:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, vert);
  var fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'u_res');
  var uT = gl.getUniformLocation(prog, 'u_t');
  var uPtr = gl.getUniformLocation(prog, 'u_ptr');
  var uAmt = gl.getUniformLocation(prog, 'u_amt');
  var uWave = gl.getUniformLocation(prog, 'u_wave');
  var uTp = gl.getUniformLocation(prog, 'u_tp[0]');
  var uTv = gl.getUniformLocation(prog, 'u_tv[0]');

  gl.uniform1f(uWave, reduce ? 0.0 : 1.0);

  /* ==========================================================
     LA MISURA DEL FOTOGRAMMA
     ----------------------------------------------------------
     canvas.clientWidth è una lettura di geometria: chiesta dentro
     il ciclo di disegno, subito dopo che il puntatore ha toccato
     lo stile, obbliga il browser a rifare stile e impaginazione
     lì per lì, prima di rispondere. Sessanta volte al secondo,
     ma solo mentre si muove il mouse: è il motivo per cui lo
     scatto si sentiva proprio interagendo.

     Qui la misura in pixel CSS la porta chi la conosce senza
     doverla ricalcolare — ResizeObserver — e il ciclo di disegno
     non chiede più niente al documento.
     ========================================================== */
  var cssW = 0, cssH = 0;
  var sizeDirty = true;

  function noteSize(w, h) {
    if (w !== cssW || h !== cssH) { cssW = w; cssH = h; sizeDirty = true; }
  }

  // una lettura sola all'avvio: le notifiche del ResizeObserver
  // arrivano dopo il primo requestAnimationFrame, e senza questa
  // il primo fotogramma resterebbe senza misura
  noteSize(canvas.clientWidth, canvas.clientHeight);

  if ('ResizeObserver' in window) {
    new ResizeObserver(function (entries) {
      var e = entries[0];
      // contentRect è già in pixel CSS e arriva senza costringere
      // a nessun ricalcolo: è misura che il browser aveva comunque
      var r = e.contentRect;
      noteSize(Math.round(r.width), Math.round(r.height));
    }).observe(canvas);
  } else {
    // il ripiego legge la geometria, ma solo al ridimensionamento
    window.addEventListener('resize', function () {
      noteSize(canvas.clientWidth, canvas.clientHeight);
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     LA RISOLUZIONE È FISSA, E DEVE RESTARLO

     C'è stata qui una risoluzione che si adattava da sola: se i
     fotogrammi si allungavano scendeva di scala, e risaliva
     quando c'era margine. Tolta, perché curava il male con un
     male peggiore.

     Ogni cambio di scala rialloca il buffer di disegno, ed è uno
     strappo visibile. Il guaio è dove cadono quegli strappi: il
     costo del disegno dipende da quanti punti vivi ha la scia,
     quindi con la mano ferma o lenta il carico oscilla proprio
     attorno alla soglia, e la scala si mette a ballare. Con la
     mano veloce la coda è sempre piena, il carico è alto e
     stabile, e la scala si assesta subito.

     Cioè: il rimedio scattava precisamente quando si muoveva
     piano, che è il caso in cui gli scatti si vedono.

     Se un giorno servisse davvero alleggerire, si abbassa questo
     numero a mano e si lascia lì. Una scala scelta una volta è
     meno bella e più liscia di una scala che si corregge da sé.
     ---------------------------------------------------------- */
  function resize() {
    // ResizeObserver consegna la prima misura prima del primo
    // disegno, ma se per qualche motivo non fosse ancora arrivata
    // è meglio non disegnare che disegnare in un pixel
    if (!sizeDirty || !cssW || !cssH) return;
    sizeDirty = false;

    var cap = window.innerWidth < 900 ? 1.0 : 1.25;
    var dpr = Math.min(window.devicePixelRatio || 1, cap);
    var w = Math.max(1, Math.floor(cssW * dpr));
    var h = Math.max(1, Math.floor(cssH * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      moved = true;
    }
  }

  /* ----------------------------------------------------------
     Col sipario l'apertura resta agganciata in cima per tutta
     la pagina: tecnicamente è sempre "dentro il viewport" anche
     quando le altre sezioni la coprono. L'osservatore da solo
     non basta, quindi si controlla anche quanto si è scesi:
     oltre una schermata e mezza la clip è sepolta e si spegne.
     ---------------------------------------------------------- */
  var inView = true;
  var buried = false;
  var visible = true;

  function updateVisibility() {
    var was = visible;
    buried = window.scrollY > window.innerHeight * 1.4;
    visible = inView && !buried;
    if (visible && !was) moved = true;
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      inView = e[0].isIntersecting;
      updateVisibility();
    }, { threshold: 0 }).observe(canvas);
  }

  // scorrendo, l'apertura agganciata sposta il proprio bordo alto:
  // il riquadro va riletto, ma al primo movimento utile, non qui
  window.addEventListener('scroll', function () {
    markRect();
    updateVisibility();
  }, { passive: true });

  window.addEventListener('resize', function () {
    markRect();
    moved = true;
    updateVisibility();
  }, { passive: true });

  updateVisibility();

  var start = performance.now();
  var prev = start;
  var FROZEN = 6.0;   // posa scelta per chi ha chiesto meno movimento

  /* ----------------------------------------------------------
     SMORZAMENTO A FOTOGRAMMA, NON A TEMPO

     Il puntatore non salta dove sta la mano: ci arriva smorzato,
     ed è quel ritardo a far sembrare la luce pesante. Il
     recupero è una frazione fissa della distanza rimasta, presa
     una volta per fotogramma.

     Scritta così è "sbagliata": non è una velocità, quindi se i
     fotogrammi durano il doppio la luce impiega il doppio. La
     versione giusta si scrive sul tempo, 1 - e^(-v·dt), e dà lo
     stesso ritardo a qualunque passo. L'ho provata ed è peggio,
     per un motivo che vale la pena scrivere qui perché non si
     ritenti la strada:

       il ritardo diventa costante nei secondi, ma il passo di
       avanzamento diventa variabile nei fotogrammi. Su uno
       schermo a 120 Hz con un disegno che sta fra i due passi,
       i tempi si quantizzano — 8,3 ms, poi 16,7, poi 8,3 — e la
       frazione recuperata oscilla fra 0,046 e 0,132: quasi tre
       volte, da un fotogramma al successivo. Muovendo la mano in
       fretta non si nota; muovendola piano si vedono i singoli
       passi, e sono disuguali.

     L'occhio guarda fotogrammi, non secondi. Una frazione fissa
     per fotogramma dà sempre la stessa progressione geometrica
     sullo schermo, qualunque cosa faccia il tempo fra un
     fotogramma e l'altro: è irregolare nella fisica e regolare
     nella visione, e qui conta la seconda.
     ---------------------------------------------------------- */
  function step(now) {
    if (!running) return;
    requestAnimationFrame(step);

    // il salto di una scheda in secondo piano non deve invecchiare
    // la scia di colpo: si tiene il passo entro il ragionevole.
    // Qui il tempo vero serve ancora, ed è giusto che serva: la
    // scia si spegne per conto suo, non insegue niente
    var dt = Math.min(Math.max(now - prev, 0) / 1000, 0.05);
    prev = now;

    if (!visible) return;
    if (!cssW || !cssH) return;   // in attesa della prima misura

    // smorzamento del puntatore: la luce insegue, non scatta
    var k = reduce ? 1 : 0.09;
    var dx = ptrTo.x - ptr.x, dy = ptrTo.y - ptr.y, da = amtTo - amt;

    if (Math.abs(dx) > 0.0002 || Math.abs(dy) > 0.0002 || Math.abs(da) > 0.002) {
      ptr.x += dx * k;
      ptr.y += dy * k;
      amt += da * (reduce ? 1 : 0.06);
      moved = true;
    }

    // con moto ridotto si disegna solo quando il puntatore cambia
    if (reduce && !moved) return;
    moved = false;

    ageTrail(dt);

    resize();
    gl.uniform1f(uT, reduce ? FROZEN : (now - start) / 1000);
    gl.uniform2f(uPtr, ptr.x, ptr.y);
    gl.uniform1f(uAmt, amt);
    gl.uniform4fv(uTp, tp);
    gl.uniform2fv(uTv, tv);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  requestAnimationFrame(step);
})();

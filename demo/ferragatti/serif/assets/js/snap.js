/* ============================================================
   FERRAGATTI — aggancio delle sezioni
   ------------------------------------------------------------
   Un gesto porta a una sezione, non a un pezzo di sezione: lo
   scorrimento progressivo è sostituito da uno scatto morbido di
   una schermata per volta.

   Le fermate nascono dagli strati del sipario: le sezioni della
   home (.hero, .band, footer) e i due pezzi di ogni capo nella
   vetrina della collezione (.look, .piece-word). Aggiungendo una
   sezione con class="band", o un capo alla vetrina, entra da sé
   sia nell'impilamento sia negli agganci.

   Gli strati non sono tutti uguali. Quasi tutti si agganciano con
   la cima e coprono lo schermo intero; le parole di un capo, nella
   vetrina della collezione, si agganciano col fondo e si fermano
   appena si leggono per intero — sopra restano la fotografia e il
   suo strato. È l'unica differenza, ed è dichiarata in FOOT.

   Il modulo è acceso a ogni larghezza, telefono compreso, ed è lui
   ad accendere il sipario: aggiunge .curtain all'<html> e scrive
   il punto d'aggancio di ogni sezione. Le due cose stanno insieme
   perché il sipario ha bisogno delle stesse misure degli agganci.

   Una sezione può valere più di una fermata. Su schermo largo ogni
   sezione sta in una schermata e le due cose coincidono; su
   telefono no — il testo incolonnato è quasi sempre più lungo
   dello schermo — e allora la sezione si divide in tante fermate
   quante sono le schermate che le mancano, spaziate uguali. Un
   gesto resta un gesto: porta alla schermata dopo, che sia la
   prossima sezione o il resto di questa.
   ============================================================ */
(function () {
  'use strict';

  /* Gli strati: le sezioni della home e, nella vetrina della
     collezione, i due pezzi di ogni capo — la fotografia e le
     parole. Una pagina che non ha gli uni ha gli altri, e il
     modulo non ha bisogno di sapere su quale pagina sta girando. */
  var SELECTOR = '.hero, .band, .look, .piece-word, footer';

  /* Gli strati che si appoggiano al fondo dello schermo invece di
     riempirlo. Salgono sopra quello di prima e si fermano dove
     finiscono di leggersi: quel che avanza sopra non è spazio
     vuoto, è la fotografia che resta a vedersi. */
  var FOOT = '.piece-word';

  /* CANTIERE (provvisorio) — sotto i 900 px la pagina è il cartello
     e il sito è display:none: non c'è niente da agganciare, e
     misurare sezioni che nessuno vede darebbe altezze a zero. La
     soglia è quella del foglio di stile, sezione CANTIERE: se si
     sposta lì, si sposta qui. Quando il cartello se ne va, questa
     riga e le due che la usano se ne vanno con lui. */
  var wideMQ = window.matchMedia('(min-width: 900px)');

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Soglia sotto la quale un evento della rotella è coda inerziale e
     non intenzione. Su trackpad la spinta parte da 40-60 e decade
     fino a frazioni di unità: 10 separa bene le due cose. */
  var STRONG = 10;
  var QUIET = 110;

  /* Quanto dito serve per dire "vai avanti". Sotto questa misura è
     un tocco che ha tremato, non una strisciata. */
  var SWIPE = 40;

  /* Quanto una sezione può sfondare la schermata prima che valga
     una fermata in più — in frazione di schermata, perché a dire se
     uno scatto si sente come uno scatto è quanta pagina muove, non
     quanti pixel. Sotto questa misura lo sfondamento non è
     contenuto: è un arrotondamento, o una riga che non ci sta per
     poco. Farne una fermata significa spendere un gesto intero per
     muovere la pagina di mezzo dito, e da fuori non si legge come
     una fermata breve — si legge come una pagina che al primo gesto
     non risponde.

     Il taglio riguarda solo le fermate. L'aggancio resta scritto
     sull'altezza vera, così quei pixel si vedono comunque mentre si
     passa alla sezione dopo, e restano in vista finché la sezione
     dopo non li copre: si rinuncia a fermarcisi, non a mostrarli.

     Il minimo in pixel è per le schermate molto basse, dove il sei
     per cento sarebbe meno di un bordo. */
  var CRUMB = 0.06;
  var CRUMB_MIN = 24;

  var stops = [];
  var marks = [];                  // { el, y }: la fermata di ogni sezione
  var index = 0;
  var animating = false;
  var armed = true;
  var enabled = false;
  var quietTimer = null;
  var guardTimer = null;
  var touchY = 0;
  var pinching = false;

  /* ==========================================================
     FERMATE
     ========================================================== */
  function measure() {
    var nodes = document.querySelectorAll(SELECTOR);
    var vh = window.innerHeight;
    var max = Math.max(0, document.documentElement.scrollHeight - vh);
    var crumb = Math.max(CRUMB_MIN, vh * CRUMB);

    function clamp(y) { return Math.max(0, Math.min(Math.round(y), max)); }
    function push(y) { if (stops.indexOf(y) === -1) stops.push(y); }

    /* Col sipario le sezioni sono position: sticky, e offsetTop di uno
       sticky racconta dove l'elemento è disegnato adesso, non dove sta
       nel documento: una sezione agganciata risponde con la propria
       posizione sullo schermo. Misurando a pagina scorsa, tutte le
       fermate alle spalle si schiaccerebbero sul punto in cui siamo.
       Si toglie l'aggancio per il tempo della lettura: è tutto dentro
       lo stesso blocco, quindi nessuna pittura intermedia e nessun
       tremolio. */
    var boxes = [];
    var held = [];

    Array.prototype.forEach.call(nodes, function (el) {
      if (getComputedStyle(el).position !== 'sticky') return;
      held.push([el, el.style.position]);
      el.style.position = 'static';
    });

    Array.prototype.forEach.call(nodes, function (el) {
      boxes.push({
        el: el,
        y: el.offsetTop,
        h: el.offsetHeight,
        sticky: held.some(function (pair) { return pair[0] === el; }),
        foot: el.matches ? el.matches(FOOT) : false
      });
    });

    held.forEach(function (pair) { pair[0].style.position = pair[1]; });

    stops = [];
    marks = [];

    boxes.forEach(function (b) {
      /* Quanto lo strato deve ancora salire dopo aver riempito lo
         schermo. Zero dove ci sta — ed è il caso di tutte le sezioni
         su schermo largo, dove infatti niente cambia rispetto a prima. */
      var travel = Math.max(0, b.h - vh);

      /* LO STRATO APPOGGIATO AL FONDO
         La sua fermata non è la propria cima ma il punto in cui il
         proprio fondo tocca il fondo dello schermo: è lì che si è
         letto tutto, e lì si smette di salire. Sopra resta scoperto
         quel che non serviva coprire — la fotografia del capo — e a
         coprirlo del tutto ci penserà la fotografia del capo dopo,
         che è lo strato successivo e sale sopra a questo. */
      if (b.foot) {
        var rest = clamp(b.y + b.h - vh);

        marks.push({ el: b.el, y: rest });

        /* Più alto dello schermo non si legge in un colpo: prima si
           mostra la cima, poi il resto a passi uguali. Su schermo
           largo non succede — le parole di un capo sono cinque righe
           di cartiglio — ma su misure strette sì, ed è lì che senza
           queste fermate il fondo del blocco resterebbe irraggiungibile. */
        if (travel > crumb) {
          push(clamp(b.y));
          var steps = Math.ceil(travel / vh);
          for (var j = 1; j < steps; j++) push(clamp(b.y + travel * j / steps));
        }

        push(rest);

        /* L'aggancio cade dove cade la fermata: il top è lo schermo
           che avanza sotto lo strato. Se lo strato è più alto dello
           schermo il numero è negativo, e allora si aggancia col
           fondo esattamente come una sezione lunga. */
        if (b.sticky) b.el.style.top = Math.round(vh - b.h) + 'px';
        return;
      }

      var start = clamp(b.y);
      marks.push({ el: b.el, y: start });
      push(start);

      var screens = travel > crumb ? Math.ceil(travel / vh) : 0;

      /* Fermate intermedie spaziate uguali invece che a schermate
         piene: l'ultimo passo di una divisione a schermate piene
         sarebbe un avanzo di pochi pixel, e uno scatto lungo un dito
         si sente come un inciampo. Dividendo in parti uguali ogni
         passo è al più una schermata e nessuno è stentato. */
      for (var k = 1; k <= screens; k++) push(clamp(b.y + travel * k / screens));

      /* E qui il sipario: una sezione che non ci sta si aggancia col
         fondo, non con la cima. Sale finché non mostra la propria
         fine e lì si ferma — che è esattamente dove cade la sua
         ultima fermata, quindi l'aggancio e lo scatto si fermano
         nello stesso punto. */
      if (b.sticky) b.el.style.top = (travel ? -travel : 0) + 'px';
    });

    stops.sort(function (a, b) { return a - b; });

    /* Rete: se sotto l'ultima sezione resta documento — un margine
       del corpo, qualcosa che sezione non è — ci vuole una fermata
       sul fondo, altrimenti quella coda non si raggiunge. */
    if (stops.length && max - stops[stops.length - 1] > 40) stops.push(max);

    index = nearest(window.scrollY);
  }

  function nearest(y) {
    var best = 0, dist = Infinity;
    for (var i = 0; i < stops.length; i++) {
      var d = Math.abs(stops[i] - y);
      if (d < dist) { dist = d; best = i; }
    }
    return best;
  }

  /* La fermata di un elemento si chiede alla misura, non alla
     posizione di adesso: per una sezione agganciata le due cose non
     coincidono. Chi non è una sezione — l'ancora #top sul <main> —
     non è agganciato e può rispondere da sé. */
  function stopFor(el) {
    var host = (el.closest ? el.closest(SELECTOR) : null) || el;

    for (var i = 0; i < marks.length; i++) {
      if (marks[i].el === host) return nearest(marks[i].y);
    }

    return nearest(Math.round(el.getBoundingClientRect().top + window.scrollY));
  }

  /* ==========================================================
     LO SCATTO — morbido, mai istantaneo
     ========================================================== */
  /* Via di mezzo: l'uscita in quarta parte decisa ma senza lo strappo
     dell'esponenziale, e atterra lunga. La curva conta più della
     durata — una simmetrica, che parte piano, si sente come ritardo;
     l'esponenziale, che parte a razzo, si sente come uno scatto. */
  function easeOutQuart(p) {
    return 1 - Math.pow(1 - p, 4);
  }

  var tweenId = 0;

  function tweenTo(y) {
    var from = window.scrollY;
    var dist = y - from;
    var mine = ++tweenId;            // annulla d'ufficio il tween precedente

    if (Math.abs(dist) < 2) { animating = false; rearmSoon(); return; }

    if (reduceMQ.matches) {          // chi ha chiesto meno movimento
      window.scrollTo(0, y);         // ci arriva, senza il viaggio
      animating = false;
      rearmSoon();
      return;
    }

    animating = true;

    var span = Math.abs(dist) / Math.max(1, window.innerHeight);
    var dur = Math.max(520, Math.min(900, 680 * span));
    var t0 = performance.now();

    /* Rete di sicurezza: un tetto assoluto oltre il quale si torna
       comunque armati, qualunque cosa stia facendo la rotella. Non
       viene mai azzerato dagli eventi, ed è ciò che rende impossibile
       il blocco — se un browser mandasse code inerziali infinite, al
       massimo si aspetta questo tempo, non per sempre. */
    clearTimeout(guardTimer);
    guardTimer = setTimeout(function () { armed = true; }, dur + 300);

    (function step(now) {
      if (mine !== tweenId) return;  // un gesto nuovo ha preso il comando

      var p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, from + dist * easeOutQuart(p));

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        animating = false;
        rearmSoon();
      }
    })(t0);
  }

  function go(dir) {
    if (!armed) return;

    // Se non si sta animando, la posizione vera comanda sull'indice:
    // la barra di scorrimento, la ricerca nella pagina o un'ancora
    // possono aver spostato la pagina alle nostre spalle. Senza questo
    // il primo gesto dopo tornerebbe indietro invece di proseguire.
    if (!animating) index = nearest(window.scrollY);

    var next = index + dir;
    if (next < 0 || next >= stops.length) return;

    index = next;
    armed = false;
    tweenTo(stops[index]);
  }

  function goTo(i) {
    i = Math.max(0, Math.min(stops.length - 1, i));
    index = i;
    armed = false;
    tweenTo(stops[index]);
  }

  /* Il riarmo non aspetta la fine dell'animazione: se il gesto
     precedente è finito e ne arriva uno nuovo, quello prende il
     comando a metà strada. È ciò che rende reattivo lo scorrimento
     veloce invece di accodare gesti che si sentono in ritardo.

     Attenzione: questo timer va rimandato SOLO dagli eventi sopra
     STRONG. Rimandarlo a ogni evento — coda inerziale compresa — è
     esattamente ciò che blocca il modulo: dopo un preventDefault()
     macOS manda inerzia per due o tre secondi, e il riarmo non
     arriverebbe mai finché il dito continua a sfiorare il trackpad. */
  function rearmSoon() {
    clearTimeout(quietTimer);
    quietTimer = setTimeout(function () { armed = true; }, QUIET);
  }

  /* ==========================================================
     GESTI
     ========================================================== */
  function onWheel(e) {
    if (e.ctrlKey) return;           // pinch-to-zoom: non si tocca
    e.preventDefault();

    // Sotto soglia è coda inerziale: non fa scorrere e, soprattutto,
    // non rimanda il riarmo. Lasciarle rimandare il riarmo è ciò che
    // congelava il modulo finché non si staccavano le mani.
    if (Math.abs(e.deltaY) < STRONG) return;

    rearmSoon();

    if (!armed) return;

    go(e.deltaY > 0 ? 1 : -1);
  }

  /* Il dito è l'unico gesto che non ha una coda inerziale da
     filtrare: si guarda dove parte e dove finisce, e in mezzo non
     succede niente. Una strisciata, una fermata — anche dentro una
     sezione lunga, che di fermate ne ha più d'una.

     Due dita non sono uno scorrimento ma un ingrandimento, e quello
     resta del browser: chi ha bisogno di avvicinare il cartamodello
     o una scritta piccola deve poterlo fare. Il flag serve perché a
     dita alzate una per volta il conteggio di touches scende, e
     senza memoria l'ultimo dito che si stacca sembrerebbe l'inizio
     di una strisciata. */
  function onTouchStart(e) {
    if (e.touches.length > 1) { pinching = true; return; }
    pinching = false;
    touchY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (pinching || e.touches.length > 1) { pinching = true; return; }
    e.preventDefault();
  }

  function onTouchEnd(e) {
    if (pinching) { pinching = e.touches.length > 0; return; }

    var t = e.changedTouches[0];
    if (!t) return;

    var dy = touchY - t.clientY;
    if (Math.abs(dy) > SWIPE) go(dy > 0 ? 1 : -1);
  }

  function onKey(e) {
    var t = e.target;
    var tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;

    switch (e.key) {
      case 'ArrowDown': case 'PageDown':
        e.preventDefault(); go(1); break;
      case 'ArrowUp': case 'PageUp':
        e.preventDefault(); go(-1); break;
      case ' ':
        e.preventDefault(); go(e.shiftKey ? -1 : 1); break;
      case 'Home':
        e.preventDefault(); goTo(0); break;
      case 'End':
        e.preventDefault(); goTo(stops.length - 1); break;
    }
  }

  /* I collegamenti interni diventano salti fra fermate, non
     scorrimenti nativi: senza questo l'aggancio e il menu si
     contraddirebbero a vicenda. */
  function onClick(e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;

    var id = a.getAttribute('href').slice(1);

    // I segnaposto del piede sono href="#": lasciandoli passare, il
    // browser li tratta come "torna in cima" e sparano l'utente
    // all'apertura. Finché non hanno una destinazione vera, non
    // devono fare niente.
    if (!id) { e.preventDefault(); return; }

    var el = document.getElementById(id);
    if (!el) return;

    e.preventDefault();
    goTo(stopFor(el));
  }

  /* ==========================================================
     ARRIVO CON UN'ANCORA
     "../#progetto" dal menu di una pagina interna. Il browser ci
     ha già portato a un'altezza sua, calcolata sul documento
     disteso, che con le sezioni agganciate non coincide con
     nessuna fermata: si atterra in mezzo a due strati.

     Ci si mette sulla fermata giusta di colpo, senza viaggio: lo
     scatto morbido è la risposta a un gesto, e qui su questa
     pagina un gesto non c'è ancora stato.

     Va rifatto a ogni misura — al load e a caratteri pronti —
     perché è lì che le fermate si spostano di qualche decina di
     pixel. Ma solo se nel frattempo nessuno ha scorso: si ricorda
     dove si era atterrati, e se la pagina non è più lì vuol dire
     che il lettore ha preso il comando e non si tocca più niente.
     ========================================================== */
  var hashY = -1;

  function landOnHash() {
    var id = location.hash.slice(1);
    if (!id || !stops.length) return;

    if (hashY >= 0 && Math.abs(window.scrollY - hashY) > 4) return;

    var el = document.getElementById(id);
    if (!el) return;

    index = stopFor(el);
    hashY = stops[index];
    window.scrollTo(0, hashY);
  }

  /* Chi naviga da tastiera può portare il fuoco dentro una
     sezione coperta: la si porta in vista, altrimenti si
     starebbe scrivendo dentro qualcosa che non si vede. */
  function onFocusIn(e) {
    var host = e.target.closest ? e.target.closest(SELECTOR) : null;
    if (!host || animating) return;

    /* Ma se quello che ha preso il fuoco si vede già, non si muove
       niente. Sul telefono il fuoco su un campo arriva col dito che
       lo ha appena toccato: tirare la pagina proprio lì porterebbe
       via il campo da sotto le dita, ed è il modo più veloce di
       rendere incompilabile un modulo. */
    var r = e.target.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= window.innerHeight) return;

    var i = stopFor(host);

    /* Dentro una sezione lunga la fermata della sezione è quella in
       cui siamo già: al fuoco sceso sotto il taglio non serve
       tornare in cima alla sezione, serve la schermata dopo. */
    if (i === index) go(r.top < 0 ? -1 : 1);
    else goTo(i);
  }

  /* ==========================================================
     ACCENSIONE
     ========================================================== */
  function enable() {
    if (enabled) return;
    enabled = true;

    /* È questa riga ad alzare il sipario: il foglio di stile impila
       le sezioni solo sotto .curtain, perché senza qualcuno che
       misuri le altezze una sezione più lunga dello schermo si
       taglierebbe il fondo. Se questo file non gira, le sezioni
       scorrono in fila e la pagina si legge lo stesso. */
    document.documentElement.classList.add('curtain');

    measure();
    landOnHash();

    // lo scorrimento morbido del CSS combatterebbe con il nostro
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.style.overscrollBehaviorY = 'none';

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    document.addEventListener('focusin', onFocusIn);
  }

  var resizeTimer = null;
  var lastW = window.innerWidth;

  window.addEventListener('resize', function () {
    if (!enabled) return;

    /* Sul telefono quasi nessun ridimensionamento è un
       ridimensionamento. La tastiera di sistema che si apre, la
       barra degli indirizzi che si ritira: la finestra cambia
       altezza mentre la pagina è la stessa. Rimisurare lì dentro
       significa spostare la pagina mentre si sta scrivendo, cioè
       portare via il campo da sotto le dita.

       La larghezza è il segnale onesto: una rotazione la cambia,
       una tastiera no. Finché il fuoco è in un campo e la larghezza
       tiene, non si tocca niente. */
    var w = window.innerWidth;
    var sameWidth = (w === lastW);
    var el = document.activeElement;
    var typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

    lastW = w;
    if (typing && sameWidth) return;

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      measure();
      window.scrollTo(0, stops[index]);   // si resta sulla stessa fermata
    }, 180);
  });

  // Le fermate dipendono dall'altezza reale della pagina, che non è
  // ancora quella definitiva quando il DOM è pronto: le immagini e
  // soprattutto i caratteri (font-display: swap) la fanno cambiare
  // dopo. Misurare una volta sola porterebbe fermate sbagliate di
  // qualche decina di pixel, e lo sbaglio si sente salendo, perché
  // l'errore si accumula verso il fondo del documento.
  window.addEventListener('load', function () {
    if (!enabled) return;
    measure();
    landOnHash();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (!enabled) return;
      measure();
      landOnHash();
    });
  }

  /* Non si spegne mai una volta acceso: se la finestra si stringe
     dietro al cartello non c'è niente da smontare — il sito è già
     tolto di mezzo — mentre allargandola il modulo deve partire
     senza chiedere un ricaricamento. */
  function sync() { if (wideMQ.matches) enable(); }

  if (wideMQ.addEventListener) wideMQ.addEventListener('change', sync);
  else if (wideMQ.addListener) wideMQ.addListener(sync);

  sync();
})();

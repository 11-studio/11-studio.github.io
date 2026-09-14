/* ============================================================
   FERRAGATTI — comportamenti di pagina
   Intestazione (comparsa + tono), rivelazioni, newsletter.
   ============================================================ */
(function () {
  'use strict';

  /* ==========================================================
     LETTERE
     Le parole che rispondono al puntatore vengono spezzate in
     lettere. Di ogni lettera ne servono due, e qui se ne scrive una
     sola: .lt-a è quella che si legge, la copia che scende dall'alto
     la disegna il foglio di stile da data-c, con uno pseudo-elemento.

     Scritta due volte davvero, la seconda copia finirebbe nel testo
     della pagina: la voce «Progetto» varrebbe «PPrrooggeettttoo» per
     il copia-incolla e per il trova-nella-pagina. Da attributo non
     succede — content: attr() disegna e basta, non aggiunge testo al
     documento.

     L'indice della lettera va in --i. Il resto — quanto scendono, con
     che ritardo, in che verso — sta nel foglio di stile, sezione
     LETTERE A CASCATA: qui si decide solo quali parole si spezzano.

     Sta prima di tutto il resto, e non dopo la guardia sulla barra
     qui sotto: le voci di menu, gli inviti e il piede ci sono anche
     dove un'intestazione non c'è.

     Si spezza solo chi contiene testo semplice. Un elemento con
     dentro dell'altro — un segno, un corsivo, una sigla — si lascia
     stare: rifarlo lettera per lettera vorrebbe dire ricostruire
     l'albero, e per un cenno di quattro pixel non vale la spesa.

     Gli spazi restano spazi veri e non lettere: così la parola può
     ancora andare a capo dove andava prima, e il conto dell'indice
     non salta perché avanza su tutti i caratteri.
     ========================================================== */
  var WORDS = '.nav-links a, .cta, .foot-col a';

  Array.prototype.forEach.call(document.querySelectorAll(WORDS), function (el) {
    if (el.children.length) return;

    var text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;

    var wrap = document.createElement('span');
    wrap.className = 'lts';
    wrap.setAttribute('aria-hidden', 'true');

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);

      if (ch === ' ') {
        wrap.appendChild(document.createTextNode(' '));
        continue;
      }

      var s = document.createElement('span');
      s.className = 'lt';
      s.style.setProperty('--i', String(i));
      s.setAttribute('data-c', ch);

      var a = document.createElement('span');
      a.className = 'lt-a';
      a.textContent = ch;

      s.appendChild(a);
      wrap.appendChild(s);
    }

    // il nome accessibile lo dà l'attributo, non più il contenuto
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', text);

    el.textContent = '';
    el.appendChild(wrap);
  });

  /* ==========================================================
     CERCA
     L'icona apre il campo, non una pagina: qui c'è solo l'andirivieni
     — comparsa, fuoco, e le tre uscite (Esc, clic fuori, la lente di
     nuovo). Il motore di ricerca vero arriva insieme al catalogo;
     l'invio del modulo per ora non ha dove andare e resta fermo,
     come già la lettera in fondo alla pagina.

     Sta prima della sezione INTESTAZIONE qui sotto perché quella,
     al primo scorrimento, chiama sizeSearchForm per rifare la
     misura del campo se è aperto: deve trovarla già definita.
     ========================================================== */
  var searchWrap = document.querySelector('.nav-search');
  var searchToggle = searchWrap && searchWrap.querySelector('.nav-search-toggle');
  var searchForm = searchWrap && searchWrap.querySelector('.nav-search-form');
  var searchClose = searchWrap && searchWrap.querySelector('.nav-search-close');
  var searchInput = searchWrap && searchWrap.querySelector('input');
  var navLinksEl = document.querySelector('.nav-links');
  var navEl = document.getElementById('nav');
  var sizeSearchForm = function () {};

  if (searchWrap && searchToggle && searchForm && searchInput) {
    // Alla riga bassa lente e voci stanno sullo stesso rigo: il
    // campo si allunga fino al primo link e lo copre tutto, misura
    // rifatta a ogni apertura, scorrimento o ridimensionamento
    // perché cambia da uno stato all'altro della barra. In cima le
    // voci sono un rigo sotto, fuori da quello dov'è la lente: lì
    // non c'è nulla da coprire e il campo tiene la sua misura fissa
    // del foglio di stile, invece di allungarsi fin sotto il
    // marchio senza motivo.
    sizeSearchForm = function () {
      if (!navLinksEl || !navEl || !navEl.classList.contains('scrolled')) {
        searchForm.style.width = '';
        return;
      }
      var linksRect = navLinksEl.getBoundingClientRect();
      var toggleRect = searchToggle.getBoundingClientRect();
      var w = toggleRect.right - linksRect.left;
      searchForm.style.width = w > 0 ? w + 'px' : '';
    };

    var openSearch = function () {
      sizeSearchForm();
      searchWrap.classList.add('open');
      searchToggle.setAttribute('aria-expanded', 'true');
      searchInput.focus();
    };

    var closeSearch = function (returnFocus) {
      searchWrap.classList.remove('open');
      searchForm.style.width = '';
      searchToggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) searchToggle.focus();
    };

    searchToggle.addEventListener('click', function () {
      if (searchWrap.classList.contains('open')) {
        closeSearch(false);
      } else {
        openSearch();
      }
    });

    if (searchClose) {
      searchClose.addEventListener('click', function () {
        closeSearch(true);
      });
    }

    searchForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
    });

    searchInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeSearch(true);
    });

    // un clic fuori dal campo lo richiude, come una tendina
    document.addEventListener('click', function (ev) {
      if (!searchWrap.classList.contains('open')) return;
      if (searchWrap.contains(ev.target)) return;
      closeSearch(false);
    });

    window.addEventListener('resize', function () {
      if (searchWrap.classList.contains('open')) sizeSearchForm();
    });
  }

  /* ==========================================================
     INTESTAZIONE
     Due cose cambiano allo scorrimento, insieme ma per ragioni
     diverse.

     La FORMA collassa al primo scorrimento: da due righe alte e
     quasi trasparenti a una riga sola, bassa, col marchio a
     sinistra e le voci a destra, su un vetro vero. La soglia è
     bassa apposta — 16px, un gesto minimo — perché il cambio deve
     sembrare la risposta allo scroll, non un evento a metà
     pagina. La classe è "scrolled", e il suo aspetto lo decide
     solo il CSS: qui si governa soltanto quando applicarla.

     Il TONO segue invece la sezione che sta passando sotto la
     barra, esattamente come già faceva prima di questa barra a
     due stati — stessa lettura del punto medio, stesso ordine a
     ritroso, spiegati per esteso nel commento della sezione I DUE
     TONI in style.css. Serve perché il testo (--fg) e l'alone
     (--nav-halo) sul chiaro sono l'opposto di quelli sul buio: un
     bianco fisso sopra un fondo chiaro sparirebbe.
     ========================================================== */
  var nav = document.getElementById('nav');

  if (nav) {
    var toned = Array.prototype.slice
      .call(document.querySelectorAll('[data-tone]'))
      .filter(function (el) {
        return el !== nav;
      });

    var navTicking = false;

    function syncNav() {
      navTicking = false;
      nav.classList.toggle('scrolled', window.scrollY > 16);

      // la barra bassa mette le voci altrove che la barra alta: se
      // il campo di ricerca è aperto mentre lo stato cambia, la sua
      // misura (fatta all'apertura) resterebbe quella di prima
      if (searchWrap && searchWrap.classList.contains('open')) sizeSearchForm();

      var line = nav.offsetHeight * 0.75;
      for (var i = toned.length - 1; i >= 0; i--) {
        var r = toned[i].getBoundingClientRect();
        if (r.top <= line && r.bottom > line) {
          var tone = toned[i].getAttribute('data-tone');
          if (nav.getAttribute('data-tone') !== tone) {
            nav.setAttribute('data-tone', tone);
          }
          break;
        }
      }
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!navTicking) {
          navTicking = true;
          requestAnimationFrame(syncNav);
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', syncNav);
    syncNav();
  }

  /* ==========================================================
     SEGNAPOSTO
     I collegamenti ancora senza destinazione sono href="#": i
     riferimenti del piede, l'invito alla campagna, i pezzi del
     giornale che non sono scritti. Lasciandoli passare il browser
     li tratta come "torna in cima" e spara il lettore in cima alla
     pagina, che è il modo più veloce di far sembrare rotto un
     collegamento che semplicemente non c'è ancora.

     Sulla home questo lo faceva già snap.js, che intercetta tutti
     i collegamenti interni. Le pagine interne snap.js non lo
     caricano, quindi la guardia sta qui, che è il file che gira
     ovunque. Sulla home le due si sovrappongono senza darsi
     fastidio: fanno la stessa cosa.
     ========================================================== */
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('a[href="#"]') : null;
    if (a) ev.preventDefault();
  });

  /* ==========================================================
     RIVELAZIONI
     Solo opacità: nessuna traslazione, nessun rimbalzo.
     ========================================================== */
  var risers = document.querySelectorAll('.rise');

  if ('IntersectionObserver' in window) {
    var rev = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -15% 0px' });

    Array.prototype.forEach.call(risers, function (el) { rev.observe(el); });
  } else {
    Array.prototype.forEach.call(risers, function (el) { el.classList.add('in'); });
  }

  /* ==========================================================
     STORIE
     La pista scorre con lo scroll nativo, ma sulla home la rotella
     è già presa da snap.js: i due tasti restano l'unico gesto che
     funziona ovunque, e muovono la pista di una schermata di carte
     alla volta invece che di un pixel fisso, così la carta dopo
     arriva sempre intera qualunque sia la larghezza.
     ========================================================== */
  var tracks = document.querySelectorAll('.stories-track');

  Array.prototype.forEach.call(tracks, function (track) {
    var nav = track.nextElementSibling;
    var prev = nav && nav.querySelector('.stories-prev');
    var next = nav && nav.querySelector('.stories-next');
    if (!prev || !next) return;

    prev.addEventListener('click', function () {
      track.scrollBy({ left: -track.clientWidth * 0.86, behavior: 'smooth' });
    });
    next.addEventListener('click', function () {
      track.scrollBy({ left: track.clientWidth * 0.86, behavior: 'smooth' });
    });
  });

  /* ==========================================================
     LETTERA
     Nessun invio: mostra solo la conferma. Per collegarla
     davvero, sostituire il corpo con una fetch() verso il
     proprio servizio email o l'endpoint Shopify.

     I moduli sono due — la sezione e il piede — e non sono
     cablati per nome: vale ogni form.news-form, e il campo e la
     conferma si cercano a partire dal modulo stesso. Aggiungerne
     un terzo non richiede toccare questo file.
     ========================================================== */
  var forms = document.querySelectorAll('form.news-form');

  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var input = form.querySelector('input[type="email"]');
      if (!input) return;
      if (!input.value || input.value.indexOf('@') < 1) { input.focus(); return; }

      form.classList.add('sent');

      // la conferma è il fratello successivo: è lo stesso legame
      // che usa il foglio di stile per mostrarla (form.sent ~ .news-done)
      var done = form.parentNode.querySelector('.news-done');
      if (done) { done.setAttribute('tabindex', '-1'); done.focus(); }
    });
  });
})();

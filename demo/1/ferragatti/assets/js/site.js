/* ============================================================
   FERRAGATTI — comportamenti di pagina
   Intestazione (comparsa + tono), rivelazioni, newsletter.
   ============================================================ */
(function () {
  'use strict';

  /* ==========================================================
     INTESTAZIONE
     C'è dall'inizio e prende il tono della sezione che le passa
     sotto: non c'è nessuna lista cablata, basta che la sezione
     dichiari data-tone="light|dark".

     Sull'apertura porta la classe "bare": la lastra di vetro non
     si disegna e le sue parole restano appoggiate al clip. Passata
     la prima schermata il vetro arriva, perché da lì in poi sotto
     scorre la pagina e serve qualcosa che separi.

     Ma "bare" ha senso solo dove c'è un'apertura a tutto schermo
     sotto cui stare: le pagine interne cominciano con del testo, e
     lì la barra deve essere di vetro dal primo pixel. Il segnale è
     la presenza della .hero, non il nome del file — così una
     pagina nuova non deve dichiarare niente.
     ========================================================== */
  var nav = document.getElementById('nav');
  if (!nav) return;

  var hero = document.querySelector('.hero');

  var toned = Array.prototype.slice.call(document.querySelectorAll('[data-tone]'))
    .filter(function (el) { return el !== nav; });

  var ticking = false;

  function syncNav() {
    ticking = false;

    if (hero) {
      if (window.scrollY > window.innerHeight * 0.62) nav.classList.remove('bare');
      else nav.classList.add('bare');
    }

    // A ritroso, non in avanti: col sipario più sezioni sono
    // agganciate in cima nello stesso momento e si sovrappongono.
    // Quella che conta è l'ultima nel documento, perché è quella
    // disegnata sopra le altre — cioè quella che si vede davvero.
    var line = nav.offsetHeight * 0.75;
    for (var i = toned.length - 1; i >= 0; i--) {
      var r = toned[i].getBoundingClientRect();
      if (r.top <= line && r.bottom > line) {
        var tone = toned[i].getAttribute('data-tone');
        if (nav.getAttribute('data-tone') !== tone) nav.setAttribute('data-tone', tone);
        break;
      }
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(syncNav); }
  }, { passive: true });

  window.addEventListener('resize', syncNav);
  syncNav();

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

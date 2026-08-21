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
     L'iscrizione, collegata davvero.

     I moduli sono due — la sezione «La lettera» in home e quello
     dello store — e non sono cablati per nome: vale ogni
     form.news-form, e il campo, la conferma e l'errore si cercano
     a partire dal modulo stesso. Aggiungerne un terzo non
     richiede toccare questo file.

     ── Il modulo funziona anche senza JavaScript ──
     Ha action e method veri: senza questo file il browser invia
     la pagina e l'API risponde con un redirect a /iscrizione/.
     Quel che si aggiunge qui è solo il non ricaricare la pagina,
     e i tre stati che una pagina ricaricata non può mostrare —
     invio in corso, errore, conferma sul posto.

     Per questo l'indirizzo dell'API non è scritto qui ma si legge
     da form.action: un valore solo, nel markup, usato da tutte e
     due le strade. Se un domani cambia, cambia in un posto.

     ── La cortesia dei tre stati ──
     Un campo che non risponde per due secondi sembra rotto, e chi
     lo crede rotto preme di nuovo. Quindi: si disattiva il
     pulsante, si dice «un momento», e si riaccende comunque vada.
     ========================================================== */
  var forms = document.querySelectorAll('form.news-form');

  Array.prototype.forEach.call(forms, function (form) {
    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector('button[type="submit"]');
    var wrap = form.parentNode;
    var done = wrap.querySelector('.news-done');
    var fail = wrap.querySelector('.news-error');

    if (!input || !button) return;

    var etichetta = button.textContent.trim();

    function errore(testo) {
      form.classList.remove('sending');
      button.disabled = false;
      button.textContent = etichetta;

      if (fail) {
        fail.textContent = testo;
        form.classList.add('failed');
        // Il messaggio prende il fuoco: chi usa un lettore di
        // schermo altrimenti non saprebbe che è comparso, e
        // resterebbe fermo su un campo che sembra a posto.
        fail.setAttribute('tabindex', '-1');
        fail.focus();
      }
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      form.classList.remove('failed');

      var valore = input.value.trim();
      // Controllo volutamente grossolano: la validazione vera la fa
      // il server, che è l'unico posto in cui possa contare. Qui si
      // intercetta solo il refuso evidente, per non far fare un
      // giro di rete a una stringa senza chiocciola.
      if (!valore || valore.indexOf('@') < 1 || valore.indexOf('.') < 0) {
        errore('Controlla l\'indirizzo: manca qualcosa.');
        input.focus();
        return;
      }

      if (!form.querySelector('input[name="consent"]').checked) {
        errore('Serve la spunta del consenso per poterti scrivere.');
        return;
      }

      form.classList.add('sending');
      button.disabled = true;
      button.textContent = 'Un momento';

      var dati = {};
      Array.prototype.forEach.call(
        form.querySelectorAll('input[name]'),
        function (el) {
          dati[el.name] = el.type === 'checkbox' ? el.checked : el.value;
        }
      );
      dati.email = valore;

      fetch(form.action, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // È questa intestazione a far rispondere JSON all'API
          // invece di un redirect. Il modulo senza JavaScript non
          // la manda, e riceve il redirect: stessa rotta, due
          // dialetti, nessun ramo da mantenere sul server.
          accept: 'application/json'
        },
        body: JSON.stringify(dati)
      })
        .then(function (r) {
          return r.json().then(function (corpo) {
            return { ok: r.ok && corpo.ok, corpo: corpo };
          });
        })
        .then(function (esito) {
          if (!esito.ok) {
            errore(esito.corpo.message || 'Non ha funzionato. Riprova fra poco.');
            return;
          }

          form.classList.add('sent');

          // la conferma è il fratello successivo: è lo stesso legame
          // che usa il foglio di stile per mostrarla (form.sent ~ .news-done)
          if (done) { done.setAttribute('tabindex', '-1'); done.focus(); }
        })
        .catch(function () {
          // Rete caduta, API spenta, oppure la pagina è stata
          // aperta con un doppio clic da disco — in cui l'API non
          // c'è e non può esserci. In tutti e tre i casi la cosa
          // onesta è dirlo e riaccendere il pulsante, non lasciare
          // «Un momento» acceso per sempre.
          errore('Connessione non riuscita. Riprova fra poco.');
        });
    });
  });
})();

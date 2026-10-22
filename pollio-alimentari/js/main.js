/* Alimentari Pollio — menu, orari, listino demo, carrello, recensioni */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const euro = (n) => '€ ' + n.toFixed(2).replace('.', ',');

  // Titolo dell'hero: ogni parola sale dalla sua riga
  const h1 = $('.hero h1');
  h1.setAttribute('aria-label', h1.textContent);
  h1.innerHTML = h1.textContent.trim().split(/\s+/)
    .map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`)
    .join(' ');
  h1.classList.add('is-split');


  /* ---------- Orari ---------- */
  // Indice 0 = domenica, come Date.getDay()
  const HOURS = [
    { day: 'Domenica',  slots: [['10:00', '13:30'], ['18:00', '20:30']] },
    { day: 'Lunedì',    slots: [['09:00', '13:30'], ['17:00', '20:30']] },
    { day: 'Martedì',   slots: [['09:00', '13:30'], ['17:00', '20:30']] },
    { day: 'Mercoledì', slots: [['09:00', '13:30'], ['17:00', '20:30']] },
    { day: 'Giovedì',   slots: [['09:00', '13:30'], ['17:00', '20:30']] },
    { day: 'Venerdì',   slots: [['09:00', '13:30'], ['17:00', '20:30']] },
    { day: 'Sabato',    slots: [['09:00', '13:30'], ['17:00', '20:30']] },
  ];
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (t) => t.replace(/^0/, '');
  const range = ([a, b]) => `${fmt(a)}–${fmt(b)}`;

  // Ora attuale ad Avezzano, indipendentemente dal fuso di chi visita
  function romeNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, min: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
  }

  function renderHours() {
    const { day, min } = romeNow();
    const today = HOURS[day];

    // Tabella da lunedì a domenica
    $('#hoursTable').innerHTML = [1, 2, 3, 4, 5, 6, 0].map((i) => {
      const h = HOURS[i];
      return `<tr class="${i === day ? 'is-today' : ''}">
        <th scope="row">${h.day}</th><td>${range(h.slots[0])}</td><td>${range(h.slots[1])}</td>
      </tr>`;
    }).join('');

    const current = today.slots.find(([a, b]) => min >= toMin(a) && min < toMin(b));
    const next = today.slots.find(([a]) => min < toMin(a));
    let status, detail;
    if (current) {
      status = 'Aperto';
      detail = `fino alle ${fmt(current[1])}`;
    } else if (next) {
      status = 'Chiuso';
      detail = `riapre alle ${fmt(next[0])}`;
    } else {
      status = 'Chiuso';
      detail = `domani apre alle ${fmt(HOURS[(day + 1) % 7].slots[0][0])}`;
    }

    $$('[data-today]').forEach((el) => {
      el.dataset.open = String(Boolean(current));
      $('[data-today-status]', el).textContent = status;
      $('[data-today-hours]', el).textContent = `· ${detail}`;
    });
  }

  renderHours();
  setInterval(renderHours, 60_000);

  /* ---------- Listino demo ---------- */
  const CATS = {
    salumi: 'Prosciutti e salumi', formaggi: 'Formaggi', vini: 'Vini',
    dispensa: 'Dispensa abruzzese', forno: 'Pane e forno',
  };

  const PRODUCTS = [
    { id: 'crudo', cat: 'salumi', name: 'Prosciutto crudo tagliato a mano', desc: 'Oltre venti mesi di stagionatura, affettato al coltello al momento.', price: 4.9, unit: '100 g' },
    { id: 'ventricina', cat: 'salumi', name: 'Ventricina abruzzese', desc: 'Morbida e piccante, da spalmare sul pane caldo.', price: 3.8, unit: '100 g' },
    { id: 'fegato', cat: 'salumi', name: 'Salsiccia di fegato aquilana', desc: 'Tradizione delle nostre montagne, dolce o piccante.', price: 3.2, unit: '100 g' },
    { id: 'campotosto', cat: 'salumi', name: 'Mortadella di Campotosto', desc: 'Piccola e compatta, con il cuore di lardo. Dai Monti della Laga.', price: 9.5, unit: 'pezzo' },
    { id: 'pecorino', cat: 'formaggi', name: 'Pecorino di Farindola', desc: 'Latte crudo di pecora e caglio di maiale, secondo l’antica ricetta.', price: 3.9, unit: '100 g' },
    { id: 'erborinato', cat: 'formaggi', name: 'Erborinato al cioccolato', desc: 'Dolce, cremoso e intenso. Da provare con un distillato.', price: 4.2, unit: '100 g' },
    { id: 'caciocavallo', cat: 'formaggi', name: 'Caciocavallo stagionato', desc: 'Pasta filata delle montagne abruzzesi, dal sapore deciso.', price: 2.6, unit: '100 g' },
    { id: 'montepulciano', cat: 'vini', name: "Montepulciano d'Abruzzo DOC", desc: 'Rosso pieno e generoso, per la tavola di tutti i giorni.', price: 8.5, unit: '75 cl' },
    { id: 'cerasuolo', cat: 'vini', name: "Cerasuolo d'Abruzzo DOC", desc: 'Il rosato della nostra regione, fresco e fruttato.', price: 9.0, unit: '75 cl' },
    { id: 'trebbiano', cat: 'vini', name: "Trebbiano d'Abruzzo DOC", desc: 'Bianco delicato, ideale con i formaggi freschi.', price: 7.5, unit: '75 cl' },
    { id: 'zafferano', cat: 'dispensa', name: "Zafferano dell'Aquila DOP", desc: "In stimmi, dall'altopiano di Navelli.", price: 12.0, unit: '0,5 g' },
    { id: 'lenticchie', cat: 'dispensa', name: 'Lenticchie di Santo Stefano di Sessanio', desc: 'Piccole e saporite, si cuociono senza ammollo.', price: 6.5, unit: '500 g' },
    { id: 'patate', cat: 'dispensa', name: 'Patate del Fucino IGP', desc: 'Da dove tutto è cominciato, più di cento anni fa.', price: 2.4, unit: '1 kg' },
    { id: 'confetti', cat: 'dispensa', name: 'Confetti di Sulmona', desc: 'Mandorla d’Avola, per le occasioni importanti.', price: 7.0, unit: '250 g' },
    { id: 'pane', cat: 'forno', name: 'Pagnotta di grano Solina', desc: 'Lievito madre e grano antico abruzzese.', price: 4.5, unit: '1 kg' },
    { id: 'parrozzo', cat: 'forno', name: 'Parrozzo', desc: 'Il dolce abruzzese di mandorle e cioccolato.', price: 13.0, unit: '500 g' },
  ];

  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  let activeCat = 'tutti';

  function renderProducts() {
    const cats = activeCat === 'tutti' ? Object.keys(CATS) : [activeCat];
    $('#products').innerHTML = cats.map((cat) => `
      <section class="product-group">
        <h3>${CATS[cat]}</h3>
        <ul class="product-group__list">
          ${PRODUCTS.filter((p) => p.cat === cat).map((p) => `
            <li class="product">
              <span class="product__name">${p.name}</span>
              <span class="product__price">${euro(p.price)}</span>
              <span class="product__desc">${p.desc}</span>
              <span class="product__unit">${p.unit}</span>
              <button class="product__add" data-add="${p.id}" aria-label="Aggiungi ${p.name} al carrello">Aggiungi</button>
            </li>`).join('')}
        </ul>
      </section>`).join('');
  }

  function setCategory(cat) {
    activeCat = cat;
    $$('.tab').forEach((t) => {
      const on = t.dataset.cat === cat;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-pressed', String(on));
    });
    renderProducts();
    const list = $('#products');
    list.classList.remove('is-switching');
    void list.offsetWidth;
    list.classList.add('is-switching');
  }

  $$('.tab').forEach((t) => t.addEventListener('click', () => setCategory(t.dataset.cat)));
  $$('[data-jump-cat]').forEach((a) => a.addEventListener('click', () => setCategory(a.dataset.jumpCat)));
  renderProducts();

  /* ---------- Carrello ---------- */
  const STORE_KEY = 'pollio-cart-demo';
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { cart = {}; }
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch { /* demo */ } };

  const cartTotal = () => Object.entries(cart).reduce((s, [id, q]) => s + (byId[id]?.price || 0) * q, 0);
  const cartCount = () => Object.values(cart).reduce((s, q) => s + q, 0);

  function renderCart() {
    const ids = Object.keys(cart).filter((id) => byId[id]);
    $('#cart').classList.toggle('is-empty', ids.length === 0);
    $('#cartItems').innerHTML = ids.map((id) => {
      const p = byId[id], q = cart[id];
      return `<li class="cart-item">
        <h3>${p.name}</h3>
        <span class="cart-item__price">${euro(p.price * q)}</span>
        <span class="cart-item__unit">${euro(p.price)} / ${p.unit}</span>
        <div class="qty">
          <button data-dec="${id}" aria-label="Togli uno">−</button>
          <span aria-label="Quantità">${q}</span>
          <button data-inc="${id}" aria-label="Aggiungi uno">+</button>
        </div>
      </li>`;
    }).join('');
    $('#cartTotal').textContent = euro(cartTotal());
    $('#checkoutTotal').textContent = euro(cartTotal());
    $('#cartCount').textContent = cartCount();
  }

  function add(id, delta = 1) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    save();
    renderCart();
  }

  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      add(addBtn.dataset.add);
      addBtn.textContent = 'Aggiunto';
      addBtn.classList.add('is-added');
      setTimeout(() => { addBtn.textContent = 'Aggiungi'; addBtn.classList.remove('is-added'); }, 1400);
      toast(`${byId[addBtn.dataset.add].name} aggiunto al carrello`);
      if (!reduceMotion.matches) {
        $('#cartOpen').animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
          { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        );
      }
    }
    const inc = e.target.closest('[data-inc]');
    if (inc) add(inc.dataset.inc, 1);
    const dec = e.target.closest('[data-dec]');
    if (dec) add(dec.dataset.dec, -1);
  });

  renderCart();

  /* ---------- Pannelli: menu laterale e carrello ---------- */
  const scrim = $('#scrim');
  const menuBtn = $('#menuOpen');
  let openPanel = null, lastFocus = null;

  function open(panel) {
    if (openPanel) close(false);
    lastFocus = document.activeElement;
    openPanel = panel;
    scrim.hidden = false;
    requestAnimationFrame(() => scrim.classList.add('is-visible'));
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    if (panel.id === 'sidemenu') menuBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
    setTimeout(() => $('[data-close]', panel)?.focus({ preventScroll: true }), 60);
  }

  function close(restoreFocus = true) {
    if (!openPanel) return;
    openPanel.classList.remove('is-open');
    openPanel.setAttribute('aria-hidden', 'true');
    if (openPanel.id === 'sidemenu') menuBtn.setAttribute('aria-expanded', 'false');
    openPanel = null;
    scrim.classList.remove('is-visible');
    setTimeout(() => { if (!openPanel) scrim.hidden = true; }, 400);
    document.body.classList.remove('no-scroll');
    if (restoreFocus) lastFocus?.focus();
  }

  menuBtn.addEventListener('click', () => open($('#sidemenu')));
  $('#cartOpen').addEventListener('click', () => open($('#cart')));
  scrim.addEventListener('click', () => close());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openPanel) close(); });
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => close(false)));
  $$('.sidemenu a').forEach((a) => a.addEventListener('click', () => close(false)));

  /* ---------- Checkout demo ---------- */
  const dialog = $('#checkout');
  const form = $('#checkoutForm');
  const done = $('#checkoutDone');

  $('#checkoutOpen').addEventListener('click', () => {
    close(false);
    form.hidden = false;
    done.hidden = true;
    $('#formError').hidden = true;
    dialog.showModal();
  });
  $('#checkoutClose').addEventListener('click', () => dialog.close());
  $('#checkoutDoneClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = [form.nome, form.tel];
    const missing = fields.filter((f) => !f.value.trim());
    fields.forEach((f) => f.setAttribute('aria-invalid', String(missing.includes(f))));
    if (missing.length) {
      $('#formError').hidden = false;
      missing[0].focus();
      return;
    }
    cart = {};
    save();
    renderCart();
    form.reset();
    form.hidden = true;
    done.hidden = false;
    $('#checkoutDoneClose').focus();
  });

  /* ---------- Recensioni ---------- */
  const REVIEWS = [
    { text: 'Sembra di trovarsi in un luogo incantato. Tanti prodotti tipici che raccontano la storia di Avezzano e della Marsica. Da Pollio si va volentieri, perché lì si vive l’arte dello stare insieme.', author: 'Orietta' },
    { text: 'Il crudo tagliato a mano è spettacolare, ogni giorno una varietà diversa. Formaggi da ogni dove e un’ampia scelta di vini a prezzi ottimi.', author: 'Recensione Google' },
    { text: 'Qualitativamente eccellente dal pane ai formaggi, dai salumi ai vini. È come la bottega di una volta.', author: 'Recensione Google' },
    { text: 'Aperti il primo gennaio da veri lavoratori: cortesi, gentili e con prodotti eccezionali. Il vero alimentari di fiducia e qualità.', author: 'Recensione Google' },
    { text: 'Proprietario di una gentilezza assoluta e prodotti spettacolari, soprattutto del posto.', author: 'Recensione Google' },
  ];
  let reviewIndex = 0;

  function showReview(i, animate = true) {
    reviewIndex = (i + REVIEWS.length) % REVIEWS.length;
    const fig = $('#review');
    const apply = () => {
      $('#reviewText').textContent = `«${REVIEWS[reviewIndex].text}»`;
      $('#reviewAuthor').textContent = REVIEWS[reviewIndex].author;
      $('#reviewCount').textContent = `${reviewIndex + 1} / ${REVIEWS.length}`;
      fig.classList.remove('is-fading');
    };
    if (!animate) return apply();
    fig.classList.add('is-fading');
    setTimeout(apply, 300);
  }
  $('#reviewPrev').addEventListener('click', () => showReview(reviewIndex - 1));
  $('#reviewNext').addEventListener('click', () => showReview(reviewIndex + 1));
  showReview(0, false);

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2400);
  }

  /* ---------- Animazioni ---------- */
  // Voci del menu laterale, una dopo l'altra
  [...$$('.sidemenu__nav a'), $('.sidemenu__cats'), $('.sidemenu__foot')]
    .forEach((el, i) => el.style.setProperty('--i', i));

  // Elementi che compaiono allo scorrimento; nei gruppi entrano sfalsati
  const reveal = (sel, group = false) => $$(sel).forEach((el, i) => {
    el.dataset.reveal = '';
    if (group) el.style.setProperty('--i', i % 4);
  });
  reveal('.intro__text');
  reveal('.intro__sign');
  reveal('.section-head');
  reveal('.timeline li', true);
  reveal('.story__quote');
  reveal('.shopfloor__text > :not(.departments)', true);
  reveal('.departments > div', true);
  reveal('.tabs');
  reveal('.reviews > *', true);
  reveal('.hours');
  reveal('.visit__info > div', true);
  reveal('.footer__brand');
  $$('.timeline, .departments').forEach((el) => { el.dataset.draw = ''; });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('[data-reveal], [data-draw], .shopfloor__photo').forEach((el) => io.observe(el));

  $('#year').textContent = new Date().getFullYear();
})();

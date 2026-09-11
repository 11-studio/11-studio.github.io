/*
    ============================================
    MAIN.JS — Comportamenti del browser
    ============================================

    Nessuna dipendenza. Tutto è progressivo: la pagina funziona anche
    senza JavaScript, questo file aggiunge:
    - menu laterale
    - header compatto allo scroll + barra di avanzamento lettura
    - pulsanti condividi (copia link, Web Share API)
    - newsletter (invio in background)
    - avviso cookie, torna su, data corrente
*/
(function () {
  "use strict";

  var body = document.body;

  // --- Menu laterale ------------------------------------------------------
  var menu = document.getElementById("siteMenu");
  var backdrop = document.querySelector(".menu-backdrop");
  var openers = document.querySelectorAll("[data-menu-open]");
  var lastFocus = null;

  function setMenu(open) {
    if (!menu) return;
    menu.hidden = !open;
    if (backdrop) backdrop.hidden = !open;
    body.classList.toggle("menu-open", open);
    openers.forEach(function (b) {
      b.setAttribute("aria-expanded", open ? "true" : "false");
    });
    if (open) {
      lastFocus = document.activeElement;
      var first = menu.querySelector("input, a, button");
      if (first) first.focus();
    } else if (lastFocus) {
      lastFocus.focus();
    }
  }

  openers.forEach(function (b) {
    b.addEventListener("click", function () {
      setMenu(true);
    });
  });
  document.querySelectorAll("[data-menu-close]").forEach(function (b) {
    b.addEventListener("click", function () {
      setMenu(false);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu && !menu.hidden) setMenu(false);
  });

  // --- Header compatto: quando la testata esce dallo schermo ----------------
  var masthead = document.getElementById("masthead");
  if (masthead && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        body.classList.toggle("is-scrolled", !entries[0].isIntersecting);
      },
      { rootMargin: "-1px 0px 0px 0px", threshold: 0 },
    ).observe(masthead);
  } else {
    window.addEventListener("scroll", function () {
      body.classList.toggle("is-scrolled", window.scrollY > 120);
    }, { passive: true });
  }

  // --- Barra di avanzamento lettura (solo articoli) -------------------------
  var progress = document.querySelector("[data-progress]");
  var article = document.querySelector(".article__body");
  if (progress && article) {
    var ticking = false;
    var update = function () {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight * 0.5;
      var done = Math.min(Math.max(-rect.top + window.innerHeight * 0.3, 0), Math.max(total, 1));
      progress.style.width = (total > 0 ? (done / total) * 100 : 100) + "%";
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  // --- Condividi --------------------------------------------------------------
  document.querySelectorAll(".share").forEach(function (share) {
    var url = share.getAttribute("data-share-url");
    var title = share.getAttribute("data-share-title");
    var copy = share.querySelector("[data-copy-link]");
    if (!copy) return;

    copy.addEventListener("click", function () {
      // Su mobile la condivisione nativa è più utile del copia-link
      if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        navigator.share({ title: title, url: url }).catch(function () {});
        return;
      }
      var done = function () {
        copy.classList.add("is-copied");
        copy.setAttribute("aria-label", "Link copiato");
        setTimeout(function () {
          copy.classList.remove("is-copied");
          copy.setAttribute("aria-label", "Copia il link");
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () {
          window.prompt("Copia il link:", url);
        });
      } else {
        window.prompt("Copia il link:", url);
      }
    });
  });

  // --- Newsletter -------------------------------------------------------------
  document.querySelectorAll("[data-newsletter]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var email = input && input.value.trim();
      if (!email) return;
      var finish = function (ok) {
        form.classList.add("is-sent");
        var msg = document.createElement("p");
        msg.className = "newsletter-form__done";
        msg.textContent = ok ? "Grazie! Controlla la tua casella per confermare l'iscrizione." : "Non siamo riusciti a registrare l'indirizzo. Riprova tra poco.";
        form.appendChild(msg);
      };
      var action = form.getAttribute("action");
      if (!action) {
        finish(true); // endpoint non configurato: solo conferma visiva (vedi config.js)
        return;
      }
      var data = new FormData();
      data.append("email", email);
      data.append("source", location.pathname);
      fetch(action, { method: "POST", body: data, mode: "no-cors" }).then(function () {
        finish(true);
      }, function () {
        finish(false);
      });
    });
  });

  // --- Avviso cookie ----------------------------------------------------------
  var notice = document.querySelector("[data-cookie-notice]");
  if (notice) {
    var KEY = "notturno_cookie_ok";
    var seen = false;
    try {
      seen = localStorage.getItem(KEY) === "1";
    } catch (err) {}
    if (!seen) notice.hidden = false;
    var accept = notice.querySelector("[data-cookie-accept]");
    if (accept) {
      accept.addEventListener("click", function () {
        notice.hidden = true;
        try {
          localStorage.setItem(KEY, "1");
        } catch (err) {}
      });
    }
  }

  // --- Torna su ---------------------------------------------------------------
  var top = document.querySelector("[data-back-to-top]");
  if (top) {
    window.addEventListener("scroll", function () {
      top.hidden = window.scrollY < 900;
    }, { passive: true });
    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // --- Data di oggi (il file è statico: la data generata potrebbe essere vecchia)
  var today = document.querySelector("[data-today]");
  if (today) {
    try {
      var d = new Date();
      today.textContent = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      today.setAttribute("datetime", d.toISOString().slice(0, 10));
    } catch (err) {}
  }
})();

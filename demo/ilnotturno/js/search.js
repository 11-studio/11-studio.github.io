/*
    ============================================
    SEARCH.JS — Ricerca lato client
    ============================================

    Carica /search-index.json (generato dal build) e filtra gli articoli
    per titolo, sommario, sezione, firma e tag. Usato solo in /cerca/.
*/
(function () {
  "use strict";

  var form = document.querySelector("[data-search-form]");
  var input = document.getElementById("search-input");
  var status = document.querySelector("[data-search-status]");
  var results = document.querySelector("[data-search-results]");
  if (!form || !input || !results) return;

  var index = null;
  var loading = null;
  // Prefisso quando il sito è in una sottocartella (vedi SITE.url in config.js)
  var base = document.documentElement.getAttribute("data-base") || "";

  function load() {
    if (!loading) {
      loading = fetch(base + "/search-index.json")
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          index = data;
          return data;
        });
    }
    return loading;
  }

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function highlight(text, terms) {
    var html = escapeHtml(text);
    terms.forEach(function (t) {
      if (t.length < 2) return;
      html = html.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>");
    });
    return html;
  }

  function score(item, terms) {
    var s = 0;
    var title = normalize(item.title), sub = normalize(item.subtitle);
    var other = normalize([item.section, item.authors.join(" "), (item.tags || []).join(" "), item.kicker || ""].join(" "));
    terms.forEach(function (t) {
      if (title.indexOf(t) !== -1) s += 5;
      if (sub.indexOf(t) !== -1) s += 2;
      if (other.indexOf(t) !== -1) s += 3;
      if (normalize(item.text).indexOf(t) !== -1) s += 1;
    });
    return s;
  }

  function render(items, terms, query) {
    if (!query) {
      status.textContent = "";
      results.innerHTML = "";
      return;
    }
    status.textContent = items.length ? items.length + (items.length === 1 ? " risultato" : " risultati") + " per “" + query + "”" : "Nessun risultato per “" + query + "”. Prova con parole diverse.";
    results.innerHTML = items
      .map(function (a) {
        var media = a.image
          ? '<div class="media"><img src="' + base + a.image + '" alt="" loading="lazy"></div>'
          : '<div class="media media--empty" style="--section:' + a.color + '"><span>Notturno</span></div>';
        return (
          '<article class="card card--row">' +
          '<a class="card__media" href="' + base + a.url + '" tabindex="-1" aria-hidden="true">' + media + "</a>" +
          '<div class="card__body"><div class="card__kicker"><a class="kicker" href="' + base + a.sectionUrl + '" style="--section:' + a.color + '">' + escapeHtml(a.section) + "</a></div>" +
          '<h3 class="card__title"><a href="' + base + a.url + '">' + highlight(a.title, terms) + "</a></h3>" +
          '<p class="card__summary">' + highlight(a.subtitle, terms) + "</p>" +
          '<div class="card__byline"><span>di ' + escapeHtml(a.authors.join(" e ")) + "</span><time>" + escapeHtml(a.dateLabel) + "</time></div></div></article>"
        );
      })
      .join("");
  }

  function run(query) {
    var q = query.trim();
    var terms = normalize(q).split(/\s+/).filter(Boolean);
    if (!terms.length) {
      render([], [], "");
      return;
    }
    status.textContent = "Ricerca in corso…";
    load().then(function (data) {
      var items = data
        .map(function (item) {
          return { item: item, s: score(item, terms) };
        })
        .filter(function (x) {
          return x.s > 0;
        })
        .sort(function (a, b) {
          return b.s - a.s || (a.item.date < b.item.date ? 1 : -1);
        })
        .map(function (x) {
          return x.item;
        });
      render(items, terms, q);
    }).catch(function () {
      status.textContent = "La ricerca non è disponibile in questo momento.";
    });
  }

  var timer;
  input.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      run(input.value);
      var url = new URL(location.href);
      if (input.value.trim()) url.searchParams.set("q", input.value.trim());
      else url.searchParams.delete("q");
      history.replaceState(null, "", url);
    }, 200);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    run(input.value);
  });

  var initial = new URLSearchParams(location.search).get("q");
  if (initial) {
    input.value = initial;
    run(initial);
  }
  load();
})();

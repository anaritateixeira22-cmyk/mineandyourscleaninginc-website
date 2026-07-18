// ==================================================
// MINE AND YOURS CLEANING INC.
// Site-wide search: searches services, industries,
// FAQs, and pages using the index in js/search-data.js
// ==================================================

document.addEventListener("DOMContentLoaded", function () {
  var data = window.SITE_SEARCH_DATA;
  var overlay = document.getElementById("site-search-overlay");
  var input = document.getElementById("site-search-input");
  var results = document.getElementById("site-search-results");
  var openBtns = document.querySelectorAll("[data-search-open]");
  var closeBtns = document.querySelectorAll("[data-search-close]");

  if (!data || !overlay || !input || !results) return;

  var GROUPS = [
    { key: "services", label: "Services" },
    { key: "industries", label: "Industries" },
    { key: "faqs", label: "FAQs" },
    { key: "pages", label: "Pages" }
  ];

  // Small stopword list so natural-language questions ("how often should
  // our office be cleaned") only require the meaningful words to match,
  // not every word in the sentence.
  var STOPWORDS = {
    "a":1,"an":1,"the":1,"is":1,"are":1,"do":1,"does":1,"did":1,"can":1,
    "could":1,"should":1,"would":1,"will":1,"i":1,"my":1,"our":1,"your":1,
    "you":1,"we":1,"us":1,"to":1,"for":1,"of":1,"in":1,"on":1,"at":1,
    "and":1,"or":1,"it":1,"this":1,"that":1,"be":1,"have":1,"has":1,
    "need":1,"needs":1,"want":1,"wants":1,"please":1,"how":1,"what":1,
    "when":1,"where":1,"why":1,"who":1,"about":1,"with":1,"if":1
  };

  function tokenize(str) {
    return String(str).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  }

  // Lightweight fuzzy match so plurals, verb tenses, and near-forms of a
  // word count as a hit (e.g. "price" / "pricing", "clean" / "cleaning" /
  // "cleaners", "gym" / "gyms") without a full stemming library.
  function wordsMatch(a, b) {
    if (a === b) return true;
    var shorter = a.length <= b.length ? a : b;
    var longer = a.length <= b.length ? b : a;
    if (shorter.length >= 3 && longer.indexOf(shorter) === 0) return true;
    if (a.length >= 5 && b.length >= 5) {
      var i = 0;
      while (i < 4 && a[i] === b[i]) i++;
      if (i >= 4) return true;
    }
    return false;
  }

  function buildHaystackWords(item) {
    var text = [item.title, item.desc || "", item.keywords || ""].join(" ");
    return tokenize(text);
  }

  // Cache tokenized haystacks once per item instead of re-splitting on
  // every keystroke.
  GROUPS.forEach(function (group) {
    (data[group.key] || []).forEach(function (item) {
      if (!item._words) item._words = buildHaystackWords(item);
    });
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function highlight(text, query) {
    var escaped = escapeHtml(text);
    if (!query) return escaped;
    var idx = escaped.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escaped;
    return escaped.slice(0, idx) + "<mark>" + escaped.slice(idx, idx + query.length) + "</mark>" + escaped.slice(idx + query.length);
  }

  function itemMatches(item, queryTokens) {
    var meaningful = queryTokens.filter(function (t) { return !STOPWORDS[t]; });
    var tokens = meaningful.length ? meaningful : queryTokens;
    return tokens.every(function (token) {
      return item._words.some(function (word) { return wordsMatch(token, word); });
    });
  }

  function render(query) {
    var q = query.trim();
    var queryTokens = tokenize(q);

    if (!q || !queryTokens.length) {
      results.innerHTML = '<p class="site-search-empty">Type a keyword to see matching results grouped by category.</p>';
      return;
    }

    var html = "";
    var totalMatches = 0;

    GROUPS.forEach(function (group) {
      var items = data[group.key] || [];
      var matches = items.filter(function (item) {
        return itemMatches(item, queryTokens);
      }).slice(0, 8);

      if (matches.length === 0) return;

      totalMatches += matches.length;

      html += '<div class="site-search-group"><h4>' + group.label + '</h4><ul>';
      matches.forEach(function (item) {
        html += '<li><a href="' + item.url + '">' + highlight(item.title, q) +
          (item.desc ? '<span class="result-desc">' + highlight(item.desc, q) + '</span>' : '') +
          '</a></li>';
      });
      html += '</ul></div>';
    });

    if (totalMatches === 0) {
      html = '<p class="site-search-empty">No results for &ldquo;' + escapeHtml(query) + '&rdquo;. Try a different keyword, or <a href="contact.html">contact us</a> directly.</p>';
    }

    results.innerHTML = html;
  }

  function closeMobileNav() {
    var nav = document.querySelector(".main-nav");
    var toggle = document.querySelector(".nav-toggle");
    if (nav) nav.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    document.querySelectorAll(".nav-item.open").forEach(function (item) {
      item.classList.remove("open");
      var caret = item.querySelector(".nav-caret");
      if (caret) caret.setAttribute("aria-expanded", "false");
    });
  }

  function openSearch() {
    closeMobileNav();
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    setTimeout(function () { input.focus(); }, 30);
  }

  function closeSearch() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  openBtns.forEach(function (btn) {
    btn.addEventListener("click", openSearch);
  });

  closeBtns.forEach(function (btn) {
    btn.addEventListener("click", closeSearch);
  });

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) closeSearch();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) closeSearch();
    if ((event.key === "/" || (event.key === "k" && (event.metaKey || event.ctrlKey))) && !overlay.classList.contains("is-open")) {
      var active = document.activeElement;
      var typing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
      if (!typing) {
        event.preventDefault();
        openSearch();
      }
    }
  });

  input.addEventListener("input", function () {
    render(input.value);
  });
});

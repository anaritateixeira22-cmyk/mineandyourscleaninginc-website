// ==================================================
// MINE AND YOURS CLEANING INC.
// Site-wide search — searches services, industries,
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

  function render(query) {
    var q = query.trim().toLowerCase();

    if (!q) {
      results.innerHTML = '<p class="site-search-empty">Start typing to search services, industries, FAQs, and pages.</p>';
      return;
    }

    var html = "";
    var totalMatches = 0;

    GROUPS.forEach(function (group) {
      var items = data[group.key] || [];
      var matches = items.filter(function (item) {
        var haystack = (item.title + " " + (item.desc || "")).toLowerCase();
        return haystack.indexOf(q) !== -1;
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

  function openSearch() {
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

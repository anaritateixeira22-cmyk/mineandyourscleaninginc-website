// ==================================================
// MINE AND YOURS CLEANING INC.
// Lazy-loads the search bundle (search-data.js + site-search.js)
// only when the user actually opens the search panel, instead of
// shipping it on every page load whether it's used or not.
// ==================================================

document.addEventListener("DOMContentLoaded", function () {
  var openBtns = document.querySelectorAll("[data-search-open]");
  if (!openBtns.length) return;

  var state = "idle"; // idle -> loading -> ready

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function loadSearchBundle() {
    if (state !== "idle") return;
    state = "loading";
    loadScript("js/search-data.js?v=20260724a")
      .then(function () { return loadScript("js/site-search.js?v=20260718a"); })
      .then(function () {
        state = "ready";
        // The click that triggered this load happened before site-search.js
        // existed, so open the panel now that it's ready.
        if (window.__openSiteSearch) {
          window.__openSiteSearch();
        } else {
          window.__siteSearchAutoOpen = true;
        }
      })
      .catch(function () {
        state = "idle";
      });
  }

  openBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (state === "ready") return; // site-search.js's own listener handles it now
      loadSearchBundle();
    });
  });
});

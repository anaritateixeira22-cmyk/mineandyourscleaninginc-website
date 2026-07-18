// ==================================================
// MINE AND YOURS CLEANING INC.
// Search-result landing: when a visitor arrives from the
// site search (?sq=...), show what they searched for and
// nudge them toward the relevant content on the page.
// ==================================================

document.addEventListener("DOMContentLoaded", function () {
  var params = new URLSearchParams(window.location.search);
  var query = params.get("sq");
  if (!query) return;

  var isFaqPage = /faq\.html$/.test(window.location.pathname) || window.location.pathname === "/faq.html";
  var main = document.querySelector("main");
  if (!main) return;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Build and insert the banner as the first thing inside <main>.
  var banner = document.createElement("div");
  banner.className = "search-result-banner";
  var labelText = isFaqPage ? "Search result" : "You searched for";
  var bodyHtml = isFaqPage
    ? 'Showing the answer for: <span class="search-result-query"><strong>&ldquo;' + escapeHtml(query) + '&rdquo;</strong></span>'
    : '<span class="search-result-query"><strong>&ldquo;' + escapeHtml(query) + '&rdquo;</strong></span>';
  banner.innerHTML = '<span class="search-result-label">' + labelText + '</span> ' + bodyHtml;
  main.insertBefore(banner, main.firstChild);

  // Fade the banner after a few seconds; remove it from the DOM once
  // the fade transition finishes so it doesn't leave a gap.
  window.setTimeout(function () {
    banner.classList.add("is-hidden");
    banner.addEventListener("transitionend", function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, { once: true });
  }, 4500);

  if (isFaqPage && window.location.hash) {
    var target = document.getElementById(window.location.hash.slice(1));
    if (target && target.tagName === "DETAILS") {
      target.open = true;
      target.classList.remove("faq-jump-highlight");
      void target.offsetWidth;
      target.classList.add("faq-jump-highlight");
      window.setTimeout(function () {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      window.setTimeout(function () {
        target.classList.remove("faq-jump-highlight");
      }, 1800);
    }
  } else if (!isFaqPage) {
    // No specific answer to open, so nudge the page's own title/eyebrow
    // instead of highlighting the whole page.
    var nudgeTarget = document.querySelector(".page-hero .eyebrow, .hero-new .eyebrow") || document.querySelector("main h1");
    if (nudgeTarget) {
      nudgeTarget.classList.add("hero-nudge");
      window.setTimeout(function () {
        nudgeTarget.classList.remove("hero-nudge");
      }, 2500);
    }
  }

  // Clean the ?sq= param from the address bar so a refresh or a shared
  // link doesn't keep re-triggering the banner and highlight.
  var cleanUrl = window.location.pathname + window.location.hash;
  window.history.replaceState({}, document.title, cleanUrl);
});

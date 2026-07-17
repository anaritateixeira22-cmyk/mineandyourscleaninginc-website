// ==================================================
// MINE AND YOURS CLEANING INC.
// Site-wide JS — mobile navigation toggle
// ==================================================

document.addEventListener("DOMContentLoaded", function () {
  var nav = document.querySelector(".main-nav");
  var toggle = document.querySelector(".nav-toggle");

  if (!nav || !toggle) return;

  function closeNav() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    closeAllAccordionItems();
  }

  function toggleNav() {
    var isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  toggle.addEventListener("click", toggleNav);

  // Close the menu when an actual navigation link is tapped — top-level
  // links with no dropdown (Home, Careers), links inside an open
  // dropdown, and the CTA button. Deliberately excludes the dropdown
  // parent labels (About Us, Our Process, Services, Contact): on
  // mobile those only expand/collapse their section, handled below.
  nav.querySelectorAll(".nav-links > a, .nav-dropdown a, .nav-cta").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  // Close the menu if the viewport is resized back up to desktop.
  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) closeNav();
  });

  // ==================================================
  // SWIPE-TO-CLOSE (mobile menu)
  // Alongside tapping the hamburger again, users can swipe up on
  // the open menu to dismiss it — the common "swipe to close"
  // gesture people already expect from mobile menus/sheets.
  // ==================================================
  var touchStartY = null;

  nav.addEventListener("touchstart", function (event) {
    if (!nav.classList.contains("is-open")) return;
    // Ignore gestures that start on an actual link/button — those are
    // taps meant for that control (open a section, follow a link),
    // not a deliberate swipe-to-dismiss. Real thumbs aren't perfectly
    // still, so without this a normal tap could read as a small swipe
    // and close the whole menu by accident.
    if (event.target.closest("a, button")) {
      touchStartY = null;
      return;
    }
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  nav.addEventListener("touchend", function (event) {
    if (touchStartY === null || !nav.classList.contains("is-open")) return;
    var touchEndY = event.changedTouches[0].clientY;
    var swipedUp = touchStartY - touchEndY;
    if (swipedUp > 70) closeNav();
    touchStartY = null;
  }, { passive: true });

  // Tapping anywhere outside the menu (the rest of the page) closes it.
  document.addEventListener("click", function (event) {
    if (!nav.classList.contains("is-open")) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    closeNav();
  });

  // ==================================================
  // NAV DROPDOWNS
  // Desktop: pure CSS (:hover / :focus-within) — no JS needed there.
  // Mobile: the same markup becomes an accordion. Tapping a parent
  // row (About Us, Our Process, Services, Contact) expands/collapses
  // its section instead of navigating, since the sections it leads to
  // are one tap away inside the dropdown itself. Only one section is
  // open at a time.
  // ==================================================
  var MOBILE_BREAKPOINT = 900;
  var navItems = document.querySelectorAll(".nav-item");

  function isMobileNav() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function closeAccordionItem(item) {
    item.classList.remove("open");
    var caret = item.querySelector(".nav-caret");
    if (caret) caret.setAttribute("aria-expanded", "false");
  }

  function closeAllAccordionItems(except) {
    navItems.forEach(function (item) {
      if (item !== except) closeAccordionItem(item);
    });
  }

  navItems.forEach(function (item) {
    var link = item.querySelector(":scope > a");
    var dropdown = item.querySelector(".nav-dropdown");
    var caret = item.querySelector(".nav-caret");
    if (!link || !dropdown) return;

    function toggleAccordion(event) {
      if (!isMobileNav()) return; // desktop: let the link navigate normally

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      var isOpen = item.classList.contains("open");
      closeAllAccordionItems(item);
      item.classList.toggle("open", !isOpen);
      if (caret) caret.setAttribute("aria-expanded", String(!isOpen));
      
      return false;
    }

    link.addEventListener("click", toggleAccordion);
    if (caret) caret.addEventListener("click", toggleAccordion);
  });

  // Escape closes an open dropdown/accordion. On desktop that means
  // moving focus off the currently-focused link (the dropdown is
  // driven by :focus-within, so this closes it); on mobile it also
  // collapses the accordion section directly.
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    closeAllAccordionItems();
    if (document.activeElement && document.activeElement.closest(".nav-item")) {
      document.activeElement.blur();
    }
  });

  // ==================================================
  // FORM REVEAL (progressive disclosure)
  // A "Start a Job/Service Application" style button that
  // reveals a form panel on click instead of showing the
  // full form immediately.
  // ==================================================
  document.querySelectorAll(".form-reveal").forEach(function (wrapper) {
    var trigger = wrapper.querySelector(".form-reveal-trigger");
    var panel = wrapper.querySelector(".form-reveal-panel");
    if (!trigger || !panel) return;

    trigger.addEventListener("click", function () {
      panel.hidden = false;
      wrapper.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
});

// ==================================================
// PHOTOGRAPHY
// Hero/process-page crossfade slideshow, and a quiet
// fade-in-on-scroll for the supporting service/process
// images. Both respect prefers-reduced-motion.
// ==================================================
document.addEventListener("DOMContentLoaded", function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Hero slideshow: peek-track carousel, 7.5s, pause on hover ---
  document.querySelectorAll("[data-slideshow]").forEach(function (slideshow) {
    var track = slideshow.querySelector(".hero-slide-track");
    var slides = slideshow.querySelectorAll(".hero-slide");
    if (!track || slides.length <= 1) return;

    // Restrained dot indicators, built once per slideshow.
    var dotsWrap = document.createElement("div");
    dotsWrap.className = "hero-slide-dots";
    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Show image " + (i + 1));
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });
    slideshow.appendChild(dotsWrap);
    var dots = dotsWrap.querySelectorAll("button");

    var current = 0;

    function render() {
      var containerWidth = slideshow.clientWidth;
      var slideWidth = containerWidth * 0.85;
      var gap = 14;
      var step = slideWidth + gap;
      track.style.transform = "translateX(" + (-current * step) + "px)";
      slides.forEach(function (s, i) { s.classList.toggle("is-active", i === current); });
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === current); });
    }

    function goTo(index) {
      current = ((index % slides.length) + slides.length) % slides.length;
      render();
    }

    render();

    if (reduceMotion) return;

    var intervalId = null;

    function start() {
      if (intervalId) return;
      intervalId = window.setInterval(function () { goTo(current + 1); }, 7500);
    }

    function stop() {
      window.clearInterval(intervalId);
      intervalId = null;
    }

    start();
    slideshow.addEventListener("mouseenter", stop);
    slideshow.addEventListener("mouseleave", start);
    window.addEventListener("resize", render);
  });

  // --- Supporting photography: fade in once, on first scroll into view ---
  var revealEls = document.querySelectorAll(".reveal-photo");
  if (!revealEls.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(function (el) { observer.observe(el); });
});

// ==================================================
// FAQ SEARCH
// Live-filters the question list as the user types. Matching
// items stay in the DOM and are simply shown/hidden — nothing
// is removed, so search engines and answer-engine crawlers can
// always read the full, unfiltered content.
// ==================================================
document.addEventListener("DOMContentLoaded", function () {
  var searchInput = document.getElementById("faq-search");
  if (!searchInput) return;

  var items = Array.prototype.slice.call(document.querySelectorAll("[data-faq-item]"));
  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-faq-section]"));
  var noResults = document.getElementById("faq-no-results");

  var itemData = items.map(function (item) {
    var textEl = item.querySelector(".faq-question-text");
    return {
      el: item,
      textEl: textEl,
      originalText: textEl.textContent,
      searchText: item.textContent.toLowerCase()
    };
  });

  function clearHighlight(entry) {
    entry.textEl.textContent = entry.originalText;
  }

  function highlight(entry, query) {
    var text = entry.originalText;
    var idx = text.toLowerCase().indexOf(query);
    if (idx === -1) {
      clearHighlight(entry);
      return;
    }
    var before = text.slice(0, idx);
    var match = text.slice(idx, idx + query.length);
    var after = text.slice(idx + query.length);
    entry.textEl.textContent = "";
    entry.textEl.appendChild(document.createTextNode(before));
    var markEl = document.createElement("mark");
    markEl.textContent = match;
    entry.textEl.appendChild(markEl);
    entry.textEl.appendChild(document.createTextNode(after));
  }

  function runSearch() {
    var query = searchInput.value.trim().toLowerCase();

    if (!query) {
      itemData.forEach(function (entry) {
        entry.el.classList.remove("faq-hidden");
        entry.el.open = false;
        clearHighlight(entry);
      });
      sections.forEach(function (s) { s.classList.remove("faq-hidden"); });
      noResults.hidden = true;
      return;
    }

    var anyVisible = false;
    var firstMatch = null;

    itemData.forEach(function (entry) {
      var matches = entry.searchText.indexOf(query) !== -1;
      entry.el.classList.toggle("faq-hidden", !matches);
      if (matches) {
        anyVisible = true;
        if (!firstMatch) firstMatch = entry;
        highlight(entry, query);
      } else {
        clearHighlight(entry);
      }
    });

    sections.forEach(function (section) {
      var visibleInSection = section.querySelectorAll("[data-faq-item]:not(.faq-hidden)").length > 0;
      section.classList.toggle("faq-hidden", !visibleInSection);
    });

    noResults.hidden = anyVisible;

    itemData.forEach(function (entry) {
      if (!entry.el.classList.contains("faq-hidden")) {
        entry.el.open = (entry === firstMatch);
      }
    });
  }

  searchInput.addEventListener("input", runSearch);
});

// ==================================================
// FAQ RELATED QUESTIONS — JUMP LINKS
// Clicking a "Related Questions" link opens the target
// question (if collapsed), scrolls to it, and briefly
// highlights it so the jump is easy to follow.
// ==================================================
document.addEventListener("DOMContentLoaded", function () {
  var jumpLinks = document.querySelectorAll(".faq-related-link[data-faq-jump]");
  if (!jumpLinks.length) return;

  jumpLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      var targetId = link.getAttribute("data-faq-jump");
      var target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      target.open = true;
      target.classList.remove("faq-jump-highlight");
      // force reflow so the animation can restart if clicked again
      void target.offsetWidth;
      target.classList.add("faq-jump-highlight");

      target.scrollIntoView({ behavior: "smooth", block: "start" });

      window.setTimeout(function () {
        target.classList.remove("faq-jump-highlight");
      }, 1500);
    });
  });
});

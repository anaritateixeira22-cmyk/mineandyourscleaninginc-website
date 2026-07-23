// ==================================================
// MINE AND YOURS CLEANING INC.
// Lazy-loads Leaflet (CSS + JS) only when a map
// container actually scrolls near the viewport, instead
// of shipping ~150KB of mapping library on every page
// load whether the visitor ever scrolls to the map or not.
// ==================================================

(function () {
  var leafletState = "idle"; // idle -> loading -> ready
  var pendingCallbacks = [];

  function loadLeaflet(onReady) {
    if (leafletState === "ready") { onReady(); return; }
    pendingCallbacks.push(onReady);
    if (leafletState === "loading") return;
    leafletState = "loading";

    var cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(cssLink);

    var script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = function () {
      leafletState = "ready";
      pendingCallbacks.forEach(function (cb) { cb(); });
      pendingCallbacks = [];
    };
    document.head.appendChild(script);
  }

  // containerId: the map's own element id, used just to find something
  // to observe for "near viewport"; initFn: called once Leaflet is
  // ready, expected to create the map itself.
  window.lazyLoadMap = function (containerId, initFn) {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (!("IntersectionObserver" in window)) {
      // No IntersectionObserver support: just load it, rather than
      // never showing a map at all.
      loadLeaflet(initFn);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observer.disconnect();
          loadLeaflet(initFn);
        }
      });
    }, { rootMargin: "300px" });

    observer.observe(container);
  };
})();

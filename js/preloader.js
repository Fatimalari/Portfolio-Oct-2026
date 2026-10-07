(function () {
  var root = document.documentElement;
  if (!root.classList.contains("is-loading")) return;

  var preloader = document.querySelector(".preloader");
  var count = preloader.querySelector(".preloader__count");
  var fill = preloader.querySelector(".preloader__bar-fill");

  var MIN_DURATION = 1400; // counter always runs at least this long
  var MAX_WAIT = 4000;     // never hold the page longer than this
  var start = performance.now();
  var pageReady = false;

  function markReady() { pageReady = true; }
  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(function (resolve) {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", resolve, { once: true });
    })
  ]).then(markReady);
  setTimeout(markReady, MAX_WAIT);

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function tick(now) {
    var t = Math.min((now - start) / MIN_DURATION, 1);
    // Hold at 99 until the page has actually loaded
    var value = Math.round(easeOut(t) * (pageReady ? 100 : 99));
    count.textContent = value;
    fill.style.transform = "scaleX(" + value / 100 + ")";

    if (value < 100) requestAnimationFrame(tick);
    else setTimeout(finish, 200);
  }
  requestAnimationFrame(tick);

  function finish() {
    try { sessionStorage.setItem("preloader-seen", "1"); } catch (e) {}
    root.classList.add("is-loaded");
    preloader.addEventListener("transitionend", function () {
      root.classList.remove("is-loading");
      preloader.remove();
    }, { once: true });
  }
})();

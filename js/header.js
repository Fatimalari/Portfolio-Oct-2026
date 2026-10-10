/* Header that gets out of the way: hidden while scrolling down, back as
   soon as you scroll up, transparent again at the very top. */
(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;

  var TOP = 10;      // within this many px of the top: plain header
  var NUDGE = 6;     // ignore tiny scroll jitters
  var lastY = window.scrollY;
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY;
    // keep it in view while the phone menu is open
    if (document.documentElement.classList.contains("menu-open")) { lastY = y; return; }

    if (y <= TOP) {
      header.classList.remove("is-scrolled", "is-hidden");
    } else {
      header.classList.add("is-scrolled");
      if (y > lastY + NUDGE && y > header.offsetHeight) header.classList.add("is-hidden");
      else if (y < lastY - NUDGE) header.classList.remove("is-hidden");
    }
    if (Math.abs(y - lastY) > NUDGE || y <= TOP) lastY = y;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  // reveal it when keyboard focus lands in it
  header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });

  update();
})();

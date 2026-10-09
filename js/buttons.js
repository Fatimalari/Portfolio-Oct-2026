/* Touch screens have no hover, so a tap on a button (Hire me, Know me
   better, the email) plays the hover animation — the dot grows, the text
   turns purple, the underline slides in — and the link opens once it has
   finished, about 0.3s later. Mouse and keyboard clicks open straight
   away, and so does everything for people who prefer reduced motion. */
(function () {
  var DELAY = 300;   // matches the touch transition in css/main.css
  var RESET = 1200;  // clear the state if the page is still here (e.g. mailto)
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll(".button").forEach(function (button) {
    var touch = false;
    var timer;

    button.addEventListener("pointerdown", function (event) {
      touch = event.pointerType === "touch" || event.pointerType === "pen";
    });

    button.addEventListener("click", function (event) {
      if (!touch || reduceMotion.matches) return;
      touch = false;
      event.preventDefault();
      button.classList.add("is-tapped");
      clearTimeout(timer);
      timer = setTimeout(function () {
        window.location.href = button.href;
        setTimeout(function () { button.classList.remove("is-tapped"); }, RESET);
      }, DELAY);
    });
  });
})();

/* Phone menu: the drawer slides in from the right. Closes with the X,
   a tap on the dimmed page, the Escape key, or picking a link. Focus
   moves into the drawer while it is open and back to the button after. */
(function () {
  var toggle = document.querySelector(".menu-toggle");
  var drawer = document.getElementById("menu-drawer");
  if (!toggle || !drawer) return;

  var panel = drawer.querySelector(".drawer__panel");
  var closeTimer;

  function focusables() {
    return panel.querySelectorAll("a[href], button");
  }

  function open() {
    clearTimeout(closeTimer);
    drawer.hidden = false;
    drawer.offsetWidth; // let the closed state paint so the slide runs
    drawer.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("menu-open");
    var first = panel.querySelector(".drawer__links a");
    if (first) first.focus();
  }

  function close() {
    if (drawer.hidden) return;
    drawer.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("menu-open");
    closeTimer = setTimeout(function () { drawer.hidden = true; }, 400);
    toggle.focus();
  }

  toggle.addEventListener("click", open);
  drawer.addEventListener("click", function (event) {
    if (event.target.closest("[data-close-menu]") || event.target.closest(".drawer__links a")) close();
  });

  document.addEventListener("keydown", function (event) {
    if (drawer.hidden) return;
    if (event.key === "Escape") { close(); return; }
    if (event.key !== "Tab") return;
    // keep Tab inside the drawer
    var items = focusables();
    var first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  // back to a desktop width: make sure the drawer is shut
  window.matchMedia("(min-width: 768px)").addEventListener("change", function (mq) {
    if (mq.matches) {
      drawer.classList.remove("is-open");
      drawer.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      document.documentElement.classList.remove("menu-open");
    }
  });
})();

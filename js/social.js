/* Email icon in the hero: on desktop, clicking copies the address (from
   data-email) instead of opening a mail app, and its bubble says
   "Copied!" for a moment. Webmail users often have no mail app set up,
   so copying is the more reliable way to get in touch. On touch screens,
   or if copying isn't possible, the mailto: link works as usual. */
(function () {
  var link = document.querySelector(".social__link[data-email]");
  if (!link) return;

  var item = link.parentNode;
  var bubble = item.querySelector(".social__bubble");
  var desktop = window.matchMedia("(hover: hover) and (min-width: 768px)");
  var bubbleText = bubble ? bubble.textContent : "";
  var timer;

  // Announces the copy to screen readers (the bubble itself is aria-hidden)
  var status = document.createElement("span");
  status.className = "visually-hidden";
  status.setAttribute("role", "status");
  item.appendChild(status);

  link.addEventListener("click", function (event) {
    var email = link.getAttribute("data-email");
    if (!email || !desktop.matches || !navigator.clipboard) return;

    event.preventDefault();
    navigator.clipboard.writeText(email).then(function () {
      if (bubble) bubble.textContent = "Copied!";
      status.textContent = "Email address copied";
      item.classList.add("is-copied");
      clearTimeout(timer);
      timer = setTimeout(function () {
        item.classList.remove("is-copied");
        status.textContent = "";
        // swap the text back once the bubble has faded out
        setTimeout(function () { if (bubble) bubble.textContent = bubbleText; }, 250);
      }, 1600);
    }, function () {
      window.location.href = link.href; // copying blocked: open the mail app
    });
  });
})();

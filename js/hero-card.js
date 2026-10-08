/* Hero card: tap (touch) or click toggles the back square sliding out.
   Mouse hover is handled in CSS. */
(function () {
  var card = document.querySelector(".hero-card");
  if (!card) return;

  card.addEventListener("click", function () {
    card.classList.toggle("is-open");
  });

  // With a mouse, reset when the pointer leaves so hover and click don't
  // fight each other. Touch browsers can fire leave events right after a
  // tap, so those are ignored.
  card.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse") card.classList.remove("is-open");
  });
})();

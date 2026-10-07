/* Block-reveal text animation (vanilla port of the TextBlockAnimation
   React component). Each line of text is covered by a sweeping colour
   block: the block grows left → right, the text appears halfway, then
   the block shrinks away to the right. Plays when the text scrolls into
   view and reverses when you scroll back above it.
   Desktop only; skipped for people who prefer reduced motion. */
(function () {
  gsap.registerPlugin(SplitText, ScrollTrigger);

  var BLOCK_COLOR = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-accent").trim() || "#9469f3";
  var DURATION = 0.6;
  var STAGGER = 0.1;

  var SELECTORS = [
    ".section-title",
    ".work-card__category", ".work-card__title",
    ".about__text p", ".about__text .button",
    ".experience-item__date", ".experience-item__title", ".experience-item__text",
    ".contact__title", ".contact .button",
    ".site-footer__name", ".site-footer__nav a"
  ].join(",");

  function animate(el) {
    // autoSplit re-runs onSplit when fonts load or the width changes;
    // the timeline returned from onSplit is cleaned up each time.
    SplitText.create(el, {
      type: "lines",
      linesClass: "block-line",
      autoSplit: true,
      onSplit: function (self) {
        var blocks = [];

        self.lines.forEach(function (line) {
          var wrapper = document.createElement("span");
          wrapper.className = "block-line-wrap";
          var block = document.createElement("span");
          block.className = "block-line-cover";
          block.style.backgroundColor = BLOCK_COLOR;

          line.parentNode.insertBefore(wrapper, line);
          wrapper.appendChild(line);
          wrapper.appendChild(block);
          blocks.push(block);
        });

        gsap.set(self.lines, { opacity: 0 });
        gsap.set(blocks, { scaleX: 0, transformOrigin: "left center" });

        return gsap.timeline({
          defaults: { ease: "expo.inOut" },
          scrollTrigger: {
            trigger: el,
            // The footer bar sits at the very bottom of the page and can't
            // scroll up to 85%, so it plays as soon as it enters the screen
            start: el.closest(".site-footer__bar") ? "top bottom" : "top 85%",
            toggleActions: "play none none reverse"
          }
        })
          .to(blocks, { scaleX: 1, duration: DURATION, stagger: STAGGER, transformOrigin: "left center" })
          .set(self.lines, { opacity: 1, stagger: STAGGER }, "<" + DURATION / 2)
          .to(blocks, { scaleX: 0, duration: DURATION, stagger: STAGGER, transformOrigin: "right center" }, "<" + DURATION * 0.4);
      }
    });
  }

  var mm = gsap.matchMedia();
  mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", function () {
    // gsap.matchMedia reverts the splits and timelines below 768px
    document.querySelectorAll(SELECTORS).forEach(animate);
  });
})();

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

  // Hero headline: one block per line (the lines don't wrap on desktop),
  // played once the preloader starts lifting, or right away without it.
  function animateHero() {
    var lines = document.querySelectorAll(".hero__line");
    var inners = document.querySelectorAll(".hero__line-inner");
    var covers = [];

    lines.forEach(function (line) {
      var cover = document.createElement("span");
      cover.className = "block-line-cover";
      cover.style.backgroundColor = BLOCK_COLOR;
      line.appendChild(cover);
      covers.push(cover);
    });

    gsap.set(inners, { opacity: 0 });
    gsap.set(covers, { scaleX: 0, transformOrigin: "left center" });

    var tl = gsap.timeline({ paused: true, defaults: { ease: "expo.inOut" } })
      .to(covers, { scaleX: 1, duration: 0.8, stagger: 0.15, transformOrigin: "left center" })
      .set(inners, { opacity: 1, stagger: 0.15 }, "<0.4")
      .to(covers, { scaleX: 0, duration: 0.8, stagger: 0.15, transformOrigin: "right center" }, "<0.32");

    var root = document.documentElement;
    var observer;
    if (root.classList.contains("is-loading") && !root.classList.contains("is-loaded")) {
      observer = new MutationObserver(function () {
        if (root.classList.contains("is-loaded")) {
          observer.disconnect();
          tl.delay(0.45).play(); // the preloader panel is mid-way up by then
        }
      });
      observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    } else {
      tl.delay(0.2).play();
    }

    return function cleanup() {
      if (observer) observer.disconnect();
      covers.forEach(function (c) { c.remove(); });
    };
  }

  var mm = gsap.matchMedia();
  mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", function () {
    // gsap.matchMedia reverts the splits, tweens and sets below 768px
    document.querySelectorAll(SELECTORS).forEach(animate);
    return animateHero();
  });
})();

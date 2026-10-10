/* Block-reveal text animation (vanilla port of the TextBlockAnimation
   React component). Each line of text is covered by two sweeping blocks:
   a secondary-colour block grows left → right with the accent block close
   behind, the text appears, then the accent and secondary blocks shrink
   away to the right in turn. Plays once, the first time the text
   scrolls into view after the page loads.
   Runs on desktop and mobile; skipped for people who prefer reduced motion. */
(function () {
  gsap.registerPlugin(SplitText, ScrollTrigger);

  var rootStyle = getComputedStyle(document.documentElement);
  // Two blocks per line: the secondary colour leads, the accent follows
  var FIRST_COLOR = rootStyle.getPropertyValue("--color-secondary").trim() || "#f7f4f8";
  var SECOND_COLOR = rootStyle.getPropertyValue("--color-accent").trim() || "#9469f3";
  // Inside the secondary-colour panels the first block would be invisible,
  // so there it uses white (the primary colour) instead
  var PANEL_FIRST_COLOR = rootStyle.getPropertyValue("--color-primary").trim() || "#ffffff";
  var PANELS = ".about__panel, .site-footer__panel";

  // Adds both blocks to a positioned element and returns them [first, second]
  function addCovers(parent) {
    var first = parent.closest(PANELS) ? PANEL_FIRST_COLOR : FIRST_COLOR;
    return [first, SECOND_COLOR].map(function (color) { return addCover(parent, color); });
  }

  function addCover(parent, color) {
    var cover = document.createElement("span");
    cover.className = "block-line-cover";
    cover.style.backgroundColor = color;
    parent.appendChild(cover);
    return cover;
  }

  // first sweeps in, second follows; the text appears once the second
  // covers it; then the second sweeps out, uncovering the first, which
  // follows it out to reveal the text
  function blockTimeline(tl, firsts, seconds, texts, duration, stagger) {
    gsap.set(texts, { opacity: 0 });
    gsap.set(firsts.concat(seconds), { scaleX: 0, transformOrigin: "left center" });

    var lag = duration * 0.3;
    return tl
      .to(firsts, { scaleX: 1, duration: duration, stagger: stagger, transformOrigin: "left center" })
      .to(seconds, { scaleX: 1, duration: duration, stagger: stagger, transformOrigin: "left center" }, "<" + lag)
      .set(texts, { opacity: 1, stagger: stagger }, "<" + duration * 0.6)
      .to(seconds, { scaleX: 0, duration: duration, stagger: stagger, transformOrigin: "right center" }, "<" + duration * 0.3)
      .to(firsts, { scaleX: 0, duration: duration, stagger: stagger, transformOrigin: "right center" }, "<" + lag);
  }

  var DURATION = 0.6;
  var STAGGER = 0.1;

  var SELECTORS = [
    ".section-title",
    ".work-card__category", ".work-card__title", ".work-card__desc", ".work-card__cta .button__label",
    ".about__text p", ".about__text .button__label",
    ".about-page__title", ".about-page__text p", ".about-page__text .button__label",
    ".beyond__text",
    ".resume-page__title", ".resume-head__name", ".resume-head__role", ".resume-head__actions .button__label",
    ".resume-summary", ".resume-row__date", ".resume-row__place", ".resume-row__title", ".resume-row__text",
    ".resume-row__points li", ".resume-skills__label",
    ".experience-item__date", ".experience-item__title", ".experience-item__text",
    ".contact__title", ".contact .button__label",
    ".site-footer__name", ".site-footer__nav a"
  ].join(",");

  // opts.start: a function that receives the timeline and decides when to
  // play it. Without it the timeline plays on scroll.
  function animate(el, opts) {
    opts = opts || {};
    var duration = opts.duration || DURATION;
    var stagger = opts.stagger || STAGGER;

    // autoSplit re-runs onSplit when fonts load or the width changes;
    // the timeline returned from onSplit is cleaned up each time.
    SplitText.create(el, {
      type: "lines",
      linesClass: "block-line",
      autoSplit: true,
      onSplit: function (self) {
        var firsts = [];
        var seconds = [];

        self.lines.forEach(function (line) {
          var wrapper = document.createElement("span");
          wrapper.className = "block-line-wrap";
          line.parentNode.insertBefore(wrapper, line);
          wrapper.appendChild(line);
          var covers = addCovers(wrapper);
          firsts.push(covers[0]);
          seconds.push(covers[1]);
        });

        // Scroll reveals play once per page load: after a reveal has
        // finished, a re-split (fonts loading, resizing) jumps straight to
        // the revealed state instead of playing it again
        var revealed = !opts.start && el.hasAttribute("data-revealed");

        var tl = blockTimeline(gsap.timeline({
          paused: !!opts.start || revealed,
          defaults: { ease: "expo.inOut" },
          scrollTrigger: opts.start || revealed ? null : {
            trigger: el,
            // The footer bar sits at the very bottom of the page and can't
            // scroll up to 85%, so it plays as soon as it enters the screen
            start: el.closest(".site-footer__bar") ? "top bottom" : "top 85%",
            once: true
          }
        }), firsts, seconds, self.lines, duration, stagger);

        if (!opts.start) {
          tl.eventCallback("onComplete", function () { el.setAttribute("data-revealed", ""); });
        }

        if (revealed) tl.progress(1);
        if (opts.start) opts.start(tl);
        return tl;
      }
    });
  }

  // Calls play() once the preloader starts lifting, or shortly after load
  // when there is no preloader. Returns a cleanup function.
  function whenHeroReady(play) {
    var root = document.documentElement;
    if (root.classList.contains("is-loading") && !root.classList.contains("is-loaded")) {
      var observer = new MutationObserver(function () {
        if (root.classList.contains("is-loaded")) {
          observer.disconnect();
          play(0.45); // the preloader panel is mid-way up by then
        }
      });
      observer.observe(root, { attributes: true, attributeFilter: ["class"] });
      return function () { observer.disconnect(); };
    }
    play(0.2);
    return function () {};
  }

  // Block reveal for the hero (title and subtitle), played with the
  // intro: SplitText splits each into lines so every wrapped line gets
  // its own block.
  // SplitText re-splits when fonts finish loading or the width changes, and
  // each split builds a fresh timeline, so the state lives out here.
  // extraDelay staggers an element after the headline.
  function animateWithHero(elements, extraDelay) {
    var startDelay = null; // set once the hero may play
    var started = false;   // a timeline has begun playing
    var done = false;      // the intro has finished once
    var waiting = [];      // timelines created before the hero may play

    function play(tl) {
      tl.eventCallback("onComplete", function () { done = true; });
      tl.delay(started ? 0 : startDelay).play();
    }

    elements.forEach(function (el) {
      animate(el, {
        duration: 0.8,
        stagger: 0.15,
        start: function (tl) {
          if (done) {
            tl.progress(1); // e.g. rotating the phone later: no replay
          } else if (startDelay === null) {
            waiting.push(tl);
          } else {
            play(tl);
          }
        }
      });
    });

    return whenHeroReady(function (delay) {
      startDelay = delay + (extraDelay || 0);
      waiting.forEach(play);
      started = true;
      waiting = [];
    });
  }

  // Hero title and subtitle
  function animateHeroText() {
    return animateWithHero(document.querySelectorAll(".hero__line"), 0);
  }

  var mm = gsap.matchMedia();
  mm.add({
    desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
    mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)"
  }, function (context) {
    // gsap.matchMedia reverts the splits, tweens and sets when the
    // breakpoint changes
    var c = context.conditions;
    if (!c.desktop && !c.mobile) return;
    document.querySelectorAll(SELECTORS).forEach(function (el) { animate(el); });
    return animateHeroText();
  });

  // Header nav (About, Resume): the same two-colour block sweep plays over
  // the link on hover or keyboard focus. While the accent block covers the
  // text, the link switches to purple, so the sweep reveals it purple; it
  // stays purple until the pointer (or focus) leaves.
  function navHover() {
    var cleanups = [];

    document.querySelectorAll(".site-header__nav a").forEach(function (link) {
      var covers = addCovers(link);
      var active = false; // hovered or focused right now
      gsap.set(covers, { scaleX: 0, transformOrigin: "left center" });

      var lag = DURATION * 0.3;
      var tl = gsap.timeline({ paused: true, defaults: { ease: "expo.inOut" } })
        .to(covers[0], { scaleX: 1, duration: DURATION, transformOrigin: "left center" })
        .to(covers[1], { scaleX: 1, duration: DURATION, transformOrigin: "left center" }, "<" + lag)
        .addLabel("covered", "<" + DURATION * 0.6)
        .call(function () { link.classList.toggle("is-hovered", active); }, null, "covered")
        .to(covers[1], { scaleX: 0, duration: DURATION, transformOrigin: "right center" }, "<")
        .to(covers[0], { scaleX: 0, duration: DURATION, transformOrigin: "right center" }, "<" + lag);

      function enter() {
        active = true;
        if (!tl.isActive()) tl.restart();
        // back over the link after the sweep already passed its covered point
        else if (tl.time() >= tl.labels.covered) link.classList.add("is-hovered");
      }
      function leave() {
        if (link.matches(":hover") || document.activeElement === link) return;
        active = false;
        link.classList.remove("is-hovered");
      }
      link.addEventListener("mouseenter", enter);
      link.addEventListener("focus", enter);
      link.addEventListener("mouseleave", leave);
      link.addEventListener("blur", leave);

      cleanups.push(function () {
        link.removeEventListener("mouseenter", enter);
        link.removeEventListener("focus", enter);
        link.removeEventListener("mouseleave", leave);
        link.removeEventListener("blur", leave);
        link.classList.remove("is-hovered");
        tl.kill();
        covers.forEach(function (c) { c.remove(); });
      });
    });

    return function () { cleanups.forEach(function (fn) { fn(); }); };
  }

  mm.add("(hover: hover) and (prefers-reduced-motion: no-preference)", navHover);
})();

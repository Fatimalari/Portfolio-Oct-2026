/* Block-reveal text animation (vanilla port of the TextBlockAnimation
   React component). Each line of text is covered by two sweeping blocks:
   a secondary-colour block grows left → right with the accent block close
   behind, the text appears, then the accent and secondary blocks shrink
   away to the right in turn. Plays when the text scrolls into
   view and reverses when you scroll back above it.
   Runs on desktop and mobile; skipped for people who prefer reduced motion. */
(function () {
  gsap.registerPlugin(SplitText, ScrollTrigger);

  var rootStyle = getComputedStyle(document.documentElement);
  // Two blocks per line: the secondary colour leads, the accent follows
  var FIRST_COLOR = rootStyle.getPropertyValue("--color-secondary").trim() || "#f7f4f8";
  var SECOND_COLOR = rootStyle.getPropertyValue("--color-accent").trim() || "#9469f3";

  // Adds both blocks to a positioned element and returns them [first, second]
  function addCovers(parent) {
    return [FIRST_COLOR, SECOND_COLOR].map(function (color) { return addCover(parent, color); });
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
    ".work-card__category", ".work-card__title",
    ".about__text p", ".about__text .button",
    ".experience-item__date", ".experience-item__title", ".experience-item__text",
    ".contact__title", ".contact .button",
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

        var tl = blockTimeline(gsap.timeline({
          paused: !!opts.start,
          defaults: { ease: "expo.inOut" },
          scrollTrigger: opts.start ? null : {
            trigger: el,
            // The footer bar sits at the very bottom of the page and can't
            // scroll up to 85%, so it plays as soon as it enters the screen
            start: el.closest(".site-footer__bar") ? "top bottom" : "top 85%",
            toggleActions: "play none none reverse"
          }
        }), firsts, seconds, self.lines, duration, stagger);

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

  // Hero headline: one block per line (the lines don't wrap on desktop),
  // played once the preloader starts lifting, or right away without it.
  function animateHero() {
    var lines = document.querySelectorAll(".hero__line");
    var inners = gsap.utils.toArray(".hero__line-inner");
    var firsts = [];
    var seconds = [];

    lines.forEach(function (line) {
      var covers = addCovers(line);
      firsts.push(covers[0]);
      seconds.push(covers[1]);
    });

    var tl = blockTimeline(gsap.timeline({ paused: true, defaults: { ease: "expo.inOut" } }),
      firsts, seconds, inners, 0.8, 0.15);

    var stopWaiting = whenHeroReady(function (delay) { tl.delay(delay).play(); });

    return function cleanup() {
      stopWaiting();
      firsts.concat(seconds).forEach(function (c) { c.remove(); });
    };
  }

  // Mobile hero: the headline wraps, so each wrapped line gets its own block.
  // SplitText re-splits when fonts finish loading or the width changes, and
  // each split builds a fresh timeline, so the state lives out here.
  function animateHeroMobile() {
    var startDelay = null; // set once the hero may play
    var started = false;   // a timeline has begun playing
    var done = false;      // the intro has finished once
    var waiting = [];      // timelines created before the hero may play

    function play(tl) {
      tl.eventCallback("onComplete", function () { done = true; });
      tl.delay(started ? 0 : startDelay).play();
    }

    document.querySelectorAll(".hero__line").forEach(function (line) {
      animate(line, {
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
      startDelay = delay;
      waiting.forEach(play);
      started = true;
      waiting = [];
    });
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
    return c.desktop ? animateHero() : animateHeroMobile();
  });
})();

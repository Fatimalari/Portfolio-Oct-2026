/* Page motion, kept calm so the content reads straight away:
   - soft fade-up: text blocks and project rows fade in and rise 24px the
     first time they scroll into view (once per page load);
   - hero title and subtitle fade up as the preloader lifts.
   Nothing moves for people who prefer reduced motion. */
(function () {
  gsap.registerPlugin(ScrollTrigger);

  var root = document.documentElement;
  var FADE = { y: 24, duration: 0.7, ease: "power2.out" };

  // Blocks that fade up as they scroll into view. Siblings that enter
  // together (e.g. text and image of one project) are staggered slightly.
  var FADE_SELECTORS = [
    ".section-title",
    ".work-card__text", ".work-card__media",
    ".about__text", ".about__media",
    ".experience-row",
    ".marquee",
    ".contact__title", ".contact .button",
    ".site-footer__bar",
    ".about-page__title", ".about-page__text", ".about-page__media",
    ".beyond__text", ".beyond__photo",
    ".resume-page__title", ".resume-head", ".resume-summary",
    ".resume-row", ".resume-skills__label", ".resume-tags"
  ].join(",");

  // Calls play() once the preloader starts lifting, or shortly after load
  // when there is no preloader. Returns a cleanup function.
  function whenHeroReady(play) {
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
    play(0.1);
    return function () {};
  }

  function fadeOnScroll() {
    var items = gsap.utils.toArray(FADE_SELECTORS);
    gsap.set(items, { opacity: 0, y: FADE.y });
    ScrollTrigger.batch(items, {
      start: "top 90%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: FADE.duration, ease: FADE.ease, stagger: 0.12, overwrite: true });
      }
    });
  }

  function fadeHero() {
    var hero = gsap.utils.toArray(".hero__hello, .hero__title, .hero__subtitle");
    if (!hero.length) return function () {};
    gsap.set(hero, { opacity: 0, y: FADE.y });
    root.classList.add("hero-ready"); // hand visibility over from the CSS guard to GSAP
    return whenHeroReady(function (delay) {
      gsap.to(hero, { opacity: 1, y: 0, duration: 0.9, ease: FADE.ease, stagger: 0.15, delay: delay });
    });
  }

  var mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", function () {
    fadeOnScroll();
    return fadeHero();
  });
})();

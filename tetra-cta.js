// Tetra — компонент CTA: reveal при въезде в вьюпорт.
//   heading (пословно) → text → кнопки (сверху вниз через маску).
//
// Depends on: window.Tetra (tetra-core.js), GSAP + ScrollTrigger + SplitText.
(function () {
  var T = window.Tetra;
  if (!T) { console.warn('[tetra-cta] window.Tetra не найден — подключи tetra-core.js первым'); return; }

  function init() {
    if (!window.gsap || !window.ScrollTrigger || !window.SplitText) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    if (T.off('reveal')) return;

    T.mm.add('(prefers-reduced-motion: no-preference)', function () {
      var ctaSection = document.querySelector('.section_cta');
      if (!ctaSection) return;

      var r = T.createReveal();
      var ctaHeading = ctaSection.querySelector('.cta_heading');
      if (ctaHeading) r.revealText(r.timelineFor(ctaHeading), ctaHeading, 0);
      var ctaContent = r.timelineFor(ctaSection.querySelector('.cta_text-group') || ctaSection);
      r.revealText(ctaContent, ctaSection.querySelector('.cta_text'), 0);
      r.revealButtons(ctaContent, ctaSection.querySelectorAll('.cta-button'), 0.2);

      return r.destroy;
    });

    ScrollTrigger.refresh();
  }

  T.ready(init);
})();

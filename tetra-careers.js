// Tetra — страница Careers (Figma 12906:664, мобилка 12909:2189).
// Подключается после tetra-core.js и tetra-page.js.
//   • hero — загрузка как на About: слова заголовка из маски, текст,
//     кнопка сверху через маску, navbar
//   • section_careers-values — как tt-clients на Tetra Trust: метка, абзацы,
//     карточки сетки лесенкой (Figma v4 12919:750, мобилка 12919:832)
//   • section_careers-cta — reveal как у компонента CTA (tetra-cta.js)
// ?perf=careers выключает всё, ?perf=hero / reveal — отдельные части.
(function () {
  var T = window.Tetra || (window.Tetra = {});
  var NO_MOTION = '(prefers-reduced-motion: no-preference)';
  var HERO_ITEMS = '.careers-hero_heading, .careers-hero_text, .careers-hero_content .button';

  // hero прячем сразу (до снятия .tetra-anim), а SplitText запускаем после
  // загрузки веб-шрифтов — иначе строки считаются по fallback-шрифту
  function boot() {
    if (!window.gsap || !window.ScrollTrigger || T.off('careers')) return;
    var hero = document.querySelector('.section_careers-hero');
    if (hero && !T.off('hero')) gsap.set(hero.querySelectorAll(HERO_ITEMS), { autoAlpha: 0 });
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(init, init);
  }

  function init() {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    var mm = T.mm;
    var s = getComputedStyle(document.documentElement);

    /* ------------------------------------------------------------------ *
     * SECTION_CAREERS-HERO — тайминги/изинг как у hero About / Tetra Trust
     * ------------------------------------------------------------------ */
    var hero = document.querySelector('.section_careers-hero');
    var heading = hero && hero.querySelector('.careers-hero_heading');
    if (heading && window.SplitText && !T.off('hero')) {
      var heroText = hero.querySelector('.careers-hero_text');
      var heroButtons = hero.querySelectorAll('.careers-hero_content .button');
      var navbar = document.querySelector('.navbar-wrapper');
      var split = SplitText.create(heading, {
        type: 'lines,words',
        linesClass: 'hero-heading-line',
        wordsClass: 'hero-heading-word'
      });
      var tl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
      gsap.set(split.words, { yPercent: 101 });
      gsap.set(heading, { autoAlpha: 1 });
      tl.to(split.words, { yPercent: 0, duration: 1.109, stagger: 0.1, force3D: true }, 0.2);
      if (heroText) {
        gsap.set(heroText, { autoAlpha: 0, yPercent: 50 });
        tl.to(heroText, { autoAlpha: 1, yPercent: 0, duration: 0.9 }, 0.7);
      }
      if (heroButtons.length) {
        var mask = T.createReveal();
        Array.from(heroButtons).forEach(mask.maskButton);
        gsap.set(heroButtons, { yPercent: -110, autoAlpha: 1 });
        tl.to(heroButtons, { yPercent: 0, duration: 0.9, stagger: 0.12, force3D: true }, 0.95);
      }
      if (navbar) {
        gsap.set(navbar, { clipPath: 'inset(0% 0% 100% 0%)' });
        tl.to(navbar, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.1,
          onComplete: function () { gsap.set(navbar, { clearProps: 'clipPath' }); }
        }, 1.2);
      }
      tl.play(0);
    } else if (hero) {
      gsap.set(hero.querySelectorAll(HERO_ITEMS), { clearProps: 'opacity,visibility' });
    }

    var values = document.querySelector('.section_careers-values');
    var cards = values ? gsap.utils.toArray(values.querySelectorAll('.careers-values_card')) : [];

    /* ------------------------------------------------------------------ *
     * REVEAL — values и CTA
     * ------------------------------------------------------------------ */
    if (window.SplitText && !T.off('reveal')) {
      mm.add(NO_MOTION, function () {
        var r = T.createReveal();
        var timelineFor = r.timelineFor;
        var revealText = r.revealText;

        // VALUES — как tt-clients на Tetra Trust: метка и абзацы построчно,
        // карточки сетки появляются лесенкой (на мобилке — каждая по своему скроллу)
        if (values) {
          var split = values.querySelector('.careers-values_split') || values;
          var header = timelineFor(split);
          revealText(header, split.querySelector('.badge .eyebrow_text'), 0);
          split.querySelectorAll('.careers-values_text').forEach(function (p, i) {
            revealText(header, p, 0.08 + i * 0.08);
          });
          gsap.set(cards, { autoAlpha: 0, y: 32 });
          if (window.matchMedia('(max-width: 479px)').matches) {
            cards.forEach(function (card) {
              timelineFor(card, 'top 92%').to(card, { autoAlpha: 1, y: 0, duration: 0.7 }, 0);
            });
          } else {
            timelineFor(values.querySelector('.careers-values_grid') || values, 'top 85%')
              .to(cards, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12 }, 0);
          }
        }

        // CTA — как компонент CTA: заголовок пословно → текст → кнопка
        var cta = document.querySelector('.section_careers-cta');
        if (cta) {
          var ctaHeading = cta.querySelector('.careers-cta_heading');
          if (ctaHeading) revealText(timelineFor(ctaHeading), ctaHeading, 0);
          var ctaContent = timelineFor(cta.querySelector('.careers-cta_text-group') || cta);
          revealText(ctaContent, cta.querySelector('.careers-cta_text'), 0);
          r.revealButtons(ctaContent, cta.querySelectorAll('.careers-cta_button'), 0.2);
        }

        return function () {
          r.destroy();
          gsap.set(cards, { clearProps: 'opacity,visibility,transform' });
        };
      });
    }

    ScrollTrigger.refresh();
  }

  T.ready(boot);
})();

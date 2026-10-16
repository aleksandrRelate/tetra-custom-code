// Tetra — страница Careers (Figma 12906:664, мобилка 12909:2189).
// Подключается после tetra-core.js и tetra-page.js.
//   • hero — загрузка как на About: слова заголовка из маски, текст,
//     кнопка сверху через маску, navbar
//   • section_careers-values — reveal как у cadd-practice (метка, заголовок,
//     абзацы, карточки, цифры) + залипающая стопка карточек как на CADD
//   • section_careers-cta — reveal как у компонента CTA (tetra-cta.js)
// ?perf=careers выключает всё, ?perf=hero / reveal / stack — отдельные части.
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

    /* ------------------------------------------------------------------ *
     * SECTION_CAREERS-VALUES — стэк карточек (механика CADD practice):
     * карточки залипают на 4rem и стэкаются, у уходящей гаснет вся
     * карточка (opacity + лёгкий scale). Последнюю не гасим.
     * ------------------------------------------------------------------ */
    var values = document.querySelector('.section_careers-values');
    var cards = values ? gsap.utils.toArray(values.querySelectorAll('.careers-values_card')) : [];
    if (cards.length > 1 && !T.off('stack')) {
      mm.add(NO_MOTION, function () {
        var rootFontSize = parseFloat(s.fontSize) || 16;
        var cardTop = 4 * rootFontSize;
        var tw = [];
        cards.forEach(function (card, i) {
          card.style.position = 'sticky';
          card.style.top = cardTop + 'px';
          if (i === cards.length - 1) return;
          tw.push(gsap.to(card, {
            opacity: 0.18, scale: 0.985, transformOrigin: '50% 0%', ease: 'none',
            scrollTrigger: {
              trigger: cards[i + 1],
              start: 'top center',
              end: 'top 2.5rem',
              scrub: true,
              invalidateOnRefresh: true
            }
          }));
        });
        return function () {
          tw.forEach(function (t) { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
          cards.forEach(function (card) {
            card.style.position = ''; card.style.top = '';
            gsap.set(card, { clearProps: 'opacity,transform' });
          });
        };
      });
    }

    /* ------------------------------------------------------------------ *
     * REVEAL — values и CTA
     * ------------------------------------------------------------------ */
    if (window.SplitText && !T.off('reveal')) {
      mm.add(NO_MOTION, function () {
        var r = T.createReveal();
        var timelineFor = r.timelineFor;
        var revealText = r.revealText;

        // VALUES — как cadd-practice: шапка, абзацы, карточки и цифры
        if (values) {
          var left = values.querySelector('.careers-values_left') || values;
          var header = timelineFor(left);
          revealText(header, left.querySelector('.badge .eyebrow_text'), 0);
          revealText(header, left.querySelector('.careers-values_heading'), 0.08);
          left.querySelectorAll('.careers-values_text').forEach(function (p, i) {
            revealText(header, p, 0.16 + i * 0.08);
          });
          cards.forEach(function (card) {
            var entry = timelineFor(card);
            gsap.set(card, { autoAlpha: 0, y: 32, scale: 0.98, transformOrigin: '50% 100%' });
            entry.to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7 }, 0);
            revealText(entry, card.querySelector('.careers-values_card-heading'), 0.12);
            revealText(entry, card.querySelector('.careers-values_copy'), 0.22);
            var number = card.querySelector('.careers-values_number');
            if (number) revealText(timelineFor(number), number, 0, true);
          });
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
          // stack-твины гасят opacity/transform карточек — их не трогаем
          gsap.set(cards, { clearProps: 'visibility' });
        };
      });
    }

    ScrollTrigger.refresh();
  }

  T.ready(boot);
})();

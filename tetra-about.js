// Tetra — страница About (Figma 12684:962). Подключается после tetra-core.js
// и tetra-page.js.
//   • hero — загрузка как на Tetra Trust / лендинге: слова заголовка из маски,
//     текст, кнопка сверху через маску, navbar
//   • section_about-story — как section_intro лендинга (слова из маски +
//     пословная заливка muted → ink по scrub), но без pin
//   • section_about-team — шапка стандартно, карточки появляются лесенкой
//     (текст внутри карточек не анимируется)
//   • section_about-board — метка стандартно, логотип проявляется, строки
//     появляются по stagger (текст внутри строк не анимируется)
// ?perf=about выключает всё, ?perf=hero / reveal / intro — отдельные части.
(function () {
  var T = window.Tetra || (window.Tetra = {});
  var NO_MOTION = '(prefers-reduced-motion: no-preference)';

  // hero прячем сразу (до снятия .tetra-anim), а SplitText запускаем после
  // загрузки веб-шрифтов — иначе строки считаются по fallback-шрифту
  function boot() {
    if (!window.gsap || !window.ScrollTrigger || T.off('about')) return;
    var hero = document.querySelector('.section_about-hero');
    if (!hero) return;
    if (!T.off('hero')) {
      gsap.set(hero.querySelectorAll('.about-hero_heading, .about-hero_text, .about-hero_content .button'), { autoAlpha: 0 });
    }
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(init, init);
  }

  function init() {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    var mm = T.mm;
    var s = getComputedStyle(document.documentElement);

    /* ------------------------------------------------------------------ *
     * SECTION_ABOUT-HERO — тайминги/изинг как у hero Tetra Trust
     * ------------------------------------------------------------------ */
    var hero = document.querySelector('.section_about-hero');
    var heading = hero.querySelector('.about-hero_heading');
    var heroText = hero.querySelector('.about-hero_text');
    var heroButtons = hero.querySelectorAll('.about-hero_content .button');
    var navbar = document.querySelector('.navbar-wrapper');

    if (heading && window.SplitText && !T.off('hero')) {
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
        tl.to(heroText, { autoAlpha: 0.8, yPercent: 0, duration: 0.9 }, 0.7);
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
    } else {
      gsap.set(hero.querySelectorAll('.about-hero_heading, .about-hero_text, .about-hero_content .button'), { clearProps: 'opacity,visibility' });
    }

    /* ------------------------------------------------------------------ *
     * SECTION_ABOUT-STORY — как section_intro лендинга, без pin:
     * каждый абзац выезжает словами из маски при входе в экран,
     * а заливка muted → ink идёт по scrub, пока секция проходит экран
     * ------------------------------------------------------------------ */
    var story = document.querySelector('.section_about-story');
    var storyText = story && story.querySelector('.about-story_text');
    if (storyText && window.SplitText && !T.off('intro')) {
      var fill = s.getPropertyValue('--_tetra-tokens---color-ink').trim() || '#090e13';
      var base = s.getPropertyValue('--_tetra-tokens---color-muted').trim() || '#9E9E9E';
      mm.add(NO_MOTION, function () {
        var paragraphs = Array.from(storyText.querySelectorAll('.about-story_p'));
        var splits = [];
        var reveals = [];
        var words = [];
        paragraphs.forEach(function (p) {
          var sp = SplitText.create(p, { type: 'lines,words', linesClass: 'section-reveal-line' });
          splits.push(sp);
          words = words.concat(sp.words);
          reveals.push(gsap.from(sp.words, {
            yPercent: 101,
            duration: 0.555,
            stagger: 0.05,
            ease: 'power4.out',
            immediateRender: true,
            lazy: false,
            scrollTrigger: { trigger: p, start: 'top 85%', once: true }
          }));
        });
        gsap.set(words, { color: base });
        var fillTl = gsap.timeline({
          scrollTrigger: {
            trigger: storyText,
            start: 'top 75%',
            end: 'bottom 45%',
            scrub: 0.5,
            invalidateOnRefresh: true
          }
        });
        fillTl.to(words, { color: fill, ease: 'none', duration: 0.6, stagger: 1 });
        return function () {
          reveals.forEach(function (a) {
            if (a.scrollTrigger) a.scrollTrigger.kill();
            a.kill();
          });
          if (fillTl.scrollTrigger) fillTl.scrollTrigger.kill();
          fillTl.kill();
          splits.forEach(function (sp) { sp.revert(); });
        };
      });
    }

    /* ------------------------------------------------------------------ *
     * REVEAL — команда и совет директоров
     * ------------------------------------------------------------------ */
    if (window.SplitText && !T.off('reveal')) {
      mm.add(NO_MOTION, function () {
        var r = T.createReveal();
        var timelineFor = r.timelineFor;
        var revealText = r.revealText;
        var singleColumn = window.matchMedia('(max-width: 479px)').matches;

        // TEAM — шапка стандартно, карточки лесенкой без анимации текста
        var team = document.querySelector('.section_about-team');
        if (team) {
          var teamTl = timelineFor(team.querySelector('.about-team_layout') || team);
          revealText(teamTl, team.querySelector('.badge .eyebrow_text'), 0);
          revealText(teamTl, team.querySelector('.about-team_heading'), 0.08);
          var cards = team.querySelectorAll('.about-team_card');
          var gridTl = timelineFor(team.querySelector('.about-team_grid') || team, 'top 85%');
          gsap.set(cards, { autoAlpha: 0, y: 32 });
          gridTl.to(cards, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.15 }, 0);
        }

        // BOARD — метка стандартно, логотип проявляется, строки по stagger;
        // на мобилке список длинный — каждая строка по своему скроллу
        document.querySelectorAll('.section_about-board').forEach(function (board) {
          var introTl = timelineFor(board.querySelector('.about-board_layout') || board);
          revealText(introTl, board.querySelector('.badge .eyebrow_text'), 0);
          var logo = board.querySelector('.about-board_logo');
          if (logo) {
            gsap.set(logo, { autoAlpha: 0, y: 16 });
            introTl.to(logo, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.08);
          }
          var items = board.querySelectorAll('.about-board_item');
          gsap.set(items, { autoAlpha: 0, y: 24 });
          if (singleColumn) {
            items.forEach(function (item) {
              timelineFor(item, 'top 92%').to(item, { autoAlpha: 1, y: 0, duration: 0.7 }, 0);
            });
          } else {
            var listTl = timelineFor(board.querySelector('.about-board_list') || board, 'top 85%');
            listTl.to(items, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0);
          }
        });

        return function () {
          r.destroy();
          gsap.set('.about-team_card, .about-board_item, .about-board_logo', { clearProps: 'opacity,visibility,transform' });
        };
      });
    }
  }

  T.ready(boot);
})();

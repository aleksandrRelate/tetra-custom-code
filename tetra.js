// Tetra — custom scripts for the Webflow site.
// Source of truth: this repo. Webflow only links to the built file.
// Depends on jQuery, Webflow, GSAP + ScrollTrigger + SplitText and Lenis,
// all of which are loaded by tags placed BEFORE this file.
//
// PERF BISECT: add ?perf=<name>[,<name>] to the URL to switch subsystems off
// while diagnosing scroll jank. Names: partners, reveal, benefits, intro,
// trust, swiper, caddsvg, all. Example: ?perf=partners,caddsvg
window.__tetraPerfOff = (function () {
  try {
    var raw = (new URLSearchParams(location.search).get('perf') || '').toLowerCase();
    var set = {};
    raw.split(',').forEach(function (k) { k = k.trim(); if (k) set[k] = true; });
    return function (name) { return !!(set[name] || set.all); };
  } catch (e) {
    return function () { return false; };
  }
})();
if (window.__tetraPerfOff('caddsvg')) {
  var __cs = document.createElement('style');
  __cs.textContent = '#caddNetwork,.hero_bg-image.is-svg{display:none!important}';
  (document.head || document.documentElement).appendChild(__cs);
}


/* ===== Home scroll interactions (GSAP + ScrollTrigger + SplitText + Lenis) ===== */
(function () {
  function init() {
    // Основные интеракции требуют только GSAP и ScrollTrigger.
    // SplitText проверяется отдельно, чтобы его отсутствие не отключало navbar.
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    var mm = gsap.matchMedia();                        // брейкпоинты + автоочистка
    var s = getComputedStyle(document.documentElement); // читаем CSS-переменные (токены) и root font-size
    /* ------------------------------------------------------------------ *
     * 1. LENIS — плавный скролл, заведён на GSAP-тикер (без rAF-гонки)
     * не запускаем повторно и не конфликтуем с GSAP ScrollSmoother
     * На мобилке (<=479px) выключен: там нативный скролл телефона ведёт себя
     * лучше — не ломает скрытие адресной строки, системную инерцию и overscroll.
     * Слушаем брейкпоинт, чтобы ресайз через границу тоже отрабатывал.
     * ------------------------------------------------------------------ */
    var lenisMq = window.matchMedia('(max-width: 479px)');
    var lenisTick = null;

    function startLenis() {
      if (!window.Lenis || window.lenis) return;
      if (window.ScrollSmoother && ScrollSmoother.get && ScrollSmoother.get()) return;
      var lenis = new Lenis({ lerp: 0.16, smoothWheel: true, wheelMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);                 // ST следит за lenis-скроллом
      lenisTick = function (time) { lenis.raf(time * 1000); };
      gsap.ticker.add(lenisTick);
      gsap.ticker.lagSmoothing(0);
      window.lenis = lenis;                                     // доступ снаружи: lenis.scrollTo(...)
    }

    function stopLenis() {
      if (!window.lenis) return;
      if (lenisTick) { gsap.ticker.remove(lenisTick); lenisTick = null; }
      window.lenis.destroy();                                   // снимает слушатели и классы .lenis
      window.lenis = null;
      gsap.ticker.lagSmoothing(500, 33);                        // дефолт GSAP обратно
      ScrollTrigger.refresh();
    }

    function syncLenis() { lenisMq.matches ? stopLenis() : startLenis(); }

    syncLenis();
    lenisMq.addEventListener('change', syncLenis);
    /* ------------------------------------------------------------------ *
     * 1b. HERO — единая хореография при загрузке страницы
     * background → heading → text → buttons → navbar
     * ------------------------------------------------------------------ */
    var heroBg = document.querySelector('.hero_bg-image');
    var heroHeading = document.querySelector('.hero_heading');
    var heroText = document.querySelector('.hero_text');
    var heroButtons = gsap.utils.toArray('.hero_button-group .hero-button');
    var heroNavbar = document.querySelector('.navbar-wrapper');
    if (heroHeading && window.SplitText) {
      var heroHeadingSplit = SplitText.create(heroHeading, {
        type: 'lines,words',
        linesClass: 'hero-heading-line',
        wordsClass: 'hero-heading-word'
      });
      var heroTimeline = gsap.timeline({
        paused: true,
        defaults: {
          ease: 'power4.out'
        }
      });
      if (heroBg) {
        gsap.set(heroBg, {
          autoAlpha: 0,
          scale: 1.08,
          transformOrigin: '50% 50%'
        });
        heroTimeline.to(heroBg, {
          autoAlpha: 1,
          scale: 1,
          duration: 1.4
        }, 0);
      }
      gsap.set(heroHeadingSplit.words, {
        yPercent: 101
      });
      heroTimeline.to(heroHeadingSplit.words, {
        yPercent: 0,
        duration: 1.109,
        stagger: 0.1,
        force3D: true
      }, 0.35);
      if (heroText) {
        gsap.set(heroText, {
          autoAlpha: 0,
          yPercent: 50
        });
        heroTimeline.to(heroText, {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.9
        }, 0.85);
      }
      if (heroButtons.length) {
        gsap.set(heroButtons, {
          yPercent: -110
        });
        heroTimeline.to(heroButtons, {
          yPercent: 0,
          duration: 0.9,
          stagger: 0.12,
          force3D: true
        }, 1.1);
      }
      if (heroNavbar) {
        gsap.set(heroNavbar, {
          clipPath: 'inset(0% 0% 100% 0%)'
        });
        heroTimeline.to(heroNavbar, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.1,
          onComplete: function () {
            gsap.set(heroNavbar, {
              clearProps: 'clipPath'
            });
          }
        }, 1.35);
      }
      function playHeroTimeline() {
        heroTimeline.play(0);
      }
      if (document.readyState === 'complete') {
        playHeroTimeline();
      } else {
        window.addEventListener('load', playHeroTimeline, { once: true });
      }
    }
    /* ------------------------------------------------------------------ *
     * 2. SECTION_INTRO — pin + пословная заливка цветом intro_heading
     * секция пинится на 150vh, слова меняют цвет muted → ink по scrub
     * ------------------------------------------------------------------ */
    var intro = document.querySelector('.section_intro');
    var heading = intro && intro.querySelector('.intro_heading');
    if (heading && window.SplitText && !window.__tetraPerfOff('intro')) {
      var fill = s.getPropertyValue('--_tetra-tokens---color-ink').trim() || '#251915';
      var base = s.getPropertyValue('--_tetra-tokens---color-muted').trim() || '#9E9E9E';
      mm.add('(min-width: 768px)', function () {
        var split = SplitText.create(heading, {
          type: 'lines,words',
          linesClass: 'section-reveal-line'
        });
        gsap.set(split.words, { color: base });
        var introReveal = gsap.from(split.words, {
          yPercent: 101,
          duration: 0.555,
          stagger: 0.05,
          ease: 'power4.out',
          immediateRender: true,
          lazy: false,
          scrollTrigger: { trigger: heading, start: 'top 80%', once: true }
        });
        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: intro,
            start: 'top top',
            end: '+=150%',            // длина пина = 150vh
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            refreshPriority: 1,      // пин пересчитывается раньше остальных триггеров
            invalidateOnRefresh: true
          }
        });
        tl.to(split.words, { color: fill, ease: 'none', duration: 0.6, stagger: 1 });
        return function () {
          if (introReveal.scrollTrigger) introReveal.scrollTrigger.kill();
          introReveal.kill();
          if (tl.scrollTrigger) tl.scrollTrigger.kill();
          tl.kill();
          split.revert();
        };
      });
    }
    /* ------------------------------------------------------------------ *
     * 3. SECTION_BENEFITS — sticky-стопка карточек
     *  • badge НЕ закрепляется — остаётся в обычном потоке
     *  • карточки залипают в самый верх вьюпорта (top: 0)
     *  • у уходящей карточки затухает только .benefits_item-content (opacity + лёгкий scale)
     * ------------------------------------------------------------------ */
    var items = gsap.utils.toArray('.section_benefits .benefits_item');
    if (items.length > 1 && !window.__tetraPerfOff('benefits')) {
      mm.add('(min-width: 480px)', function () {
        var cardTop = 0;                                // карточки упираются в верх вьюпорта
        var tw = [];
        items.forEach(function (item, i) {
          item.style.position = 'sticky';
          item.style.top = cardTop + 'px';
          if (i === items.length - 1) return;          // последнюю не гасим — её никто не перекрывает
          var content = item.querySelector('.benefits_item-content');
          if (!content) return;
          tw.push(gsap.to(content, {
            opacity: 0.18, scale: 0.985, transformOrigin: '50% 0%', ease: 'none',
            scrollTrigger: {
              trigger: items[i + 1],                    // триггер — следующая карточка
              start: 'top center',
              end: 'top top',
              scrub: true,
              invalidateOnRefresh: true
            }
          }));
        });
        // очистка при смене брейкпоинта
        return function () {
          tw.forEach(function (t) { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
          items.forEach(function (item) {
            item.style.position = ''; item.style.top = '';
            var c = item.querySelector('.benefits_item-content');
            if (c) gsap.set(c, { clearProps: 'opacity,transform' });
          });
        };
      });
    }
    /* ------------------------------------------------------------------ *
     * 4. SECTION_TRUST — scale 0.95 → 1 напрямую по скроллу
     * ------------------------------------------------------------------ */
    var trust = document.querySelector('.section_trust');
    if (trust && !window.__tetraPerfOff('trust')) {
      // Только от 480px: scrub-масштабирование секции во весь экран заставляет
      // телефон перерисовывать огромную площадь на каждом кадре скролла.
      mm.add('(min-width: 480px)', function () {
        var trustScale = gsap.fromTo(trust, { scale: 0.95 }, {
          scale: 1,
          transformOrigin: '50% 50%',
          ease: 'none',
          scrollTrigger: {
            trigger: trust,
            start: 'top bottom',
            end: 'top 50%',
            scrub: true,
            invalidateOnRefresh: true
          }
        });
        return function () {
          if (trustScale.scrollTrigger) trustScale.scrollTrigger.kill();
          trustScale.kill();
          gsap.set(trust, { clearProps: 'transform' });
        };
      });
    }
    /* ------------------------------------------------------------------ *
     * 5. PARTNERS_GRID — бесконечная лента логотипов
     *  • ряд 1 едет влево, ряд 2 вправо; контент клонируется 1 раз → бесшовно
     *  • вне вьюпорта — pause(); в вьюпорте — resume()
     *  • скорость зависит от скорости скролла: вниз — быстрее, вверх — разворот
     * ------------------------------------------------------------------ */
    var pWrap = document.querySelector('.section_partners .partners_grid');
    if (pWrap && !window.__tetraPerfOff('partners')) {
      var pRows = Array.prototype.slice.call(pWrap.querySelectorAll('.partners-row'));
      pWrap.style.overflow = 'hidden';                  // обрезаем уехавшие копии
      var pLoops = [];
      function buildMarquee() {
        var previous = pLoops.map(function (t) {
          return { progress: t.progress(), speed: t.timeScale() };
        });
        pLoops.forEach(function (t) { t.kill(); });
        pLoops = [];
        pRows.forEach(function (row, ri) {
          // клонируем детей один раз (чтобы хватило на цикл)
          if (!row.dataset.cloned) {
            var kids = Array.prototype.slice.call(row.children);
            kids.forEach(function (n) { row.appendChild(n.cloneNode(true)); });
            row.dataset.cloned = '1';
            row.dataset.count = kids.length;
          }
          row.style.display = 'flex';
          row.style.flexWrap = 'nowrap';
          row.style.width = 'max-content';
          gsap.set(row, { x: 0 });
          // точная ширина одного набора = сумма (плитка + gap) → без дрейфа на стыке
          var cs = getComputedStyle(row);
          var gap = parseFloat(cs.columnGap || cs.gap) || 0;
          var n = parseInt(row.dataset.count, 10);
          var w = 0;
          for (var k = 0; k < n; k++) { w += row.children[k].getBoundingClientRect().width + gap; }
          var dir = ri % 2 === 0 ? -1 : 1;              // чётный ряд — влево, нечётный — вправо
          var t = gsap.fromTo(row,
            { x: dir < 0 ? 0 : -w },
            {
              x: dir < 0 ? -w : 0,
              duration: w / 40, ease: 'none', repeat: -1, // ≈ 40px/с
              // repeat бесконечен вперёд, но reverse упирается в totalTime = 0.
              // Перенос на целые циклы сохраняет позицию и продолжает движение.
              onReverseComplete: function () {
                this.totalTime(this.rawTime() + this.duration() * 100);
              }
            }
          );
          t.pause();
          t.totalTime(t.duration() * 100, true);
          if (previous[ri]) {
            t.totalTime(t.duration() * (100 + previous[ri].progress), true);
            t.timeScale(previous[ri].speed);
          }
          if (pActive) t.resume();
          pLoops.push(t);
        });
      }
      buildMarquee();
      // модуляция скорости: считаем скорость скролла сами (не через
      // ScrollTrigger.getVelocity — она нестабильна с Lenis) и через gsap.ticker
      // плавно тянем timeScale лент к цели, а цель в покое оседает к +1.
      //  • вниз — сильный разгон в обычном направлении ленты
      //  • вверх — лента разворачивается (timeScale < 0)
      //  • скролл остановился — плавно возвращается к обычному ходу
      var pActive = false;
      var pTarget = 1;                 // желаемый timeScale (может быть < 0 → реверс)
      var pSettled = true;             // нечего анимировать — тикер можно пропускать
      var pLastY = window.scrollY;
      var pLastT = (window.performance && performance.now()) || Date.now();
      ScrollTrigger.create({
        trigger: '.section_partners', start: 'top bottom', end: 'bottom top',
        onToggle: function (self) {
          pActive = self.isActive;
          pLastY = window.scrollY;
          pLastT = (window.performance && performance.now()) || Date.now();
          pLoops.forEach(function (t) { pActive ? t.resume() : t.pause(); });
        }
      });
      function pOnScroll() {
        if (!pActive) return;
        var y = window.scrollY;
        var now = (window.performance && performance.now()) || Date.now();
        var dt = Math.max(now - pLastT, 16) / 1000;
        var dy = y - pLastY;
        pLastY = y;
        pLastT = now;
        if (!dy) return;
        var v = Math.abs(dy) / dt;                  // px/с
        var down = dy > 0;
        var div = down ? 140 : 190;
        var cap = down ? 24 : 12;
        var mag = 1 + Math.min(v / div, cap);
        pTarget = down ? mag : -mag;                // вверх → разворот ленты
        pSettled = false;
      }
      window.addEventListener('scroll', pOnScroll, { passive: true });
      if (window.lenis && window.lenis.on) window.lenis.on('scroll', pOnScroll);
      gsap.ticker.add(function () {
        // В покое (скорость уже вернулась к 1) выходим сразу — иначе этот колбэк
        // дёргает твины каждый кадр всю жизнь страницы и ест кадры на скролле.
        if (!pLoops.length || pSettled) return;
        pTarget += (1 - pTarget) * 0.05;            // цель плавно оседает к +1 → инерция
        if (Math.abs(pTarget - 1) < 0.001) pTarget = 1;
        var settled = pTarget === 1;
        pLoops.forEach(function (t) {
          var cur = t.timeScale();
          var next = cur + (pTarget - cur) * 0.12;
          if (Math.abs(next - pTarget) < 0.001) next = pTarget;
          if (next !== cur) t.timeScale(next);
          if (Math.abs(next - 1) > 0.001) settled = false;
        });
        pSettled = settled;
      });
      // На мобилке (<=479px) адресная строка меняет высоту viewport при скролле.
      // Пересобираем только при смене ширины, сохраняя фазу и состояние лент.
      var rt;
      var pViewportWidth = document.documentElement.clientWidth;
      window.addEventListener('resize', function () {
        var width = document.documentElement.clientWidth;
        if (width === pViewportWidth) return;
        pViewportWidth = width;
        clearTimeout(rt);
        rt = setTimeout(buildMarquee, 200);
      });
    }
    /* ------------------------------------------------------------------ *
     * 6. NAVBAR
     *  6a. вниз уезжает banner и скрывается logo;
     *      nav-menu и nav-bttns-wrap остаются видимыми
     *  6b. переключение цвета по атрибуту секций [navbar-color]:
     *      white → текст/лого белые
     *      black → текст/лого color--dark, тёмные glass-состояния меню
     *  .is-nav-bttn не участвует в переключении темы
     *  лого — инлайн-SVG с fill="currentColor", меняется через style.color
     *  создаётся ПОСЛЕДНИМ — чтобы учесть pin-spacer запиненного section_intro
     * ------------------------------------------------------------------ */
    var navRoot = document.querySelector('.navbar');
    var navWrapper = document.querySelector('.navbar-wrapper');
    // 6a. Убираем banner и logo, оставляя само меню видимым.
    if (navWrapper) {
      var navBanner = navWrapper.querySelector('.section_banner');
      var scrollLogo = navWrapper.querySelector('.navbar-logo');
      var bannerH = navBanner ? navBanner.offsetHeight : 0;
      var navCompact = false;
      var lastScrollY = window.scrollY;
      var scrollTicking = false;
      navWrapper.style.willChange = 'transform';
      navWrapper.style.transition = 'transform 350ms ease';
      var logoMobileMq = window.matchMedia('(max-width: 479px)');
      function updateScrollLogo() {
        if (!scrollLogo) return;
        var mobile = logoMobileMq.matches;
        var hidden = !mobile && navCompact;
        scrollLogo.style.willChange = mobile ? 'auto' : 'transform, opacity';
        scrollLogo.style.transition = mobile ? 'none' : 'transform 350ms ease, opacity 250ms ease';
        scrollLogo.style.opacity = hidden ? '0' : '1';
        scrollLogo.style.transform = hidden ? 'translate3d(0, -100%, 0)' : 'none';
        scrollLogo.style.pointerEvents = hidden ? 'none' : '';
      }
      updateScrollLogo();
      logoMobileMq.addEventListener('change', updateScrollLogo);
      function setNavbarPosition(compactNavbar) {
        if (navCompact === compactNavbar) return;
        navCompact = compactNavbar;
        navWrapper.style.transform = compactNavbar
          ? 'translate3d(0, -' + bannerH + 'px, 0)'
          : 'translate3d(0, 0, 0)';
        updateScrollLogo();
      }
      function updateNavbarPosition() {
        var currentScrollY = window.scrollY;
        if (currentScrollY <= 0) {
          setNavbarPosition(false);
        } else if (currentScrollY > lastScrollY) {
          setNavbarPosition(true);
        } else if (currentScrollY < lastScrollY) {
          setNavbarPosition(false);
        }
        lastScrollY = currentScrollY;
        scrollTicking = false;
      }
      window.addEventListener('scroll', function () {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(updateNavbarPosition);
      }, { passive: true });
      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          bannerH = navBanner ? navBanner.offsetHeight : 0;
          if (navCompact) {
            navWrapper.style.transform =
              'translate3d(0, -' + bannerH + 'px, 0)';
          }
        }, 200);
      });
    }
    if (navRoot) {
      var navLinks = navRoot.querySelectorAll('.navbar-container .nav-link');
      var navLogo = navRoot.querySelector('.navbar-container .navbar-logo-svg');
      var WHITE = '#FFFFFF';
      var DARK = s.getPropertyValue('--_tetra-tokens---color-dark').trim() || '#110E0C';
      var navOffset = 6 * (parseFloat(s.fontSize) || 16); // линия переключения цвета, px (= 6rem)
      // 6b. переключение цвета
      function applyNav(key) {
        var dark = key === 'black';
        var text = dark ? DARK : WHITE;
        navRoot.classList.toggle('is-theme-dark', dark);
        navLinks.forEach(function (el) { el.style.color = text; });
        if (navLogo) navLogo.style.color = text;
      }
      var navSecs = gsap.utils.toArray('[navbar-color]');
      navSecs.forEach(function (sec) {
        ScrollTrigger.create({
          trigger: sec,
          start: 'top ' + navOffset + 'px',       // верх секции пересёк линию navOffset
          end: 'bottom ' + navOffset + 'px',
          refreshPriority: -1,
          onToggle: function (self) { if (self.isActive) applyNav(sec.getAttribute('navbar-color')); }
        });
      });
      // на каждом refresh/resize — сразу выставить цвет текущей секции (в т.ч. внутри пина)
      ScrollTrigger.addEventListener('refreshInit', function () {
        var y = window.scrollY + navOffset + 1;
        for (var i = navSecs.length - 1; i >= 0; i--) {
          var r = navSecs[i].getBoundingClientRect();
          var top = r.top + window.scrollY;
          if (y >= top && y < top + r.height) { applyNav(navSecs[i].getAttribute('navbar-color')); break; }
        }
      });
    }
    /* SECTION REVEALS: Benefits, Trust, About, Partners, CTA, Footer.
     * Общие параметры: слова 0.555s / stagger 0.05s;
     * кнопки — как hero, сверху вниз через маску, 0.9s / 0.12s.
     */
    if (window.SplitText && !window.__tetraPerfOff('reveal')) {
      mm.add('(prefers-reduced-motion: no-preference)', function () {
        var splits = [];
        var reveals = [];
        function timelineFor(element, start) {
          var timeline = gsap.timeline({
            defaults: { ease: 'power4.out' },
            scrollTrigger: {
              trigger: element,
              start: start || 'top 80%',
              once: true
            }
          });
          reveals.push(timeline);
          return timeline;
        }
        function revealText(timeline, element, position, chars) {
          if (!element) return;
          var split = SplitText.create(element, {
            type: chars ? 'lines,chars' : 'lines,words',
            linesClass: 'section-reveal-line'
          });
          splits.push(split);
          var targets = chars ? split.chars : split.words;
          gsap.set(targets, { yPercent: 101 });
          timeline.to(targets, {
            yPercent: 0,
            duration: 0.555,
            stagger: 0.05,
            force3D: true
          }, position || 0);
        }
        function maskButton(button) {
          if (button.parentElement.classList.contains('button-entry-mask')) return;
          var mask = document.createElement('div');
          mask.className = 'button-entry-mask';
          var style = getComputedStyle(button);
          mask.style.alignSelf = style.alignSelf;
          mask.style.flex = style.flex;
          button.before(mask);
          mask.appendChild(button);
        }
        function revealButtons(timeline, buttons, position) {
          if (!buttons.length) return;
          Array.from(buttons).forEach(maskButton);
          gsap.set(buttons, { yPercent: -110 });
          timeline.to(buttons, {
            yPercent: 0,
            duration: 0.9,
            stagger: 0.12,
            force3D: true
          }, position);
        }
        document.querySelectorAll('.section_benefits .badge .eyebrow_text').forEach(function (el) {
          revealText(timelineFor(el), el, 0);
        });
        document.querySelectorAll('.section_benefits .benefits_item').forEach(function (item) {
          var timeline = timelineFor(item);
          revealText(timeline, item.querySelector('.benefits_item-heading'), 0);
          revealText(timeline, item.querySelector('.benefits_item-copy'), 0.12);
          revealText(timeline, item.querySelector('.benefits_item-image-text'), 0.2, true);
        });
        var trustSection = document.querySelector('.section_trust');
        if (trustSection) {
          var headerTimeline = timelineFor(trustSection.querySelector('.trust_header') || trustSection);
          revealText(headerTimeline, trustSection.querySelector('.badge .eyebrow_text'), 0);
          revealText(headerTimeline, trustSection.querySelector('.trust_heading'), 0.08);
          revealText(headerTimeline, trustSection.querySelector('.trust_intro-text'), 0.22);
          revealButtons(headerTimeline, trustSection.querySelectorAll('.button'), 0.3);
          trustSection.querySelectorAll('.trust_card').forEach(function (card, index) {
            var cardTimeline = timelineFor(card);
            var delay = index * 0.12;
            gsap.set(card, { autoAlpha: 0, y: 32, scale: 0.98, transformOrigin: '50% 100%' });
            cardTimeline.to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7 }, delay);
            revealText(cardTimeline, card.querySelector('.trust_card-heading'), delay + 0.12);
            revealText(cardTimeline, card.querySelector('.trust_card-copy'), delay + 0.22);
          });
        }
        var aboutSection = document.querySelector('.section_about');
        if (aboutSection) {
          var aboutHeader = timelineFor(aboutSection.querySelector('.about_header') || aboutSection);
          revealText(aboutHeader, aboutSection.querySelector('.badge .eyebrow_text'), 0);
          revealText(aboutHeader, aboutSection.querySelector('.about_heading'), 0.08);
          var aboutContent = timelineFor(aboutSection.querySelector('.about_content') || aboutSection);
          revealText(aboutContent, aboutSection.querySelector('.about_text'), 0);
          revealButtons(aboutContent, aboutSection.querySelectorAll('.about_button-group .button'), 0.2);
        }
        document.querySelectorAll('.section_partners .partners_heading, .section_partners .badge .eyebrow_text').forEach(function (el) {
          revealText(timelineFor(el), el, 0);
        });
        var ctaSection = document.querySelector('.section_cta');
        if (ctaSection) {
          var ctaHeading = ctaSection.querySelector('.cta_heading');
          if (ctaHeading) revealText(timelineFor(ctaHeading), ctaHeading, 0);
          var ctaContent = timelineFor(ctaSection.querySelector('.cta_text-group') || ctaSection);
          revealText(ctaContent, ctaSection.querySelector('.cta_text'), 0);
          revealButtons(ctaContent, ctaSection.querySelectorAll('.cta-button'), 0.2);
        }
        var footer = document.querySelector('.section_footer');
        if (footer) {
          var backToTop = footer.querySelector('.footer_back-to-top');
          if (backToTop) {
            maskButton(backToTop);
            revealButtons(timelineFor(backToTop.parentElement, 'clamp(top 80%)'), [backToTop], 0);
          }
          footer.querySelectorAll('.footer_menu-column').forEach(function (column) {
            var columnTimeline = timelineFor(column, 'clamp(top 80%)');
            revealText(columnTimeline, column.querySelector('.footer_menu-title'), 0);
            var links = column.querySelectorAll('.footer_menu-link');
            if (links.length) {
              gsap.set(links, { autoAlpha: 0, y: 20 });
              columnTimeline.to(links, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.12);
            }
          });
          var wordmark = footer.querySelector('.footer_wordmark');
          if (wordmark) {
            gsap.set(wordmark, { clipPath: 'inset(100% 0% 0% 0%)' });
            timelineFor(wordmark, 'clamp(top 80%)').to(wordmark, {
              clipPath: 'inset(0% 0% 0% 0%)',
              duration: 1.1,
              onComplete: function () { gsap.set(wordmark, { clearProps: 'clipPath' }); }
            }, 0);
          }
          footer.querySelectorAll('.footer_legal-text').forEach(function (el) {
            revealText(timelineFor(el, 'clamp(top 80%)'), el, 0);
          });
        }
        return function () {
          reveals.forEach(function (animation) {
            if (animation.scrollTrigger) animation.scrollTrigger.kill();
            animation.kill();
          });
          splits.forEach(function (split) { split.revert(); });
        };
      });
    }
    // Footer wordmark: пульс обводки по ховеру — радиальный градиент следует за
    // курсором, в центре базовый #CE191D, к краю #EBEDF4; радиус «дышит».
    var footerWordmark = document.querySelector('.section_footer .footer_wordmark');
    if (footerWordmark) {
      mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', function () {
        var SVGNS = 'http://www.w3.org/2000/svg';
        var BASE = '#CE191D';
        var PULSE = '#EBEDF4';
        var path = Array.prototype.slice.call(footerWordmark.children).filter(function (el) {
          return el.tagName.toLowerCase() === 'path';
        }).pop();
        if (!path) return;
        var vb = footerWordmark.viewBox && footerWordmark.viewBox.baseVal;
        var vbW = vb && vb.width ? vb.width : 1392;
        var vbH = vb && vb.height ? vb.height : 289;
        var originalFill = path.getAttribute('fill') || BASE;

        var grad = document.createElementNS(SVGNS, 'radialGradient');
        var gid = 'footer-wordmark-pulse';
        grad.setAttribute('id', gid);
        grad.setAttribute('gradientUnits', 'userSpaceOnUse');
        grad.setAttribute('cx', vbW / 2);
        grad.setAttribute('cy', vbH / 2);
        grad.setAttribute('r', vbW);
        var stop0 = document.createElementNS(SVGNS, 'stop');
        stop0.setAttribute('offset', '0');
        stop0.setAttribute('stop-color', BASE);
        var stop1 = document.createElementNS(SVGNS, 'stop');
        stop1.setAttribute('offset', '1');
        stop1.setAttribute('stop-color', PULSE);
        grad.appendChild(stop0);
        grad.appendChild(stop1);
        var defs = document.createElementNS(SVGNS, 'defs');
        defs.appendChild(grad);
        footerWordmark.insertBefore(defs, footerWordmark.firstChild);

        // прозрачная область для стабильного хит-теста по всему знаку
        var hit = document.createElementNS(SVGNS, 'rect');
        hit.setAttribute('x', '0');
        hit.setAttribute('y', '0');
        hit.setAttribute('width', vbW);
        hit.setAttribute('height', vbH);
        hit.setAttribute('fill', 'transparent');
        footerWordmark.appendChild(hit);

        var R_MIN = vbW * 0.15;
        var R_MAX = vbW * 0.30;
        var pulse = null;
        var hovering = false;

        function toSvgPoint(event) {
          var rect = footerWordmark.getBoundingClientRect();
          return {
            x: (event.clientX - rect.left) / rect.width * vbW,
            y: (event.clientY - rect.top) / rect.height * vbH
          };
        }
        function startPulse() {
          if (!hovering) return;
          if (pulse) pulse.kill();
          pulse = gsap.fromTo(grad,
            { attr: { r: R_MAX } },
            { attr: { r: R_MIN }, duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true }
          );
        }
        function onEnter(event) {
          hovering = true;
          gsap.killTweensOf(grad);
          if (pulse) { pulse.kill(); pulse = null; }
          var p = toSvgPoint(event);
          // стартуем с большого радиуса (весь знак = BASE) и плавно стягиваем —
          // цвет въезжает через транзишн, без резкого скачка
          gsap.set(grad, { attr: { cx: p.x, cy: p.y, r: vbW * 1.4 } });
          path.setAttribute('fill', 'url(#' + gid + ')');
          gsap.to(grad, {
            attr: { r: R_MAX },
            duration: 0.55,
            ease: 'power2.out',
            onComplete: startPulse
          });
        }
        function onMove(event) {
          if (!hovering) return;
          var p = toSvgPoint(event);
          gsap.to(grad, { attr: { cx: p.x, cy: p.y }, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        }
        function onLeave() {
          hovering = false;
          if (pulse) { pulse.kill(); pulse = null; }
          gsap.killTweensOf(grad);
          gsap.to(grad, {
            attr: { r: vbW * 1.4 },
            duration: 0.55,
            ease: 'power2.out',
            onComplete: function () { path.setAttribute('fill', originalFill); }
          });
        }
        footerWordmark.addEventListener('pointerenter', onEnter);
        footerWordmark.addEventListener('pointermove', onMove);
        footerWordmark.addEventListener('pointerleave', onLeave);

        return function () {
          if (pulse) pulse.kill();
          gsap.killTweensOf(grad);
          footerWordmark.removeEventListener('pointerenter', onEnter);
          footerWordmark.removeEventListener('pointermove', onMove);
          footerWordmark.removeEventListener('pointerleave', onLeave);
          if (defs.parentNode) defs.parentNode.removeChild(defs);
          if (hit.parentNode) hit.parentNode.removeChild(hit);
          path.setAttribute('fill', originalFill);
        };
      });
    }
    /* ------------------------------------------------------------------ *
     * SECTION_ABOUT — появление схемы about-card-animation
     *  1. загорается центральная точка (.about-card-lines-wrapper > .about-card-dot)
     *  2. все 5 линий (.about-card-lines + .about-card-lines-long) прорисовываются
     *     разом, сверху вниз
     *  3. по очереди появляются .about-card: сначала её .about-card-dot,
     *     затем контент (h3 + .about-card-text)
     * ------------------------------------------------------------------ */
    var aboutAnim = document.querySelector('.section_about .about-card-animation');
    if (aboutAnim) {
      mm.add('(prefers-reduced-motion: no-preference)', function () {
        var linesWrapper = aboutAnim.querySelector('.about-card-lines-wrapper');
        var hubDot = linesWrapper && linesWrapper.querySelector('.about-card-dot');
        var lines = linesWrapper
          ? Array.prototype.slice.call(linesWrapper.querySelectorAll('line, path'))
          : [];
        var cards = Array.prototype.slice.call(aboutAnim.querySelectorAll('.about_content .about-card'));

        // исходные состояния
        if (hubDot) gsap.set(hubDot, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' });
        var lineLengths = lines.map(function (line) {
          var len = 0;
          try { len = line.getTotalLength(); } catch (e) { len = 0; }
          if (len) gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
          return len;
        });
        var cardParts = cards.map(function (card) {
          var dot = card.querySelector('.about-card-dot');
          var content = Array.prototype.slice.call(card.children).filter(function (el) {
            return el !== dot;
          });
          if (dot) gsap.set(dot, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' });
          if (content.length) gsap.set(content, { autoAlpha: 0, y: 14 });
          gsap.set(card, { borderColor: 'rgba(229, 229, 229, 0)' }); // обводка скрыта до появления
          return { card: card, dot: dot, content: content };
        });

        var tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: { trigger: aboutAnim, start: 'top 75%', once: true }
        });

        // 1. центральная точка
        if (hubDot) {
          tl.to(hubDot, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 0);
        }
        // 2. линии — все разом, сверху вниз
        if (lines.length) {
          tl.to(lines, {
            strokeDashoffset: 0,
            duration: 0.9,
            ease: 'power2.inOut'
          }, 0.35);
        }
        // 3. карточки: точка → контент, по очереди
        var cardsStart = 0.35 + 0.9 + 0.1;
        cardParts.forEach(function (part, i) {
          var at = cardsStart + i * 0.22;
          tl.to(part.card, { borderColor: 'rgba(229, 229, 229, 1)', duration: 0.45 }, at);
          if (part.dot) {
            tl.to(part.dot, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, at);
          }
          if (part.content.length) {
            tl.to(part.content, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, at + 0.12);
          }
        });

        return function () {
          if (tl.scrollTrigger) tl.scrollTrigger.kill();
          tl.kill();
          if (hubDot) gsap.set(hubDot, { clearProps: 'opacity,visibility,transform' });
          lines.forEach(function (line, i) {
            if (lineLengths[i]) gsap.set(line, { clearProps: 'strokeDasharray,strokeDashoffset' });
          });
          cardParts.forEach(function (part) {
            gsap.set(part.card, { clearProps: 'borderColor' });
            if (part.dot) gsap.set(part.dot, { clearProps: 'opacity,visibility,transform' });
            if (part.content.length) gsap.set(part.content, { clearProps: 'opacity,visibility,transform' });
          });
        };
      });
    }
    ScrollTrigger.refresh(); // финальный пересчёт после создания всех триггеров
  }
  // запуск
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
})();

/* ===== buttons animation ===== */
(function () {
  "use strict";
  var CANDIDATE_SELECTOR =
    'a[href], button, [role="button"]';
  var hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
  var NAV_ROOT_SELECTOR =
    '.navbar, .w-nav, header nav, header [role="navigation"]';
  var GENERATED_SELECTOR =
    '.btn-reveal__viewport';
  var TEXT_EXCLUDE_SELECTOR = [
    "svg",
    "img",
    "picture",
    "video",
    "canvas",
    "[aria-hidden='true']",
    ".w-visually-hidden",
    "[class*='visually-hidden']",
    "[class*='sr-only']",
    "[class*='icon']",
    "[class*='arrow']"
  ].join(",");
  var state =
    window.__tetraLineReveal ||
    (window.__tetraLineReveal = {
      observer: null
    });
  function isGenerated(element) {
    return Boolean(
      element.closest &&
      element.closest(GENERATED_SELECTOR)
    );
  }
  function shouldSkip(element) {
    if (!element || element.nodeType !== 1) return true;
    if (element.dataset.btnReveal === "true") return true;
    if (isGenerated(element)) return true;
    if (
      element.closest &&
      element.closest("[data-line-reveal-skip]")
    ) {
      return true;
    }
    if (
      element.matches(
        [
          "input",
          "select",
          "textarea",
          "[disabled]",
          "[aria-disabled='true']",
          "[hidden]",
          ".w-nav-brand",
          "[class*='logo']"
        ].join(",")
      )
    ) {
      return true;
    }
    if (
      element.closest &&
      element.closest("[hidden], [aria-hidden='true']")
    ) {
      return true;
    }
    /*
     * Не обрабатываем кликабельные контейнеры,
     * внутри которых находятся другие кнопки/ссылки.
     */
    if (
      element.querySelector(
        'a[href], button, [role="button"]'
      )
    ) {
      return true;
    }
    /*
     * Исключаем большие кликабельные карточки.
     * При необходимости это можно переопределить,
     * добавив data-line-reveal-force.
     */
    if (
      !element.hasAttribute("data-line-reveal-force") &&
      element.querySelector(
        "h1, h2, h3, h4, h5, h6, article"
      )
    ) {
      return true;
    }
    return false;
  }
  function firstTextNode(element) {
    var walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (
            !node.nodeValue ||
            !node.nodeValue.trim()
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          var parent = node.parentElement;
          if (!parent) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest(TEXT_EXCLUDE_SELECTOR)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    return walker.nextNode();
  }
  function enhance(element, category) {
    if (shouldSkip(element)) return false;
    var textNode = firstTextNode(element);
    if (!textNode) return false;
    var text = textNode.nodeValue.trim();
    if (!text) return false;
    element.dataset.btnReveal = "true";
    element.dataset.btnRevealCategory =
      category || "button";
    element.classList.add("btn-reveal");
    if (category === "navbar") {
      element.classList.add("btn-nav-reveal");
    }
    var viewport = document.createElement("span");
    var track = document.createElement("span");
    var primary = document.createElement("span");
    var secondary = document.createElement("span");
    viewport.className = "btn-reveal__viewport";
    track.className = "btn-reveal__track";
    primary.className =
      "btn-reveal__line btn-reveal__line--primary";
    secondary.className =
      "btn-reveal__line btn-reveal__line--second";
    primary.textContent = text;
    secondary.textContent = text;
    secondary.setAttribute("aria-hidden", "true");
    track.appendChild(primary);
    track.appendChild(secondary);
    viewport.appendChild(track);
    textNode.parentNode.replaceChild(
      viewport,
      textNode
    );
    return true;
  }
  function activateNav(navRoot, activeLink) {
    if (!hoverMedia.matches) return;
    var links = navRoot.querySelectorAll(
      '.btn-nav-reveal[data-btn-reveal="true"]'
    );
    links.forEach(function (link) {
      link.classList.toggle(
        "is-nav-active",
        link === activeLink
      );
    });
    navRoot.classList.toggle(
      "nav-engaged",
      Boolean(activeLink)
    );
  }
  function restoreNav(navRoot) {
    var links = Array.from(
      navRoot.querySelectorAll(".btn-nav-reveal")
    );
    var focused = links.find(function (link) {
      return link.matches(":focus-visible");
    });
    var hovered = links.find(function (link) {
      return link.matches(":hover");
    });
    activateNav(navRoot, focused || hovered || null);
  }
  function bindNav(navRoot) {
    if (!navRoot) return;
    navRoot.dataset.btnNavRoot = "true";
    navRoot
      .querySelectorAll(".btn-nav-reveal")
      .forEach(function (link) {
        if (link.dataset.btnNavEvents === "true") {
          return;
        }
        link.dataset.btnNavEvents = "true";
        link.addEventListener(
          "pointerenter",
          function () {
            activateNav(navRoot, link);
          }
        );
        link.addEventListener(
          "pointerleave",
          function () {
            restoreNav(navRoot);
          }
        );
        link.addEventListener(
          "focus",
          function () {
            activateNav(navRoot, link);
          }
        );
        link.addEventListener(
          "blur",
          function () {
            restoreNav(navRoot);
          }
        );
      });
  }
  function collect(root, selector) {
    var elements = [];
    if (
      root.nodeType === 1 &&
      root.matches(selector)
    ) {
      elements.push(root);
    }
    if (root.querySelectorAll) {
      elements = elements.concat(
        Array.from(root.querySelectorAll(selector))
      );
    }
    return elements;
  }
  function scan(root) {
    if (!hoverMedia.matches) return;
    root = root || document;
    collect(root, CANDIDATE_SELECTOR)
      .forEach(function (element) {
        var navRoot =
          element.closest &&
          element.closest(NAV_ROOT_SELECTOR);
        enhance(
          element,
          navRoot ? "navbar" : "button"
        );
      });
    document
      .querySelectorAll(NAV_ROOT_SELECTOR)
      .forEach(bindNav);
  }
  function installObserver() {
    if (state.observer) return;
    state.observer = new MutationObserver(
      function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(
            function (node) {
              if (node.nodeType !== 1) return;
              if (isGenerated(node)) return;
              scan(node);
            }
          );
        });
      }
    );
    state.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  function disableHoverReveal() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    document.querySelectorAll(GENERATED_SELECTOR).forEach(function (viewport) {
      var primary = viewport.querySelector('.btn-reveal__line--primary');
      if (primary) viewport.replaceWith(document.createTextNode(primary.textContent));
    });
    document.querySelectorAll('[data-btn-reveal="true"]').forEach(function (element) {
      element.classList.remove('btn-reveal', 'btn-nav-reveal', 'is-nav-active');
      delete element.dataset.btnReveal;
      delete element.dataset.btnRevealCategory;
    });
    document.querySelectorAll('[data-btn-nav-root]').forEach(function (nav) {
      nav.classList.remove('nav-engaged');
      delete nav.dataset.btnNavRoot;
    });
  }
  function boot() {
    if (!hoverMedia.matches) {
      disableHoverReveal();
      return;
    }
    scan(document);
    installObserver();
  }
  function afterDomReady() {
    if (state.media && state.mediaHandler) {
      state.media.removeEventListener('change', state.mediaHandler);
    }
    state.media = hoverMedia;
    state.mediaHandler = boot;
    hoverMedia.addEventListener('change', boot);
    boot();
    window.Webflow = window.Webflow || [];
    window.Webflow.push(boot);
  }
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      afterDomReady,
      { once: true }
    );
  } else {
    afterDomReady();
  }
})();

/* ===== image parallax ===== */
(function () {
  "use strict";
  var SELECTOR = "[data-parallax]";
  var state =
    window.__tetraImageParallax ||
    (window.__tetraImageParallax = {
      observer: null,
      refreshQueued: false
    });
  function numberAttribute(element, name, fallback) {
    var value = parseFloat(element.getAttribute(name));
    return Number.isFinite(value)
      ? value
      : fallback;
  }
  function queueRefresh() {
    if (state.refreshQueued) return;
    state.refreshQueued = true;
    requestAnimationFrame(function () {
      function refreshWhenIdle() {
        if (window.ScrollTrigger.isScrolling()) return;
        window.ScrollTrigger.removeEventListener('scrollEnd', refreshWhenIdle);
        state.refreshQueued = false;
        window.ScrollTrigger.refresh();
      }
      // Не пересчитываем pin/scrub во время инерционного скролла.
      window.ScrollTrigger.addEventListener('scrollEnd', refreshWhenIdle);
      refreshWhenIdle();
    });
  }
  function initParallax(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.dataset.parallaxReady === "true") return;
    if (node.closest("[data-parallax-skip]")) return;
    var image = node.matches("img")
      ? node
      : node.querySelector("img");
    if (!image) return;
    var container = node.matches("img")
      ? node.parentElement
      : node;
    if (!container) return;
    var speed = numberAttribute(
      node,
      "data-parallax-speed",
      20
    );
    /*
     * Ограничиваем значение, чтобы случайно
     * не получить слишком сильное смещение.
     */
    speed = Math.max(-30, Math.min(30, speed));
    var start = -speed;
    var end = speed;
    /*
     * Масштаб компенсирует движение изображения,
     * чтобы внутри контейнера не появились пустые края.
     */
    var scale =
      1 + Math.abs(speed) * 0.02;
    node.dataset.parallaxReady = "true";
    container.style.overflow = "hidden";
    var media = window.gsap.matchMedia();
    media.add(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      function () {
        window.gsap.set(image, {
          scale: scale,
          yPercent: start,
          force3D: true
        });
        var animation = window.gsap.fromTo(
          image,
          {
            yPercent: start
          },
          {
            yPercent: end,
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true
            }
          }
        );
        return function () {
          if (animation.scrollTrigger) {
            animation.scrollTrigger.kill();
          }
          animation.kill();
          window.gsap.set(image, {
            clearProps: "transform"
          });
        };
      }
    );
    media.add(
      "(max-width: 767px), (prefers-reduced-motion: reduce)",
      function () {
        window.gsap.set(image, {
          scale: 1,
          yPercent: 0
        });
      }
    );
    return true;
  }
  function scan(root) {
    if (!root) return;
    var initialized = false;
    function initialize(node) {
      if (initParallax(node)) initialized = true;
    }
    if (
      root.nodeType === 1 &&
      root.matches(SELECTOR)
    ) {
      initialize(root);
    }
    // Картинка может быть добавлена позже внутрь уже существующего wrapper.
    if (root.nodeType === 1 && root.closest) initialize(root.closest(SELECTOR));
    if (root.querySelectorAll) {
      root
        .querySelectorAll(SELECTOR)
        .forEach(initialize);
    }
    // SplitText, Swiper и pin-spacer тоже меняют DOM, но не требуют
    // глобального refresh от параллакса. Иначе возможен цикл refresh → DOM → refresh.
    if (initialized) queueRefresh();
  }
  function installObserver() {
    if (state.observer) return;
    state.observer = new MutationObserver(
      function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            scan(node);
          });
        });
      }
    );
    state.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  function boot() {
    if (state.booted) return;
    if (!window.gsap || !window.ScrollTrigger) {
      console.warn(
        "Image parallax: GSAP or ScrollTrigger is missing."
      );
      return;
    }
    state.booted = true;
    window.gsap.registerPlugin(
      window.ScrollTrigger
    );
    scan(document);
    installObserver();
    window.addEventListener(
      "load",
      queueRefresh,
      { once: true }
    );
  }
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      { once: true }
    );
  } else {
    boot();
  }
  window.Webflow = window.Webflow || [];
  window.Webflow.push(boot);
})();

/* ===== about swiper (mobile portrait) ===== */
(function () {
  "use strict";
  /* На mobile portrait карточки About превращаются в Swiper.
     Разметка перестраивается только в этом брейкпоинте и разбирается обратно выше него,
     поэтому десктоп остаётся нетронутым. Библиотека грузится лениво — только когда нужна. */
  var SELECTOR = '.section_about .about_content';
  var CSS_URL = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
  var JS_URL = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
  var mq = window.matchMedia('(max-width: 479px)');
  var instance = null;
  var pending = null;

  function loadSwiper() {
    if (window.Swiper) return Promise.resolve();
    if (pending) return pending;
    pending = new Promise(function (resolve, reject) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CSS_URL;
      document.head.appendChild(link);
      var script = document.createElement('script');
      script.src = JS_URL;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return pending;
  }

  function build(el) {
    if (el.dataset.swiperReady === 'true') return;
    var wrapper = document.createElement('div');
    wrapper.className = 'swiper-wrapper';
    while (el.firstChild) wrapper.appendChild(el.firstChild);
    el.appendChild(wrapper);
    Array.prototype.forEach.call(wrapper.children, function (slide) {
      if (slide.nodeType === 1) slide.classList.add('swiper-slide');
    });
    el.classList.add('swiper');
    el.dataset.swiperReady = 'true';
  }

  function teardown(el) {
    if (instance) { instance.destroy(true, true); instance = null; }
    if (el.dataset.swiperReady !== 'true') return;
    var wrapper = el.querySelector('.swiper-wrapper');
    if (wrapper) {
      Array.prototype.forEach.call(wrapper.children, function (slide) {
        if (slide.nodeType === 1) slide.classList.remove('swiper-slide');
      });
      while (wrapper.firstChild) el.insertBefore(wrapper.firstChild, wrapper);
      wrapper.parentNode.removeChild(wrapper);
    }
    el.classList.remove('swiper');
    delete el.dataset.swiperReady;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function apply() {
    var el = document.querySelector(SELECTOR);
    if (!el) return;
    if (window.__tetraPerfOff && window.__tetraPerfOff('swiper')) { teardown(el); return; }
    if (!mq.matches) { teardown(el); return; }
    loadSwiper().then(function () {
      if (!mq.matches || instance) return;         // брейкпоинт мог смениться, пока грузилось
      build(el);
      instance = new Swiper(el, {
        slidesPerView: 'auto',
        spaceBetween: 16,
        grabCursor: true,
        watchOverflow: true,
        resistanceRatio: 0.6
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    })['catch'](function () { /* нет сети — остаётся нативный overflow-x скролл */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }
  mq.addEventListener('change', apply);
})();

/* ===== CADD network iframe controller ===== */
(function () {
  var network = document.getElementById('caddNetwork');
  var exploreCadd = document.getElementById('exploreCadd');
  if (!network) return;
  var api, inView = false, started = false;
  function startWhenReady() {
    if (!api || !inView || started) return;
    started = true;
    api.start();
  }
  network.addEventListener('load', function () {
    api = network.contentWindow && network.contentWindow.TetraCADDNetwork;
    startWhenReady();
  });
  new IntersectionObserver(function (entries) {
    inView = entries[0].isIntersecting;
    startWhenReady();
  }, { threshold: 0.2 }).observe(network);
  if (exploreCadd) {
    exploreCadd.addEventListener('mouseenter', function () { api && api.burst(); });
    exploreCadd.addEventListener('mouseleave', function () { api && api.clear(); });
    exploreCadd.addEventListener('focus', function () { api && api.burst(); });
    exploreCadd.addEventListener('blur', function () { api && api.clear(); });
  }
})();

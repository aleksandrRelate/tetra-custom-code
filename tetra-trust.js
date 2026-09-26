// Tetra — страница TETRA TRUST (Figma 12310:35150).
// Общие вещи (navbar, footer, CTA, Lenis, hover кнопок) — из tetra-core.js,
// tetra-page.js и файлов компонентов; здесь только секции Trust:
//   • SECTION_TT-HERO — хореография при загрузке (щиты расходятся из центра →
//     слова заголовка → текст → кнопка → navbar) + щиты мягко расходятся
//     и гаснут на скролле
//   • reveal секций intro / security / canada / custody / clients / testimonial
//     (Tetra.createReveal: слова из маски, кнопки сверху через маску)
//   • схемы security и custody: SVG инлайнится из <img>, линии прорисовываются
//     (stroke-dashoffset), заливки/подписи проявляются — custody слева направо
//   • фон SECTION_TT-CANADA — параллакс
//
// Depends on: window.Tetra (tetra-core.js), GSAP + ScrollTrigger + SplitText.
// ?perf=trust выключает весь файл.
(function () {
  var T = window.Tetra;
  if (!T) { console.warn('[tetra-trust] window.Tetra не найден — подключи tetra-core.js первым'); return; }

  var NO_MOTION = '(prefers-reduced-motion: no-preference)';

  // <img src="….svg"> → инлайн <svg> с теми же классами (чтобы рисовать линии)
  function inlineSvg(img) {
    if (!img || !/\.svg(\?|$)/.test(img.currentSrc || img.src)) return Promise.resolve(null);
    return fetch(img.currentSrc || img.src)
      .then(function (res) { return res.ok ? res.text() : null; })
      .then(function (text) {
        if (!text) return null;
        var svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
        if (!svg || svg.nodeName.toLowerCase() !== 'svg') return null;
        svg.setAttribute('class', img.getAttribute('class') || '');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', img.getAttribute('alt') || '');
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        img.replaceWith(svg);
        return svg;
      })
      .catch(function () { return null; });
  }

  // линии — всё с обводкой без заливки; остальное (текст в кривых, бары, маркеры) — «заливки»
  function splitSvgParts(svg) {
    var strokes = [];
    var fills = [];
    svg.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon').forEach(function (el) {
      if (el.closest('clipPath, defs, mask')) return;
      var fill = el.getAttribute('fill');
      var stroke = el.getAttribute('stroke');
      if (stroke && (!fill || fill === 'none') && typeof el.getTotalLength === 'function') strokes.push(el);
      else if (fill && fill !== 'none' && !(el.nodeName === 'rect' && el.parentNode === svg && el === svg.firstElementChild)) fills.push(el);
    });
    return { strokes: strokes, fills: fills };
  }

  function bboxX(el) {
    try { var b = el.getBBox(); return b.x + b.width / 2; } catch (e) { return 0; }
  }

  // прорисовка схемы: линии по stroke-dashoffset, заливки — opacity.
  // orderByX — порядок слева направо (для потоковой схемы custody)
  function drawSvg(svg, trigger, opts) {
    var parts = splitSvgParts(svg);
    var strokes = parts.strokes;
    var fills = parts.fills;
    if (opts.orderByX) {
      strokes.sort(function (a, b) { return bboxX(a) - bboxX(b); });
      fills.sort(function (a, b) { return bboxX(a) - bboxX(b); });
    }
    strokes.forEach(function (el) {
      var len = el.getTotalLength() || 0;
      el.style.strokeDasharray = el.getAttribute('stroke-dasharray') ? '' : len + ' ' + len;
      if (!el.getAttribute('stroke-dasharray')) el.style.strokeDashoffset = len;
      else el.style.opacity = 0;
    });
    gsap.set(fills, { opacity: 0 });
    // без trigger — таймлайн на паузе, его запускает вызывающий код
    var tl = gsap.timeline(trigger ? {
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: { trigger: trigger, start: opts.start || 'top 75%', once: true }
    } : { defaults: { ease: 'power2.inOut' }, paused: true });
    var dashed = strokes.filter(function (el) { return el.getAttribute('stroke-dasharray'); });
    var solid = strokes.filter(function (el) { return !el.getAttribute('stroke-dasharray'); });
    tl.to(solid, { strokeDashoffset: 0, duration: opts.lineDuration || 1.1, stagger: opts.stagger || 0.06 }, 0);
    if (dashed.length) tl.to(dashed, { opacity: 1, duration: 0.6, stagger: opts.stagger || 0.06 }, 0.3);
    tl.to(fills, { opacity: 1, duration: 0.5, stagger: (opts.stagger || 0.06) / 2, ease: 'power1.out' }, opts.fillsAt || 0.45);
    return tl;
  }

  // перенос строки в Webflow — символ \n (white-space: pre-line); SplitText
  // его схлопывает, поэтому превращаем в <br> до разбиения (как в tetra-cadd.js)
  function nl2br(el) {
    if (!el || el.textContent.indexOf('\n') === -1) return;
    var parts = el.textContent.split('\n');
    el.textContent = '';
    parts.forEach(function (part, i) {
      if (i) el.appendChild(document.createElement('br'));
      el.appendChild(document.createTextNode(part.trim()));
    });
  }

  // hero прячем сразу (до снятия .tetra-anim), а SplitText запускаем после
  // загрузки веб-шрифтов — иначе строки считаются по fallback-шрифту и после
  // подмены шрифта переносятся заново (висячие слова)
  function boot() {
    if (!window.gsap || !window.ScrollTrigger || T.off('trust')) return;
    var hero = document.querySelector('.section_tt-hero');
    if (!hero) return;
    if (!T.off('hero')) {
      gsap.set(hero.querySelectorAll('.tt-hero_heading, .tt-hero_text, .tt-hero_content .button, .tt-hero_shield'), { autoAlpha: 0 });
    }
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(init, init);
  }

  function init() {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    var mm = T.mm;
    document.querySelectorAll('.tt-security_heading, .tt-clients_card-title').forEach(nl2br);

    /* ------------------------------------------------------------------ *
     * SECTION_TT-HERO — загрузка: щиты расходятся из центра (изнутри наружу),
     * слова заголовка из маски, текст, кнопка сверху через маску, navbar.
     * Тайминги/изинг — как у hero лендинга и CADD.
     * ------------------------------------------------------------------ */
    var hero = document.querySelector('.section_tt-hero');
    var heading = hero.querySelector('.tt-hero_heading');
    var shields = gsap.utils.toArray(hero.querySelectorAll('.tt-hero_shield')).reverse(); // is-1 (внутренний) первым
    var heroText = hero.querySelector('.tt-hero_text');
    var heroButtons = hero.querySelectorAll('.tt-hero_content .button');
    var navbar = document.querySelector('.navbar-wrapper');

    if (heading && window.SplitText && !T.off('hero')) {
      var split = SplitText.create(heading, {
        type: 'lines,words',
        linesClass: 'hero-heading-line',
        wordsClass: 'hero-heading-word'
      });
      var tl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });

      if (shields.length) {
        gsap.set(shields, { autoAlpha: 0, scale: 0.82, transformOrigin: '50% 45%' });
        tl.to(shields, { autoAlpha: 1, scale: 1, duration: 1.6, stagger: 0.09, ease: 'power3.out' }, 0);
      }
      gsap.set(split.words, { yPercent: 101 });
      gsap.set(heading, { autoAlpha: 1 });
      tl.to(split.words, { yPercent: 0, duration: 1.109, stagger: 0.1, force3D: true }, 0.35);
      if (heroText) {
        gsap.set(heroText, { autoAlpha: 0, yPercent: 50 });
        tl.to(heroText, { autoAlpha: 0.8, yPercent: 0, duration: 0.9 }, 0.85);
      }
      if (heroButtons.length) {
        var mask = T.createReveal();
        Array.from(heroButtons).forEach(mask.maskButton);
        gsap.set(heroButtons, { yPercent: -110, autoAlpha: 1 });
        tl.to(heroButtons, { yPercent: 0, duration: 0.9, stagger: 0.12, force3D: true }, 1.1);
      }
      if (navbar) {
        gsap.set(navbar, { clipPath: 'inset(0% 0% 100% 0%)' });
        tl.to(navbar, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.1,
          onComplete: function () { gsap.set(navbar, { clearProps: 'clipPath' }); }
        }, 1.35);
      }
      tl.play(0);
    } else {
      gsap.set(hero.querySelectorAll('.tt-hero_heading, .tt-hero_text, .tt-hero_content .button, .tt-hero_shield'), { clearProps: 'opacity,visibility' });
    }

    // на скролле щиты расходятся (внешние быстрее) и гаснут
    if (shields.length) {
      mm.add('(min-width: 992px) and ' + NO_MOTION, function () {
        var st = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
        shields.forEach(function (el, i) {
          st.to(el, { scale: 1 + 0.04 * (i + 1), yPercent: -2 * (i + 1) }, 0);
        });
        st.to(hero.querySelector('.tt-hero_shields'), { opacity: 0.35 }, 0);
        return function () {
          if (st.scrollTrigger) st.scrollTrigger.kill();
          st.kill();
          gsap.set(hero.querySelector('.tt-hero_shields'), { clearProps: 'opacity' });
        };
      });
    }

    /* ------------------------------------------------------------------ *
     * REVEAL секций — слова из маски, кнопки сверху через маску, карточки.
     * ------------------------------------------------------------------ */
    if (window.SplitText && !T.off('reveal')) {
      mm.add(NO_MOTION, function () {
        var r = T.createReveal();
        var timelineFor = r.timelineFor;
        var revealText = r.revealText;
        var revealButtons = r.revealButtons;

        function badge(tl, root, at) {
          revealText(tl, root.querySelector('.badge .eyebrow_text'), at || 0);
        }

        // INTRO
        var intro = document.querySelector('.section_tt-intro');
        if (intro) {
          var introTl = timelineFor(intro.querySelector('.tt-intro_layout') || intro);
          badge(introTl, intro);
          revealText(introTl, intro.querySelector('.tt-heading-40'), 0.08);
          revealText(timelineFor(intro.querySelector('.tt-intro_text'), 'top 90%'), intro.querySelector('.tt-intro_text'), 0);
        }

        // SECURITY — шапка + пункты по мере появления
        var security = document.querySelector('.section_tt-security');
        if (security) {
          var secTl = timelineFor(security.querySelector('.tt-section-header') || security);
          badge(secTl, security);
          revealText(secTl, security.querySelector('.tt-security_heading'), 0.08);
          security.querySelectorAll('.tt-security_item').forEach(function (item) {
            var itemTl = timelineFor(item, 'top 85%');
            gsap.set(item, { borderTopColor: 'rgba(235, 237, 244, 0)' });
            itemTl.to(item, { borderTopColor: 'rgba(235, 237, 244, 1)', duration: 0.8, ease: 'power1.out' }, 0);
            revealText(itemTl, item.querySelector('.tt-security_item-title'), 0.05);
            revealText(itemTl, item.querySelector('.tt-security_item-text'), 0.15);
          });
          var card = security.querySelector('.tt-security_graphic-card');
          if (card) {
            gsap.set(card, { autoAlpha: 0, y: 32 });
            timelineFor(card, 'top 85%').to(card, { autoAlpha: 1, y: 0, duration: 0.9 }, 0);
          }
        }

        // CANADA
        var canada = document.querySelector('.section_tt-canada');
        if (canada) {
          var canTl = timelineFor(canada, 'top 60%');
          badge(canTl, canada);
          revealText(canTl, canada.querySelector('.tt-canada_heading'), 0.08);
          var canContent = canada.querySelector('.tt-canada_text');
          var canBottom = timelineFor(canContent || canada, 'top 90%');
          revealText(canBottom, canContent, 0);
          revealButtons(canBottom, canada.querySelectorAll('.button'), 0.2);
        }

        // CUSTODY
        var custody = document.querySelector('.section_tt-custody');
        if (custody) {
          var cusTl = timelineFor(custody.querySelector('.tt-custody_text') || custody);
          revealText(cusTl, custody.querySelector('.tt-custody_heading'), 0);
          revealText(cusTl, custody.querySelector('.tt-custody_subtext'), 0.2);
          revealButtons(cusTl, custody.querySelectorAll('.button'), 0.35);
          var visual = custody.querySelector('.tt-custody_visual');
          if (visual) {
            gsap.set(visual, { autoAlpha: 0, y: 40 });
            timelineFor(visual, 'top 90%').to(visual, { autoAlpha: 1, y: 0, duration: 1 }, 0);
          }
        }

        // CLIENTS — шапка + карточки лесенкой
        var clients = document.querySelector('.section_tt-clients');
        if (clients) {
          var cliTl = timelineFor(clients.querySelector('.tt-split') || clients);
          badge(cliTl, clients);
          revealText(cliTl, clients.querySelector('.tt-clients_heading'), 0.08);
          var singleColumn = window.matchMedia('(max-width: 479px)').matches;
          clients.querySelectorAll('.tt-clients_card').forEach(function (card, index) {
            var delay = singleColumn ? 0 : (index % 3) * 0.12;   // на мобилке карточки в одну колонку — без лесенки
            var cardTl = timelineFor(card, 'top 90%');
            gsap.set(card, { autoAlpha: 0, y: 32 });
            cardTl.to(card, { autoAlpha: 1, y: 0, duration: 0.7 }, delay);
            revealText(cardTl, card.querySelector('.tt-clients_card-title'), delay + 0.12);
            revealText(cardTl, card.querySelector('.tt-clients_card-text'), delay + 0.22);
          });
        }

        // TESTIMONIAL
        var testi = document.querySelector('.section_tt-testimonial');
        if (testi) {
          var tTl = timelineFor(testi.querySelector('.tt-testimonial_layout') || testi);
          badge(tTl, testi);
          revealText(tTl, testi.querySelector('.tt-quote'), 0.08);
          var bottom = testi.querySelector('.tt-testimonial_bottom');
          if (bottom) {
            var bTl = timelineFor(bottom, 'top 95%');
            var bits = bottom.querySelectorAll('.tt-testimonial_author > *, .tt-testimonial_arrow');
            gsap.set(bits, { autoAlpha: 0, y: 16 });
            bTl.to(bits, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0);
          }
        }

        return r.destroy;
      });
    }

    /* ------------------------------------------------------------------ *
     * Схемы: security (сначала серый контур, потом тёмное ядро и маркеры)
     * и custody (поток cold → warm → policy → hot → network слева направо).
     * ------------------------------------------------------------------ */
    if (!T.off('trustsvg')) {
      var secSection = document.querySelector('.section_tt-security');
      var secCard = secSection && secSection.querySelector('.tt-security_graphic-card');
      var secItems = secSection ? gsap.utils.toArray(secSection.querySelectorAll('.tt-security_item')) : [];
      var SEC_DRAW = { lineDuration: 1.2, stagger: 0.04, fillsAt: 0.8 };

      // ДЕСКТОП (>=480): в закреплённой карточке 5 схем стопкой; активный пункт
      // списка (его верх пересёк 60% экрана) показывает свою схему — кроссфейд,
      // при первом показе схема прорисовывается
      if (secCard && secItems.length) {
        mm.add('(min-width: 480px) and ' + NO_MOTION, function () {
          var alive = true;
          var triggers = [];
          var imgs = gsap.utils.toArray(secCard.querySelectorAll('.tt-security_graphic'));
          Promise.all(imgs.map(function (el) {
            return el.nodeName.toLowerCase() === 'svg' ? Promise.resolve(el) : inlineSvg(el);
          })).then(function (svgs) {
            if (!alive) return;
            svgs = svgs.filter(Boolean);
            if (!svgs.length) return;
            var draws = svgs.map(function (svg) { return drawSvg(svg, null, SEC_DRAW); });
            var current = -1;
            function show(i) {
              if (i === current || !svgs[i]) return;
              current = i;
              svgs.forEach(function (svg, j) {
                gsap.to(svg, { opacity: j === i ? 1 : 0, duration: 0.5, ease: 'power1.inOut', overwrite: true });
              });
              if (!draws[i].progress()) draws[i].play(0);
            }
            gsap.set(svgs, { opacity: 0 });
            triggers.push(ScrollTrigger.create({
              trigger: secCard, start: 'top 80%', once: true,
              onEnter: function () { if (current === -1) show(0); }
            }));
            secItems.forEach(function (item, i) {
              triggers.push(ScrollTrigger.create({
                trigger: item,
                start: 'top 60%',
                end: 'bottom 60%',
                onToggle: function (self) { if (self.isActive) show(i); }
              }));
            });
            ScrollTrigger.refresh();
            triggers.draws = draws;
            triggers.svgs = svgs;
          });
          return function () {
            alive = false;
            triggers.forEach(function (st) { st.kill(); });
            (triggers.draws || []).forEach(function (tl) { tl.progress(1).kill(); });
            // без JS-логики видна только первая схема (как в вёрстке)
            (triggers.svgs || []).forEach(function (svg, j) { gsap.set(svg, { opacity: j === 0 ? 1 : 0 }); });
          };
        });
      }

      // МОБИЛКА (<=479): у каждого пункта своя схема под текстом — прорисовываем
      // её, когда она появляется на экране
      if (secItems.length) {
        mm.add('(max-width: 479px) and ' + NO_MOTION, function () {
          var alive = true;
          var tls = [];
          secItems.forEach(function (item) {
            var img = item.querySelector('.tt-security_item-img');
            if (!img) return;
            (img.nodeName.toLowerCase() === 'svg' ? Promise.resolve(img) : inlineSvg(img)).then(function (svg) {
              if (!svg || !alive) return;
              tls.push(drawSvg(svg, svg.closest('.tt-security_item-visual') || svg, Object.assign({ start: 'top 85%' }, SEC_DRAW)));
              ScrollTrigger.refresh();
            });
          });
          return function () {
            alive = false;
            tls.forEach(function (tl) { if (tl.scrollTrigger) tl.scrollTrigger.kill(); tl.progress(1).kill(); });
          };
        });
      }

      var cusImg = document.querySelector('.section_tt-custody img.tt-custody_graphic');
      mm.add(NO_MOTION, function () {
        var tls = [];
        inlineSvg(cusImg).then(function (svg) {
          if (!svg) return;
          tls.push(drawSvg(svg, svg.closest('.tt-custody_visual') || svg, {
            start: 'top 75%', orderByX: true, lineDuration: 0.9, stagger: 0.09, fillsAt: 0.3
          }));
          ScrollTrigger.refresh();
        });
        return function () {
          tls.forEach(function (tl) { if (tl.scrollTrigger) tl.scrollTrigger.kill(); tl.progress(1).kill(); });
        };
      });
    }

    /* ------------------------------------------------------------------ *
     * SECTION_TT-CANADA — параллакс фона (как [data-parallax] на Home)
     * ------------------------------------------------------------------ */
    var canadaBg = document.querySelector('.section_tt-canada .tt-canada_bg');
    if (canadaBg) {
      mm.add('(min-width: 768px) and ' + NO_MOTION, function () {
        gsap.set(canadaBg, { scale: 1.16, transformOrigin: '50% 50%' });
        var px = gsap.fromTo(canadaBg, { yPercent: -7 }, {
          yPercent: 7,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: canadaBg.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true
          }
        });
        return function () {
          if (px.scrollTrigger) px.scrollTrigger.kill();
          px.kill();
          gsap.set(canadaBg, { clearProps: 'transform' });
        };
      });
    }
  }

  T.ready(boot);
})();

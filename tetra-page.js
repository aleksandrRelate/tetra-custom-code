// Tetra — анимации уровня всей страницы Home (не привязаны к компонентам
// navbar / footer / CTA / Partners — те живут в своих файлах).
//
// Внутри:
//   • Lenis — плавный скролл (выключен на мобилке <=479px)
//   • HERO — хореография загрузки страницы
//   • SECTION_INTRO — pin + пословная заливка цветом
//   • SECTION_BENEFITS — sticky-стопка карточек + reveal текста
//   • SECTION_TRUST — scale по скроллу + reveal хедера и карточек
//   • SECTION_ABOUT — about-card-animation (схема) + reveal хедера/контента
//   • buttons animation — hover-reveal строки на всех кнопках/ссылках
//   • image parallax — [data-parallax]
//   • about swiper — карточки About в Swiper на mobile portrait
//   • CADD network iframe controller
//
// Depends on: window.Tetra (tetra-core.js), jQuery, Webflow,
// GSAP + ScrollTrigger + SplitText, Lenis — всё грузится ВЫШЕ.
(function () {
  var T = window.Tetra;
  if (!T) { console.warn('[tetra-page] window.Tetra не найден — подключи tetra-core.js первым'); return; }

  if (T.off('caddsvg')) {
    var __cs = document.createElement('style');
    __cs.textContent = '#caddNetwork,.hero_bg-image.is-svg{display:none!important}';
    (document.head || document.documentElement).appendChild(__cs);
  }

  /* ===== Home scroll interactions (GSAP + ScrollTrigger + SplitText + Lenis) ===== */
  (function () {
    function init() {
      // Основные интеракции требуют только GSAP и ScrollTrigger.
      if (!window.gsap || !window.ScrollTrigger) return;
      gsap.registerPlugin(ScrollTrigger);
      if (window.SplitText) gsap.registerPlugin(SplitText);
      var mm = T.mm;                                     // общий matchMedia из ядра
      var s = getComputedStyle(document.documentElement); // CSS-переменные (токены) и root font-size
      /* ------------------------------------------------------------------ *
       * 1. LENIS — плавный скролл, заведён на GSAP-тикер (без rAF-гонки)
       * На мобилке (<=479px) выключен: там нативный скролл телефона ведёт себя
       * лучше — не ломает скрытие адресной строки, системную инерцию и overscroll.
       * ------------------------------------------------------------------ */
      var lenisMq = window.matchMedia('(max-width: 479px)');
      var lenisTick = null;

      function startLenis() {
        if (!window.Lenis || window.lenis) return;
        if (window.ScrollSmoother && ScrollSmoother.get && ScrollSmoother.get()) return;
        var lenis = new Lenis({ lerp: 0.16, smoothWheel: true, wheelMultiplier: 1 });
        lenis.on('scroll', ScrollTrigger.update);
        lenisTick = function (time) { lenis.raf(time * 1000); };
        gsap.ticker.add(lenisTick);
        gsap.ticker.lagSmoothing(0);
        window.lenis = lenis;                                     // доступ снаружи: lenis.scrollTo(...)
      }

      function stopLenis() {
        if (!window.lenis) return;
        if (lenisTick) { gsap.ticker.remove(lenisTick); lenisTick = null; }
        window.lenis.destroy();
        window.lenis = null;
        gsap.ticker.lagSmoothing(500, 33);
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
      if (heading && window.SplitText && !T.off('intro')) {
        var fill = s.getPropertyValue('--_tetra-tokens---color-ink').trim() || '#251915';
        var base = s.getPropertyValue('--_tetra-tokens---color-muted').trim() || '#9E9E9E';
        // section_intro ведёт себя одинаково на всех ширинах, включая мобилку.
        mm.add('(min-width: 1px)', function () {
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
              refreshPriority: 1,
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
       * ------------------------------------------------------------------ */
      var items = gsap.utils.toArray('.section_benefits .benefits_item');
      if (items.length > 1 && !T.off('benefits')) {
        mm.add('(min-width: 480px)', function () {
          var cardTop = 0;
          var tw = [];
          items.forEach(function (item, i) {
            item.style.position = 'sticky';
            item.style.top = cardTop + 'px';
            if (i === items.length - 1) return;
            var content = item.querySelector('.benefits_item-content');
            if (!content) return;
            tw.push(gsap.to(content, {
              opacity: 0.18, scale: 0.985, transformOrigin: '50% 0%', ease: 'none',
              scrollTrigger: {
                trigger: items[i + 1],
                start: 'top center',
                end: 'top top',
                scrub: true,
                invalidateOnRefresh: true
              }
            }));
          });
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
      if (trust && !T.off('trust')) {
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
       * 5. SECTION REVEALS уровня страницы: Benefits, Trust, About.
       * (CTA / Footer / Partners — в своих файлах.)
       * ------------------------------------------------------------------ */
      if (window.SplitText && !T.off('reveal')) {
        mm.add('(prefers-reduced-motion: no-preference)', function () {
          var r = T.createReveal();
          var timelineFor = r.timelineFor;
          var revealText = r.revealText;
          var revealButtons = r.revealButtons;

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
              var cardTimeline = timelineFor(card, 'top 95%');
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
          return r.destroy;
        });
      }
      /* ------------------------------------------------------------------ *
       * SECTION_ABOUT — появление схемы about-card-animation
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
            gsap.set(card, { borderColor: 'rgba(229, 229, 229, 0)' });
            return { card: card, dot: dot, content: content };
          });

          var tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            scrollTrigger: { trigger: aboutAnim, start: 'top 75%', once: true }
          });

          if (hubDot) {
            tl.to(hubDot, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 0);
          }
          if (lines.length) {
            tl.to(lines, {
              strokeDashoffset: 0,
              duration: 0.9,
              ease: 'power2.inOut'
            }, 0.35);
          }
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
      ScrollTrigger.refresh();
    }
    T.ready(init);
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
      if (
        element.querySelector(
          'a[href], button, [role="button"]'
        )
      ) {
        return true;
      }
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
      speed = Math.max(-30, Math.min(30, speed));
      var start = -speed;
      var end = speed;
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
      if (root.nodeType === 1 && root.closest) initialize(root.closest(SELECTOR));
      if (root.querySelectorAll) {
        root
          .querySelectorAll(SELECTOR)
          .forEach(initialize);
      }
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
    /* На mobile portrait карточки About превращаются в Swiper. */
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
      if (window.Tetra && window.Tetra.off('swiper')) { teardown(el); return; }
      if (!mq.matches) { teardown(el); return; }
      loadSwiper().then(function () {
        if (!mq.matches || instance) return;
        build(el);
        instance = new Swiper(el, {
          slidesPerView: 'auto',
          spaceBetween: 16,
          slidesOffsetAfter: 16,
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
})();

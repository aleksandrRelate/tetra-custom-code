// Tetra — общее ядро для всех модулей кастомного кода.
// Подключается ПЕРВЫМ, после jQuery / webflow.js / GSAP (+ ScrollTrigger,
// SplitText) / Lenis и ПЕРЕД tetra-page.js и файлами компонентов
// (tetra-navbar.js, tetra-footer.js, tetra-cta.js, tetra-partners.js).
//
// Даёт единый namespace window.Tetra:
//   Tetra.off(name)      — perf-килл-свитч ?perf=<name>[,<name>] (см. ниже)
//   Tetra.mm             — общий gsap.matchMedia() (брейкпоинты + автоочистка)
//   Tetra.ready(fn)      — вызвать fn после готовности DOM
//   Tetra.createReveal() — фабрика контекста reveal-анимаций секций
//                          (SplitText по словам/строкам + маскированные кнопки)
//
// PERF BISECT: add ?perf=<name>[,<name>] to the URL to switch subsystems off
// while diagnosing scroll jank. Names: partners, reveal, benefits, intro,
// trust, swiper, caddsvg, all. Example: ?perf=partners,caddsvg
(function () {
  var T = window.Tetra || (window.Tetra = {});

  /* ---- perf килл-свитч ---- */
  T.off = (function () {
    try {
      var raw = (new URLSearchParams(location.search).get('perf') || '').toLowerCase();
      var set = {};
      raw.split(',').forEach(function (k) { k = k.trim(); if (k) set[k] = true; });
      return function (name) { return !!(set[name] || set.all); };
    } catch (e) {
      return function () { return false; };
    }
  })();
  // обратная совместимость со старым именем
  window.__tetraPerfOff = T.off;

  /* ---- общий matchMedia ---- */
  Object.defineProperty(T, 'mm', {
    configurable: true,
    get: function () {
      if (!this._mm && window.gsap) this._mm = gsap.matchMedia();
      return this._mm;
    }
  });

  /* ---- готовность DOM ---- */
  T.ready = function (fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  /* ------------------------------------------------------------------ *
   * Tetra.createReveal() — контекст reveal-анимаций для одной секции.
   * Общие параметры: слова 0.555s / stagger 0.05s;
   * кнопки — как hero, сверху вниз через маску, 0.9s / 0.12s.
   * Возвращает { timelineFor, revealText, maskButton, revealButtons, destroy }.
   * destroy() убивает все созданные таймлайны и откатывает SplitText —
   * вызывать из cleanup-колбэка Tetra.mm.add(...).
   * ------------------------------------------------------------------ */
  T.createReveal = function () {
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

    function destroy() {
      reveals.forEach(function (animation) {
        if (animation.scrollTrigger) animation.scrollTrigger.kill();
        animation.kill();
      });
      splits.forEach(function (split) { split.revert(); });
      splits.length = 0;
      reveals.length = 0;
    }

    return {
      timelineFor: timelineFor,
      revealText: revealText,
      maskButton: maskButton,
      revealButtons: revealButtons,
      destroy: destroy
    };
  };
})();

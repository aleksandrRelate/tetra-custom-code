// Tetra — секции, уникальные для страницы CADD.
// Общие вещи (navbar, footer, CTA, partners, hero, trust, parallax, кнопки)
// переиспользуются из tetra-core.js + tetra-page.js + файлов компонентов —
// здесь только то, чего нет на других страницах:
//   • SECTION_CADD-PRACTICE — залипающая стопка карточек (>=992px)
//   • reveal секций cadd-gap / cadd-fundamentals / cadd-practice
//
// Depends on: window.Tetra (tetra-core.js), GSAP + ScrollTrigger
// (+ SplitText для reveal).
(function () {
  var T = window.Tetra;
  if (!T) { console.warn('[tetra-cadd] window.Tetra не найден — подключи tetra-core.js первым'); return; }

  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    var mm = T.mm;
    var s = getComputedStyle(document.documentElement);

    /* ------------------------------------------------------------------ *
     * SECTION_CADD-PRACTICE — стэк карточек
     *  • карточки .cadd-practice_card залипают на 4rem и стэкаются;
     *    у уходящей гаснет вся карточка (opacity + лёгкий scale) —
     *    та же механика, что у benefits_item на Home
     *  • только от 992px, где .cadd-practice_layout — 2 колонки
     * ------------------------------------------------------------------ */
    var section = document.querySelector('.section_cadd-practice');
    var cards = section
      ? gsap.utils.toArray(section.querySelectorAll('.cadd-practice_card'))
      : [];
    if (cards.length > 1) {
      mm.add('(min-width: 992px)', function () {
        var rootFontSize = parseFloat(s.fontSize) || 16;
        var cardTop = 4 * rootFontSize;   // офсет залипания (4rem)
        var tw = [];
        cards.forEach(function (card, i) {
          card.style.position = 'sticky';
          card.style.top = cardTop + 'px';
          if (i === cards.length - 1) return;   // последнюю не гасим
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
     * REVEAL секций CADD (cadd-gap / cadd-fundamentals / cadd-practice)
     * ------------------------------------------------------------------ */
    if (window.SplitText && !T.off('reveal')) {
      mm.add('(prefers-reduced-motion: no-preference)', function () {
        var r = T.createReveal();
        var timelineFor = r.timelineFor;
        var revealText = r.revealText;
        var revealButtons = r.revealButtons;
        var maskButton = r.maskButton;

        // CADD-gap: отдельные триггеры для контента, разделённого большими отступами.
        document.querySelectorAll('.section_cadd-gap').forEach(function (sec) {
          var header = timelineFor(sec.querySelector('.cadd-gap_layout') || sec);
          revealText(header, sec.querySelector('.badge .eyebrow_text'), 0);
          revealText(header, sec.querySelector('.heading-style-h2'), 0.08);
          var copy = sec.querySelector('.cadd-gap_text');
          if (copy) revealText(timelineFor(copy), copy, 0);
        });

        document.querySelectorAll('.section_cadd-fundamentals').forEach(function (sec) {
          var header = timelineFor(sec.querySelector('.cadd-fundamentals_header') || sec);
          revealText(header, sec.querySelector('.badge .eyebrow_text'), 0);
          revealText(header, sec.querySelector('.heading-style-h2'), 0.08);
          sec.querySelectorAll('.cadd-fundamentals_column').forEach(function (column) {
            var title = column.querySelector('.heading-style-h3');
            var copy = column.querySelector('.cadd-fundamentals_copy');
            if (title) revealText(timelineFor(title), title, 0);
            if (copy) revealText(timelineFor(copy), copy, 0);
          });
        });

        document.querySelectorAll('.section_cadd-practice').forEach(function (sec) {
          var header = timelineFor(sec.querySelector('.cadd-practice_header') || sec);
          revealText(header, sec.querySelector('.badge .eyebrow_text'), 0);
          revealText(header, sec.querySelector('.cadd-practice_heading'), 0.08);
          sec.querySelectorAll('.cadd-practice_button').forEach(function (button) {
            maskButton(button);
            revealButtons(timelineFor(button.parentElement), [button], 0);
          });
          sec.querySelectorAll('.cadd-practice_card').forEach(function (card) {
            var entry = timelineFor(card);
            gsap.set(card, { autoAlpha: 0, y: 32, scale: 0.98, transformOrigin: '50% 100%' });
            entry.to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7 }, 0);
            revealText(entry, card.querySelector('.heading-style-h3'), 0.12);
            revealText(entry, card.querySelector('.cadd-practice_copy'), 0.22);
            var number = card.querySelector('.cadd-practice_number');
            if (number) revealText(timelineFor(number), number, 0, true);
          });
        });

        return r.destroy;
      });
    }

    ScrollTrigger.refresh();
  }

  T.ready(init);
})();

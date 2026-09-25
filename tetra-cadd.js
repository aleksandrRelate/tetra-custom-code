// Tetra — секции, уникальные для страницы CADD.
// Общие вещи (navbar, footer, CTA, partners, hero, trust, parallax, кнопки)
// переиспользуются из tetra-core.js + tetra-page.js + файлов компонентов —
// здесь только то, чего нет на других страницах:
//   • SECTION_CADD-PRACTICE — залипающая стопка карточек (>=992px)
//   • reveal секций cadd-gap / cadd-fundamentals / cadd-practice
//   • SECTION_CADD-PEG — pin + scrub по раскадровке (Figma 12221:20524)
//   • SECTION_CADD-CTA — бесконечная лента платформ (механика как у PARTNERS)
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
     * SECTION_CADD-PEG — «1 CADD = $1 CAD», pin + scrub (Figma 12221:20524)
     *  0–30%   надпись 180px по центру экрана, монет нет
     *  30–55%  надпись → 86px и вверх; снизу въезжают луни и CADD-монета
     *  55–80%  надпись → 32px/80% на своё место, монеты сходятся в пару,
     *          проявляются строки заголовка
     *  80–100% пауза на финальном кадре
     *  Финальный кадр = вёрстка в Webflow, поэтому всё анимируется «из» смещений.
     *  Смещения — в rem (1rem = 16px на 1440), пересчитываются на refresh.
     * ------------------------------------------------------------------ */
    var peg = document.querySelector('.section_cadd-peg');
    if (peg && !T.off('peg')) {
      mm.add('(min-width: 992px) and (prefers-reduced-motion: no-preference)', function () {
        var label = peg.querySelector('.cadd-peg_label');
        var loonie = peg.querySelector('.cadd-peg_loonie');
        var coin = peg.querySelector('.cadd-peg_coin');
        var lines = peg.querySelectorAll('.cadd-peg_line');
        if (!label || !loonie || !coin) return;

        function rem(v) {
          return function () {
            return v * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
          };
        }

        var tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: peg,
            start: 'top top',
            end: '+=200%',
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true
          }
        });

        // кадр 1 → 2
        tl.fromTo(label,
          { y: rem(20), scale: 5.625, opacity: 1 },
          { y: rem(10.3125), scale: 2.698, opacity: 1, duration: 0.25 }, 0.3);
        tl.fromTo(loonie, { y: rem(48) }, { y: rem(11.5), duration: 0.25 }, 0.3);
        tl.fromTo(coin, { x: rem(-0.25), y: rem(60) }, { x: rem(-0.25), y: rem(29.875), duration: 0.25 }, 0.3);

        // кадр 2 → 3 (финал = вёрстка)
        tl.to(label, { y: 0, scale: 1, opacity: 0.8, duration: 0.25 }, 0.55);
        tl.to(loonie, { y: 0, duration: 0.25 }, 0.55);
        tl.to(coin, { x: 0, y: 0, duration: 0.25 }, 0.55);
        if (lines.length) {
          tl.from(lines, { yPercent: 40, opacity: 0, stagger: 0.04, duration: 0.17, ease: 'power2.out' }, 0.6);
        }
        tl.to({}, { duration: 0.2 }, 0.8);

        return function () {
          if (tl.scrollTrigger) tl.scrollTrigger.kill();
          tl.kill();
          gsap.set([label, loonie, coin], { clearProps: 'transform,opacity' });
          if (lines.length) gsap.set(lines, { clearProps: 'transform,opacity' });
        };
      });
    }

    /* ------------------------------------------------------------------ *
     * SECTION_CADD-CTA — бесконечная лента платформ
     * Механика 1:1 с PARTNERS_GRID (tetra-partners.js): ряд 1 влево, ряд 2
     * вправо, бесшовно; скорость модулируется скоростью скролла.
     * ------------------------------------------------------------------ */
    var cWrap = document.querySelector('.section_cadd-cta .cadd-cta_marquee');
    if (cWrap && !T.off('cadd-cta')) {
      var cRows = Array.prototype.slice.call(cWrap.querySelectorAll('.cadd-cta_row'));
      var cLoops = [];
      var cActive = false;
      function buildCtaMarquee() {
        var previous = cLoops.map(function (t) {
          return { progress: t.progress(), speed: t.timeScale() };
        });
        cLoops.forEach(function (t) { t.kill(); });
        cLoops = [];
        cRows.forEach(function (row, ri) {
          if (!row.dataset.cloned) {
            var kids = Array.prototype.slice.call(row.children);
            kids.forEach(function (n) {
              var c = n.cloneNode(true);
              c.setAttribute('aria-hidden', 'true');
              row.appendChild(c);
            });
            row.dataset.cloned = '1';
            row.dataset.count = kids.length;
          }
          row.style.display = 'flex';
          row.style.flexWrap = 'nowrap';
          row.style.width = 'max-content';
          gsap.set(row, { x: 0 });
          var cs = getComputedStyle(row);
          var gap = parseFloat(cs.columnGap || cs.gap) || 0;
          var n = parseInt(row.dataset.count, 10);
          var w = 0;
          for (var k = 0; k < n; k++) { w += row.children[k].getBoundingClientRect().width + gap; }
          var dir = ri % 2 === 0 ? -1 : 1;
          var t = gsap.fromTo(row,
            { x: dir < 0 ? 0 : -w },
            {
              x: dir < 0 ? -w : 0,
              duration: w / 40, ease: 'none', repeat: -1, // ≈ 40px/с
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
          if (cActive) t.resume();
          cLoops.push(t);
        });
      }
      buildCtaMarquee();
      var cTarget = 1;
      var cSettled = true;
      var cLastY = window.scrollY;
      var cLastT = (window.performance && performance.now()) || Date.now();
      ScrollTrigger.create({
        trigger: '.section_cadd-cta', start: 'top bottom', end: 'bottom top',
        onToggle: function (self) {
          cActive = self.isActive;
          cLastY = window.scrollY;
          cLastT = (window.performance && performance.now()) || Date.now();
          cLoops.forEach(function (t) { cActive ? t.resume() : t.pause(); });
        }
      });
      function cOnScroll() {
        if (!cActive) return;
        var y = window.scrollY;
        var now = (window.performance && performance.now()) || Date.now();
        var dt = Math.max(now - cLastT, 16) / 1000;
        var dy = y - cLastY;
        cLastY = y;
        cLastT = now;
        if (!dy) return;
        var v = Math.abs(dy) / dt;
        var down = dy > 0;
        var div = down ? 140 : 190;
        var cap = down ? 24 : 12;
        var mag = 1 + Math.min(v / div, cap);
        cTarget = down ? mag : -mag;
        cSettled = false;
      }
      window.addEventListener('scroll', cOnScroll, { passive: true });
      if (window.lenis && window.lenis.on) window.lenis.on('scroll', cOnScroll);
      gsap.ticker.add(function () {
        if (!cLoops.length || cSettled) return;
        cTarget += (1 - cTarget) * 0.05;
        if (Math.abs(cTarget - 1) < 0.001) cTarget = 1;
        var settled = cTarget === 1;
        cLoops.forEach(function (t) {
          var cur = t.timeScale();
          var next = cur + (cTarget - cur) * 0.12;
          if (Math.abs(next - cTarget) < 0.001) next = cTarget;
          if (next !== cur) t.timeScale(next);
          if (Math.abs(next - 1) > 0.001) settled = false;
        });
        cSettled = settled;
      });
      var cRt;
      var cViewportWidth = document.documentElement.clientWidth;
      window.addEventListener('resize', function () {
        var width = document.documentElement.clientWidth;
        if (width === cViewportWidth) return;
        cViewportWidth = width;
        clearTimeout(cRt);
        cRt = setTimeout(buildCtaMarquee, 200);
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

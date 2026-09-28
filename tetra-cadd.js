// Tetra — секции, уникальные для страницы CADD.
// Общие вещи (navbar, footer, CTA, partners, hero, trust, parallax, кнопки)
// переиспользуются из tetra-core.js + tetra-page.js + файлов компонентов —
// здесь только то, чего нет на других страницах:
//   • SECTION_CADD-PRACTICE — залипающая стопка карточек (>=992px)
//   • reveal секций cadd-gap / cadd-fundamentals / cadd-practice
//   • SECTION_CADD-PEG — непрерывный scroll-scrub + SplitText (Figma 12221:20524)
//   • ленты CTA-платформ и логотипов консорциума (механика как у PARTNERS)
//   • SECTION_CADD-NETWORKS — логотипы качаются по орбитам, hover — стоп + плашка
//   • SECTION_CADD-CONTACT — submit формы превращается в <button> с шевроном
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
     * SECTION_CADD-HERO — хореография при загрузке, как HERO лендинга
     * (tetra-page.js 1b): визуал → eyebrow → слова заголовка из маски → текст
     * → кнопки сверху через маску → карточки → navbar → консорциум.
     * Тайминги и изинг — те же, что на лендинге.
     * ------------------------------------------------------------------ */
    var caddHero = document.querySelector('.section_cadd-hero');
    var caddHeroHeading = caddHero && caddHero.querySelector('.cadd-hero_heading');
    if (caddHeroHeading && window.SplitText && !T.off('hero')) {
      // перенос строки в Webflow — символ \n (white-space: pre-line); SplitText
      // его схлопывает, поэтому превращаем в <br> до разбиения
      if (caddHeroHeading.textContent.indexOf('\n') !== -1) {
        var chParts = caddHeroHeading.textContent.split('\n');
        caddHeroHeading.textContent = '';
        chParts.forEach(function (part, i) {
          if (i) caddHeroHeading.appendChild(document.createElement('br'));
          caddHeroHeading.appendChild(document.createTextNode(part.trim()));
        });
      }
      var chSplit = SplitText.create(caddHeroHeading, {
        type: 'lines,words',
        linesClass: 'hero-heading-line',
        wordsClass: 'hero-heading-word'
      });
      var chCoin = caddHero.querySelector('.cadd-hero_coin');
      var chGlow = caddHero.querySelector('.cadd-hero_glow');
      var chEyebrow = caddHero.querySelector('.cadd-hero_eyebrow');
      var chText = caddHero.querySelector('.cadd-hero_text');
      var chButtons = caddHero.querySelectorAll('.hero_button-group .hero-button');
      var chCards = caddHero.querySelectorAll('.cadd-activity-card');
      var chConsortium = caddHero.querySelector('.cadd-consortium');
      var chNavbar = document.querySelector('.navbar-wrapper');
      var chTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });

      if (chGlow) {
        gsap.set(chGlow, { autoAlpha: 0 });
        chTl.to(chGlow, { autoAlpha: 1, duration: 1.4 }, 0);
      }
      if (chCoin) {
        // монета выезжает снизу вверх (y относительный — сохраняем её
        // центрирование translate(-50%, -50%) из вёрстки)
        var chRem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        gsap.set(chCoin, { autoAlpha: 0 });
        chTl.from(chCoin, {
          y: '+=' + 12 * chRem, duration: 1.4, immediateRender: true,
          onComplete: function () { gsap.set(chCoin, { clearProps: 'transform' }); }
        }, 0);
        chTl.to(chCoin, { autoAlpha: 1, duration: 0.8 }, 0);
      }
      if (chEyebrow) {
        gsap.set(chEyebrow, { autoAlpha: 0, yPercent: 50 });
        chTl.to(chEyebrow, { autoAlpha: 1, yPercent: 0, duration: 0.9 }, 0.25);
      }
      gsap.set(chSplit.words, { yPercent: 101 });
      chTl.to(chSplit.words, { yPercent: 0, duration: 1.109, stagger: 0.1, force3D: true }, 0.35);
      if (chText) {
        gsap.set(chText, { autoAlpha: 0, yPercent: 50 });
        chTl.to(chText, { autoAlpha: 1, yPercent: 0, duration: 0.9 }, 0.85);
      }
      if (chButtons.length) {
        gsap.set(chButtons, { yPercent: -110 });
        chTl.to(chButtons, { yPercent: 0, duration: 0.9, stagger: 0.12, force3D: true }, 1.1);
      }
      if (chCards.length) {
        gsap.set(chCards, { autoAlpha: 0, y: '1.5rem' });
        chTl.to(chCards, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12 }, 1.2);
      }
      if (chNavbar) {
        gsap.set(chNavbar, { clipPath: 'inset(0% 0% 100% 0%)' });
        chTl.to(chNavbar, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.1,
          onComplete: function () { gsap.set(chNavbar, { clearProps: 'clipPath' }); }
        }, 1.35);
      }
      if (chConsortium) {
        gsap.set(chConsortium, { autoAlpha: 0, y: '1.5rem' });
        chTl.to(chConsortium, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.5);
      }
      // играем сразу, не ждём window load (как на лендинге)
      chTl.play(0);
    }

    /* ------------------------------------------------------------------ *
     * SECTION_CADD-PEG — «1 CADD = $1 CAD», непрерывный скролл (Figma 12221:20524)
     *  1) секция въезжает: слова надписи по очереди поднимаются снизу вверх
     *     с opacity (SplitText, без маски), надпись крупная (180px) по центру
     *  2) секция закреплена: надпись быстро уменьшается до 32px/80% и уходит
     *     на своё место, монеты выезжают снизу и сходятся в пару; с середины
     *     их движения загорается первая строка, дальше по скроллу — вторая,
     *     а первая гаснет до 40%
     *  Всё — scrub по скроллу. Финальный кадр = вёрстка в Webflow.
     *  Смещения — в rem (1rem = 16px на 1440).
     * ------------------------------------------------------------------ */
    var peg = document.querySelector('.section_cadd-peg');
    if (peg && window.SplitText && !T.off('peg')) {
      mm.add('(min-width: 992px) and (prefers-reduced-motion: no-preference)', function () {
        var label = peg.querySelector('.cadd-peg_label');
        var loonie = peg.querySelector('.cadd-peg_loonie');
        var coin = peg.querySelector('.cadd-peg_coin');
        var lines = peg.querySelectorAll('.cadd-peg_heading .cadd-peg_line');
        if (!label || !loonie || !coin) return;

        function rem(v) {
          return function () {
            return v * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
          };
        }

        var labelSplit = SplitText.create(label, { type: 'words' });

        // стартовое состояние надписи: крупная, по центру экрана
        gsap.set(label, { y: rem(20), scale: 5.625, opacity: 1, transformOrigin: '50% 50%' });

        // 1) слова надписи — пока секция въезжает
        var intro = gsap.fromTo(labelSplit.words,
          { yPercent: 100, opacity: 0 },
          {
            yPercent: 0, opacity: 1, ease: 'none', stagger: 0.15,
            scrollTrigger: { trigger: peg, start: 'top 75%', end: 'top 15%', scrub: 1 }
          });

        // 2) закреплённая часть — одна непрерывная сцена
        var tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: peg,
            start: 'top top',
            end: '+=260%',   // было 180% — добавился шаг со второй строкой
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true
          }
        });
        // надпись уменьшается и уходит наверх быстрее монет — без наложения
        tl.to(label, { y: 0, scale: 1, opacity: 0.8, duration: 0.45, ease: 'power2.inOut' }, 0);
        // монеты выезжают снизу (стартуют полностью за нижним краем секции)
        tl.fromTo(loonie, { y: rem(60) }, { y: 0, duration: 0.7, ease: 'power2.out' }, 0.15);
        tl.fromTo(coin, { x: rem(-0.25), y: rem(72) }, { x: 0, y: 0, duration: 0.7, ease: 'power2.out' }, 0.25);
        if (lines.length) {
          // строки загораются по очереди: первая — с середины движения монет
          // (снизу, синхронно с монетой), дальше по скроллу следующая, а
          // предыдущая гаснет до 40%. Прозрачность задаём явно (is-muted из
          // вёрстки — только для статичного кадра на мобилке / reduced motion)
          var lineIn = { y: 0, opacity: 1, ease: 'power2.out' };
          tl.fromTo(lines[0], { y: rem(30), opacity: 0 }, Object.assign({ duration: 0.45 }, lineIn), 0.5);
          for (var li = 1; li < lines.length; li++) {
            var at = 0.5 + li * 0.6;
            // монеты уже на месте — следующая строка лишь слегка поднимается
            tl.fromTo(lines[li], { y: rem(4), opacity: 0 }, Object.assign({ duration: 0.4 }, lineIn), at);
            tl.to(lines[li - 1], { opacity: 0.4, duration: 0.4, ease: 'power1.inOut' }, at);
          }
          tl.to({}, { duration: 0.15 });   // короткая пауза на финальном кадре
        }

        return function () {
          [intro, tl].forEach(function (a) {
            if (a.scrollTrigger) a.scrollTrigger.kill();
            a.kill();
          });
          labelSplit.revert();
          gsap.set([label, loonie, coin], { clearProps: 'transform,opacity' });
          if (lines.length) gsap.set(lines, { clearProps: 'transform,opacity' });
        };
      });
    }

    /* ------------------------------------------------------------------ *
     * Бесконечные ленты — механика 1:1 с PARTNERS_GRID (tetra-partners.js):
     * чётные ряды влево, нечётные вправо, бесшовно (контент дублируется);
     * скорость модулируется скоростью скролла (вниз — быстрее, вверх — разворот).
     *   scrollMarquee({ rows, trigger, prepare })
     *   prepare(row) — опционально, вызывается перед каждым замером ряда
     * ------------------------------------------------------------------ */
    function scrollMarquee(opts) {
      var rows = opts.rows;
      var loops = [];
      var active = false;
      function build() {
        var previous = loops.map(function (t) {
          return { progress: t.progress(), speed: t.timeScale() };
        });
        loops.forEach(function (t) { t.kill(); });
        loops = [];
        rows.forEach(function (row, ri) {
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
          if (opts.prepare) opts.prepare(row);
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
          if (active) t.resume();
          loops.push(t);
        });
      }
      build();
      var target = 1;
      var settled = true;
      var lastY = window.scrollY;
      var lastT = (window.performance && performance.now()) || Date.now();
      ScrollTrigger.create({
        trigger: opts.trigger, start: 'top bottom', end: 'bottom top',
        onToggle: function (self) {
          active = self.isActive;
          lastY = window.scrollY;
          lastT = (window.performance && performance.now()) || Date.now();
          loops.forEach(function (t) { active ? t.resume() : t.pause(); });
        }
      });
      function onScroll() {
        if (!active) return;
        var y = window.scrollY;
        var now = (window.performance && performance.now()) || Date.now();
        var dt = Math.max(now - lastT, 16) / 1000;
        var dy = y - lastY;
        lastY = y;
        lastT = now;
        if (!dy) return;
        var v = Math.abs(dy) / dt;
        var down = dy > 0;
        var div = down ? 140 : 190;
        var cap = down ? 24 : 12;
        var mag = 1 + Math.min(v / div, cap);
        target = down ? mag : -mag;
        settled = false;
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      if (window.lenis && window.lenis.on) window.lenis.on('scroll', onScroll);
      gsap.ticker.add(function () {
        if (!loops.length || settled) return;
        target += (1 - target) * 0.05;
        if (Math.abs(target - 1) < 0.001) target = 1;
        var done = target === 1;
        loops.forEach(function (t) {
          var cur = t.timeScale();
          var next = cur + (target - cur) * 0.12;
          if (Math.abs(next - target) < 0.001) next = target;
          if (next !== cur) t.timeScale(next);
          if (Math.abs(next - 1) > 0.001) done = false;
        });
        settled = done;
      });
      var rt;
      var viewportWidth = document.documentElement.clientWidth;
      window.addEventListener('resize', function () {
        var width = document.documentElement.clientWidth;
        if (width === viewportWidth) return;
        viewportWidth = width;
        clearTimeout(rt);
        rt = setTimeout(build, 200);
      });
    }

    // SECTION_CADD-CTA — два ряда платформ
    var ctaRows = document.querySelectorAll('.section_cadd-cta .cadd-cta_row');
    if (ctaRows.length && !T.off('cadd-cta')) {
      scrollMarquee({
        rows: Array.prototype.slice.call(ctaRows),
        trigger: '.section_cadd-cta'
      });
    }

    // HERO — ряд логотипов консорциума: лента начинается от левого края экрана
    var consortiumRow = document.querySelector('.section_cadd-hero .cadd-consortium_row');
    if (consortiumRow && !T.off('consortium')) {
      scrollMarquee({
        rows: [consortiumRow],
        trigger: consortiumRow,
        prepare: function (row) {
          row.style.alignSelf = 'flex-start';
          row.style.justifyContent = 'flex-start';
          row.style.marginLeft = '0px';
          row.style.marginLeft = -row.getBoundingClientRect().left + 'px';
        }
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

    /* ------------------------------------------------------------------ *
     * SECTION_CADD-NETWORKS — логотипы сетей плавают по своим орбитам
     *  • каждый качается по своей орбите вокруг CADD (±15–18°, свой период,
     *    соседи — в разные стороны); пунктир к центру поворачивается следом
     *  • hover — логотип плавно останавливается, чуть увеличивается и над ним
     *    появляется плашка с названием сети из вёрстки (фидбэк Sept 21, «5. Networks»);
     *    на тач-экранах — по тапу
     *  • тикер крутится, только пока секция на экране
     * ------------------------------------------------------------------ */
    var netDiagram = document.querySelector('.section_cadd-networks .cadd-networks_diagram');
    if (netDiagram && !T.off('networks')) {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // плашки с названиями — в вёрстке Webflow (.cadd-networks_label.is-<сеть>,
      // стоят над своим логотипом); тут прячем и дальше ведём за логотипом
      var nets = gsap.utils.toArray(netDiagram.querySelectorAll('.cadd-networks_badge')).map(function (badge, i) {
        var key = (badge.className.match(/\bis-([a-z0-9-]+)/) || [])[1] || '';
        var label = key ? netDiagram.querySelector('.cadd-networks_label.is-' + key) : null;
        if (label) {
          label.setAttribute('aria-hidden', 'true');
          // translate(-50%, -100%) из Webflow переводим в xPercent/yPercent GSAP
          gsap.set(label, { x: 0, y: 0, xPercent: -50, yPercent: -100, autoAlpha: 0 });
        }
        return {
          badge: badge,
          line: key ? netDiagram.querySelector('.cadd-networks_line.is-' + key) : null,
          label: label,
          amp: (15 + (i % 3) * 1.5) * Math.PI / 180,   // размах качания, рад
          period: 20 + (i % 4) * 2.8,                  // сек на полный цикл
          dir: i % 2 ? -1 : 1,                          // соседи — в разные стороны
          t: 0, factor: 1, bx: 0, by: 0, r: 0, base: 0, x: 0, y: 0
        };
      });

      var cx = 0, cy = 0;
      function measureNets() {
        var anyLine = netDiagram.querySelector('.cadd-networks_line');
        cx = anyLine ? anyLine.offsetLeft : netDiagram.offsetWidth / 2;
        cy = anyLine ? anyLine.offsetTop : netDiagram.offsetHeight / 2;
        nets.forEach(function (n) {
          n.bx = n.badge.offsetLeft + n.badge.offsetWidth / 2 - cx;
          n.by = n.badge.offsetTop + n.badge.offsetHeight / 2 - cy;
          n.r = Math.sqrt(n.bx * n.bx + n.by * n.by);
          n.base = Math.atan2(n.by, n.bx);
        });
      }
      function placeNet(n) {
        var a = n.base + n.dir * n.amp * Math.sin(n.t / n.period * Math.PI * 2);
        n.x = n.r * Math.cos(a) - n.bx;
        n.y = n.r * Math.sin(a) - n.by;
        gsap.set(n.badge, { x: n.x, y: n.y });
        if (n.line) gsap.set(n.line, { rotation: a * 180 / Math.PI });
      }
      function tickNets(time, dt) {
        var sec = Math.min(dt, 100) / 1000;
        nets.forEach(function (n) {
          if (!n.factor) return;
          n.t += sec * n.factor;
          placeNet(n);
        });
      }
      measureNets();
      window.addEventListener('resize', function () { measureNets(); nets.forEach(placeNet); });
      if (!reduce) {
        ScrollTrigger.create({
          trigger: netDiagram, start: 'top bottom', end: 'bottom top',
          onToggle: function (self) {
            if (self.isActive) gsap.ticker.add(tickNets); else gsap.ticker.remove(tickNets);
          }
        });
      }

      function showNet(n) {
        gsap.to(n, { factor: 0, duration: 0.5, ease: 'power2.out', overwrite: true });
        n.badge.style.zIndex = '4';
        gsap.to(n.badge, { scale: 1.08, duration: 0.4, ease: 'power2.out' });
        if (!n.label) return;
        // плашка — над логотипом, по центру; позиция на момент остановки
        n.label.style.left = (n.badge.offsetLeft + n.badge.offsetWidth / 2 + n.x) + 'px';
        n.label.style.top = (n.badge.offsetTop + n.y) + 'px';
        gsap.fromTo(n.label, { autoAlpha: 0, y: 0 },
          { autoAlpha: 1, y: -10, duration: 0.35, ease: 'power2.out', overwrite: true });
      }
      function hideNet(n) {
        gsap.to(n, { factor: 1, duration: 0.8, ease: 'power2.inOut', overwrite: true });
        gsap.to(n.badge, { scale: 1, duration: 0.4, ease: 'power2.out', onComplete: function () { n.badge.style.zIndex = ''; } });
        if (n.label) gsap.to(n.label, { autoAlpha: 0, y: 0, duration: 0.25, ease: 'power1.out', overwrite: true });
      }
      var tapped = null;
      nets.forEach(function (n) {
        n.badge.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') showNet(n); });
        n.badge.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hideNet(n); });
        n.badge.addEventListener('click', function () {
          if (window.matchMedia('(hover: hover)').matches) return;
          if (tapped && tapped !== n) hideNet(tapped);
          if (tapped === n) { hideNet(n); tapped = null; } else { showNet(n); tapped = n; }
        });
      });
    }

    ScrollTrigger.refresh();
  }

  /* ------------------------------------------------------------------ *
   * SECTION_CADD-CONTACT — кнопка формы
   *  В Webflow это стандартный Form Button (input[type=submit]) с классами
   *  .button.cadd-contact_button. Input не может содержать разметку, поэтому
   *  меняем его на <button type=submit> с теми же классами + текст + шеврон —
   *  как у остальных кнопок; hover-reveal (tetra-page.js) подхватит её сам.
   * ------------------------------------------------------------------ */
  function upgradeSubmit() {
    document.querySelectorAll('.section_cadd-contact input[type="submit"]').forEach(function (input) {
      var btn = document.createElement('button');
      btn.type = 'submit';
      btn.className = input.className;
      var wait = input.getAttribute('data-wait');
      if (wait) btn.setAttribute('data-wait', wait);
      var label = document.createElement('span');
      label.textContent = input.value;
      btn.appendChild(label);
      btn.insertAdjacentHTML('beforeend',
        '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 16 16" fill="none" class="button_icon" aria-hidden="true">' +
        '<path d="M6 2.6665L10.8619 7.52842C11.1223 7.78877 11.1223 8.21088 10.8619 8.47123L6 13.3332" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>');
      input.replaceWith(btn);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', upgradeSubmit, { once: true });
  } else {
    upgradeSubmit();
  }

  T.ready(init);
})();

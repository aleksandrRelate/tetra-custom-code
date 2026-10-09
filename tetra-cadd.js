// Tetra — секции, уникальные для страницы CADD.
// Общие вещи (navbar, footer, CTA, partners, hero, trust, parallax, кнопки)
// переиспользуются из tetra-core.js + tetra-page.js + файлов компонентов —
// здесь только то, чего нет на других страницах:
//   • SECTION_CADD-PRACTICE — залипающая стопка карточек (>=992px)
//   • reveal секций cadd-gap / cadd-fundamentals / cadd-practice
//   • SECTION_CADD-PEG — непрерывный scroll-scrub + SplitText (Figma 12221:20524)
//   • ленты CTA-платформ и логотипов консорциума (механика как у PARTNERS)
//   • SECTION_CADD-NETWORKS — логотипы качаются по орбитам, hover — стоп + плашка
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
      // после интро — «живые» транзакции вокруг монеты
      if (chCards.length === 2) chTl.eventCallback('onComplete', function () { startCaddTxLoop(caddHero, chCards); });
      // играем сразу, не ждём window load (как на лендинге)
      chTl.play(0);
    }

    /* ------------------------------------------------------------------ *
     * CADD HERO — «живые» транзакции (фидбек 7 окт., Figma 12792:1377)
     *  На сцене 2 плашки. По очереди: одна уходит вверх, появляется снизу
     *  вверх на следующем месте раскадровки с новой суммой, затем то же
     *  со второй. Цикл бесконечный, на паузе вне экрана.
     *  Места — в rem относительно .cadd-hero_stage (десктоп 82×30rem,
     *  мобилка ≤479 — 21.54×24.07rem), место 0 = позиция из вёрстки.
     * ------------------------------------------------------------------ */
    function startCaddTxLoop(hero, cards) {
      if (T.off('hero') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var stage = hero.querySelector('.cadd-hero_stage');
      if (!stage) return;

      // раскадровка Figma 12793:3973: Sent (первая карточка) всегда справа
      // от монеты, Received — слева; каждая идёт по своим 4 местам по кругу
      var SLOTS = {
        desktop: [
          [[50.8125, 6.6875], [53.1875, 20.75], [45.625, 3.75], [51.9375, 22.125]],
          [[10.5625, 15.625], [6.5, 8.75], [14.8125, 21.3125], [6.25, 3.75]]
        ],
        mobile: [
          [[0, 15.3321], [0, 8.6], [0, 19.9], [0, 12]],
          [[8.5439, 3.911], [8.5439, 19.9], [8.5439, 1.2], [8.5439, 16.5]]
        ]
      };
      var VALUES = [
        ['250 CADD', '85 CADD', '2,000 CADD', '320 CADD'],
        ['4,500 CADD', '1,200 CADD', '15,000 CADD', '760 CADD']
      ];
      var mqMobile = window.matchMedia('(max-width: 479px)');
      var slotOf = [0, 0];
      var turn = 0;
      var visible = true;
      var pending = null;

      function place(i) {
        var s = SLOTS[mqMobile.matches ? 'mobile' : 'desktop'][i][slotOf[i]];
        cards[i].style.left = s[0] + 'rem';
        cards[i].style.top = s[1] + 'rem';
      }
      function fill(i) {
        cards[i].querySelector('.cadd-activity-card_value').textContent = VALUES[i][slotOf[i]];
      }
      mqMobile.addEventListener('change', function () { place(0); place(1); });

      function step() {
        pending = null;
        if (!visible) return;
        var i = turn % 2, card = cards[i];
        turn++;
        // смена каждые 3 с (от начала одной смены до начала следующей)
        pending = gsap.delayedCall(3, step);
        gsap.timeline()
          // уход вверх — плавно, без рывка в начале (inOut), той же длины, что появление
          .to(card, { autoAlpha: 0, y: '-1.25rem', duration: 0.7, ease: 'power2.inOut' })
          .add(function () { slotOf[i] = (slotOf[i] + 1) % 4; place(i); fill(i); })
          // immediateRender:false обязателен: иначе fromTo применяет своё стартовое
          // состояние (opacity 0) в момент создания таймлайна и плашка пропадает
          // мгновенно, а tween ухода анимирует уже невидимый элемент
          .fromTo(card, { autoAlpha: 0, y: '1.25rem' }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', immediateRender: false }, '+=0.1');
      }

      pending = gsap.delayedCall(3, step);
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !pending && !gsap.isTweening(cards[0]) && !gsap.isTweening(cards[1])) pending = gsap.delayedCall(0.8, step);
      }).observe(stage);
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
      // на всех ширинах, мобилка — так же, как десктоп
      mm.add('(prefers-reduced-motion: no-preference)', function () {
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
        // масштаб — до 5.625 (180px на десктопе), но не шире 92% экрана (мобилка)
        function startScale() {
          return Math.min(5.625, window.innerWidth * 0.92 / (label.offsetWidth || 1));
        }
        // сдвиг вниз: на десктопе — 20rem (по макету); на мобилке rem крупнее, поэтому
        // считаем так, чтобы центр надписи встал в центр секции (экрана)
        function startY() {
          if (window.innerWidth > 479) return rem(20)();
          var pr = peg.getBoundingClientRect(), lr = label.getBoundingClientRect();
          return (pr.top + peg.clientHeight / 2) - (lr.top + lr.height / 2);
        }
        gsap.set(label, { y: startY(), scale: startScale(), opacity: 1, transformOrigin: '50% 50%' });

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

    // HERO — ряд логотипов консорциума (CMS «Consortium Members»): лента
    // начинается от левого края экрана. Ширина логотипа = ширина из самого
    // SVG (атрибут width, px на макете 1440) → rem; на мобилке ×0.5295, как
    // было в Figma. Ширины ставим до замера ленты, поэтому ждём decode().
    var consortiumRow = document.querySelector('.section_cadd-hero .cadd-consortium_row');
    if (consortiumRow && !T.off('consortium')) {
      var logoMq = window.matchMedia('(max-width: 479px)');
      var sizeLogos = function () {
        var k = logoMq.matches ? 0.5295 : 1;
        consortiumRow.querySelectorAll('img.cadd-consortium_logo').forEach(function (img) {
          if (img.naturalWidth) img.style.width = (img.naturalWidth / 16 * k) + 'rem';
        });
      };
      var logoImgs = [].slice.call(consortiumRow.querySelectorAll('img.cadd-consortium_logo'));
      Promise.all(logoImgs.map(function (img) {
        img.loading = 'eager';
        return img.decode ? img.decode()['catch'](function () {}) : Promise.resolve();
      })).then(function () {
        sizeLogos();
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
        logoMq.addEventListener('change', function () { sizeLogos(); ScrollTrigger.refresh(); });
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
      // плашка с названием лежит внутри своего бейджа (.cadd-networks_badge >
      // .cadd-networks_label, в Webflow — над логотипом по центру) и едет вместе
      // с ним; JS только показывает/прячет. Фолбэк — старая вёрстка, где плашки
      // лежали отдельно (.cadd-networks_label.is-<сеть>) и позиционировались JS.
      var nets = gsap.utils.toArray(netDiagram.querySelectorAll('.cadd-networks_badge')).map(function (badge, i) {
        var key = (badge.className.match(/\bis-([a-z0-9-]+)/) || [])[1] || '';
        var label = badge.querySelector('.cadd-networks_label');
        var nested = !!label;
        if (!label && key) label = netDiagram.querySelector('.cadd-networks_label.is-' + key);
        if (label) {
          label.setAttribute('aria-hidden', 'true');
          // translate из Webflow переводим в xPercent/yPercent GSAP
          gsap.set(label, { x: 0, y: 0, xPercent: -50, yPercent: nested ? 0 : -100, autoAlpha: 0 });
        }
        return {
          badge: badge,
          line: key ? netDiagram.querySelector('.cadd-networks_line.is-' + key) : null,
          label: label,
          nested: nested,
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
        if (!n.nested) {
          // старая вёрстка: плашка — над логотипом, по центру; позиция на момент остановки
          n.label.style.left = (n.badge.offsetLeft + n.badge.offsetWidth / 2 + n.x) + 'px';
          n.label.style.top = (n.badge.offsetTop + n.y) + 'px';
        }
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
   * Get CADD (.cadd-platforms_grid) — карточки из CMS, лого приходит как
   * <img src=".svg">. Hover-стили перекрашивают `svg path`, поэтому
   * подменяем img на inline SVG в обёртке с тем же классом. Без GSAP.
   * ------------------------------------------------------------------ */
  function inlinePlatformLogos() {
    document.querySelectorAll('.cadd-platforms_grid img.cadd-platform-card_logo-svg').forEach(function (img) {
      fetch(img.src).then(function (r) { return r.ok ? r.text() : ''; }).then(function (svg) {
        if (svg.indexOf('<svg') === -1) return;
        var box = document.createElement('div');
        box.className = img.className;
        box.innerHTML = svg;
        var el = box.querySelector('svg');
        el.setAttribute('width', '100%');
        el.setAttribute('height', '100%');
        if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', img.alt);
        el.setAttribute('role', 'img');
        img.replaceWith(box);
      }).catch(function () {});
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inlinePlatformLogos, { once: true });
  } else {
    inlinePlatformLogos();
  }

  T.ready(init);
})();

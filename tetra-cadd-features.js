// Tetra — CADD: табы секции «What you can do» (.section_cadd-features).
//   • автоплей: бар активного пункта заполняется за DURATION, затем включается
//     следующий пункт (по кругу); пока секция вне экрана — бар на паузе
//   • клик / Enter / Space по пункту — переключает на него и перезапускает бар
//   • справа: кроссфейд скрина телефона и смена фонового слова (Send → Hold…);
//     через 1 с после включения пункта телефон плавно зумится (десктоп)
//   • фоновое слово — бесконечная бегущая строка
// Стили — tetra-cadd-features.css. Без зависимостей; ?perf=features выключает.
(function () {
  // папка с файлами репозитория (GitHub Pages) — для живых SVG-скринов
  var ASSET_BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '') ||
    'https://aleksandrrelate.github.io/tetra-custom-code/';
  // Bump when the component CSS contract changes; JS and CSS must ship together.
  var STYLE_VERSION = '20261009-1';
  var DURATION = 5000;       // мс на пункт
  var MARQUEE_SPEED = 60;    // px/с — скорость бегущей строки
  var ZOOM_DELAY = 1000;     // мс от включения пункта до зума телефона
  // зум по пунктам: точка фокуса (по высоте скрина), сила, длительность, кривая —
  // у каждого своё, чтобы слайды не повторяли друг друга
  var ZOOMS = [
    // Send and Hold preserve the top inset; Swap preserves the bottom inset.
    // An origin inside the phone shifts its top up by originY * (scale - 1).
    { fy: '0%', scale: 1.85, dur: '1.6s', ease: 'cubic-bezier(0.23, 1, 0.32, 1)' },      // Send — сумма 100.00
    { fy: '0%', scale: 1.6, dur: '2.6s', ease: 'cubic-bezier(0.77, 0, 0.175, 1)' },     // Hold — Activity
    { fy: '100%', scale: 1.75, dur: '2s', ease: 'cubic-bezier(0.77, 0, 0.175, 1)' },      // Swap — You receive ETH
    { fy: '82%', scale: 1.8, dur: '1.2s', ease: 'cubic-bezier(0.23, 1, 0.32, 1)' }      // Spend — кнопка Pay
  ];

  // скрины телефона в порядке пунктов: Send, Hold, Swap, Spend
  var SCREENS = [
    'https://cdn.prod.website-files.com/6a97dd991f9eeb224f3914fa/6ac8b0d67b9bf127ac228c66_Phone%20%E2%80%94%20Send.svg',
    'https://cdn.prod.website-files.com/6a97dd991f9eeb224f3914fa/6ac8b0d6b8335498f0473c3b_Phone%20%E2%80%94%20Hold.svg',
    'https://cdn.prod.website-files.com/6a97dd991f9eeb224f3914fa/6ac8b0d60430b919a564a6d5_Phone%20%E2%80%94%20Swap%20v2%20(ETH).svg',
    'https://cdn.prod.website-files.com/6a97dd991f9eeb224f3914fa/6ac8b0d67286846792bd6b72_Phone%20%E2%80%94%20Spend1.svg'
  ];

  function init() {
    if (window.Tetra && window.Tetra.off && window.Tetra.off('features')) return;

    var section = document.querySelector('.section_cadd-features');
    if (!section) return;
    var tabs = [].slice.call(section.querySelectorAll('.cadd-features_tab-active'));
    if (tabs.length < 2) return;

    var word = section.querySelector('.cadd-features_stage-word');
    var titles = tabs.map(function (tab) {
      var t = tab.querySelector('.cadd-features_tab-title');
      return t ? t.textContent.trim() : '';
    });

    // телефон: первый скрин уже в разметке, остальные — клоны поверх него
    var phones = [];
    var basePhone = section.querySelector('.cadd-features_phone');
    if (basePhone) {
      // первый скрин тоже берём из SCREENS (в Webflow может стоять старый файл)
      if (SCREENS[0]) {
        basePhone.removeAttribute('srcset');
        basePhone.removeAttribute('sizes');
        basePhone.src = SCREENS[0];
      }
      tabs.forEach(function (tab, i) {
        if (i === 0) { phones.push(basePhone); return; }
        if (!SCREENS[i]) return;
        var img = basePhone.cloneNode(false);
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
        img.loading = 'eager';
        img.src = SCREENS[i];
        img.alt = 'CADD wallet ' + titles[i].toLowerCase() + ' screen';
        img.classList.add('is-hidden');
        basePhone.parentNode.appendChild(img);
        phones[i] = img;
      });
    }

    // мобилка (<=479): у каждого пункта своя карточка с телефоном — слайд
    // «фото + заголовок + текст» листается целиком (общая сцена скрыта в CSS)
    if (basePhone) {
      tabs.forEach(function (tab, i) {
        var src = i === 0 ? basePhone : phones[i];
        if (!src) return;
        var media = document.createElement('div');
        media.className = 'cadd-features_tab-media';
        media.setAttribute('aria-hidden', 'true');
        var img = src.cloneNode(false);
        img.classList.remove('is-hidden');
        img.classList.add('cadd-features_tab-phone');
        media.appendChild(img);
        tab.insertBefore(media, tab.firstChild);
      });
    }

    var list = tabs[0].parentNode;
    list.setAttribute('role', 'tablist');

    // бесконечная лента на мобилке: [клоны][оригиналы][клоны]; после прокрутки
    // позиция незаметно переставляется в средний набор. На десктопе клоны скрыты.
    var nodes = tabs.map(function (tab, i) { tab.setAttribute('data-idx', i); return [tab]; });
    var before = document.createDocumentFragment();
    var after = document.createDocumentFragment();
    tabs.forEach(function (tab, i) {
      [before, after].forEach(function (frag) {
        var c = tab.cloneNode(true);
        c.classList.add('is-clone');
        c.setAttribute('aria-hidden', 'true');
        c.removeAttribute('id');
        frag.appendChild(c);
        nodes[i].push(c);
      });
    });
    list.insertBefore(before, tabs[0]);
    list.appendChild(after);

    var bars = nodes.map(function (arr) {
      return arr.map(function (n) { return n.querySelector('.cadd-features_progress-bar'); }).filter(Boolean);
    });

    var current = -1;
    var wordTimer = null;

    /* ---- бегущая строка: слова в дорожке .cadd-features_stage-track,
       копий хватает на 2 ширины сцены, CSS сдвигает дорожку на -50% ---- */
    var track = null;
    var stage = word ? word.parentNode : null;
    var wordText = titles[0];

    function buildMarquee(text) {
      if (!track) return;
      wordText = text;
      track.innerHTML = '';
      var probe = document.createElement('span');
      probe.textContent = text;
      track.appendChild(probe);
      var unit = probe.getBoundingClientRect().width || 1;
      var perHalf = Math.ceil(stage.clientWidth / unit) + 1;
      for (var k = 1; k < perHalf * 2; k++) {
        var s = document.createElement('span');
        s.textContent = text;
        s.setAttribute('aria-hidden', 'true');
        track.appendChild(s);
      }
      track.style.setProperty('--cadd-marquee-duration', (unit * perHalf / MARQUEE_SPEED) + 's');
    }

    if (word && stage) {
      track = document.createElement('div');
      track.className = 'cadd-features_stage-track';
      word.innerHTML = '';
      word.appendChild(track);
      buildMarquee(wordText);
      // ширина слова зависит от шрифта и rem (вьюпорт) — пересобрать
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { buildMarquee(wordText); });
      }
      var resizeTimer = null;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { buildMarquee(wordText); }, 200);
      });
    }

    function setWord(text) {
      if (!track) return;
      clearTimeout(wordTimer);
      word.classList.add('is-switching');
      wordTimer = setTimeout(function () {
        buildMarquee(text);
        word.classList.remove('is-switching');
      }, 250);
    }

    /* ---- таймер пункта: время копится только пока секция видна ---- */
    var paused = true;
    var elapsed = 0;
    var lastTs = null;

    function setBar(i, p) {
      (bars[i] || []).forEach(function (bar) { bar.style.transform = 'scaleX(' + p + ')'; });
    }

    function tick(now) {
      var dt = lastTs === null ? 0 : Math.min(now - lastTs, 100); // после скрытой вкладки — без скачка
      lastTs = now;
      if (!paused && current !== -1) {
        elapsed += dt;
        if (elapsed >= DURATION) activate((current + 1) % tabs.length);
        else setBar(current, elapsed / DURATION);
      }
      requestAnimationFrame(tick);
    }

    /* ---- мобилка (<=479): слайды листаются свайпом, лента бесконечная;
       активный слайд уезжает к левому краю, а слайд, остановившийся у края
       после свайпа, становится активным ---- */
    var mobileMq = window.matchMedia('(max-width: 479px)');
    var autoScrolling = false;
    var autoScrollTimer = null;

    function edgeX() { return list.getBoundingClientRect().left; }
    function setWidth() {
      // ширина одного набора = расстояние между оригиналом и его клоном
      return nodes[0][0].getBoundingClientRect().left - nodes[0][1].getBoundingClientRect().left;
    }
    // перестановка в средний набор — без анимации, снап не трогаем
    function jump(dx) { list.scrollLeft += dx; }
    // держим позицию в среднем наборе, чтобы с обеих сторон всегда были слайды
    function normalize() {
      if (!mobileMq.matches) return;
      var w = setWidth();
      if (!w) return;
      var pitch = w / tabs.length;
      // сдвиг первого оригинала от края: в среднем наборе от 0 до -(w - pitch)
      var first = nodes[0][0].getBoundingClientRect().left - edgeX();
      if (first > pitch / 2) jump(w);             // уехали в левые клоны
      else if (first < -w + pitch / 2) jump(-w);  // уехали в правые клоны
    }

    // автоплей: одна плавная прокрутка к ближайшему экземпляру слайда справа
    function scrollToTab(i) {
      if (!mobileMq.matches) return;
      var edge = edgeX(), best = null;
      nodes[i].forEach(function (n) {
        var d = n.getBoundingClientRect().left - edge;
        if (d > -2 && (best === null || d < best)) best = d;
      });
      if (best === null) return;
      autoScrolling = true;
      clearTimeout(autoScrollTimer);
      list.scrollTo({ left: list.scrollLeft + best, behavior: 'smooth' });
      autoScrollTimer = setTimeout(function () { autoScrolling = false; normalize(); }, 800);
    }

    // общая сцена справа (десктоп) на мобилке не нужна — у слайдов свои карточки.
    // Прячем и из JS, чтобы не зависеть от того, успел ли обновиться CSS
    var stageEl = section.querySelector('.cadd-features_stage');
    function syncStage() { if (stageEl) stageEl.style.display = mobileMq.matches ? 'none' : ''; }
    syncStage();
    mobileMq.addEventListener && mobileMq.addEventListener('change', syncStage);

    if (mobileMq.matches) jump(setWidth()); // старт — на оригиналах (средний набор)
    mobileMq.addEventListener && mobileMq.addEventListener('change', function (e) {
      if (e.matches) { list.scrollLeft = 0; jump(setWidth()); scrollToTab(current); }
    });

    function nearestToEdge() {
      var edge = edgeX(), best = 0, bestD = Infinity;
      nodes.forEach(function (arr, j) {
        arr.forEach(function (n) {
          var d = Math.abs(n.getBoundingClientRect().left - edge);
          if (d < bestD) { bestD = d; best = j; }
        });
      });
      return best;
    }
    // свайп: активен слайд, ближайший к левому краю — сразу по ходу свайпа
    // (размеры слайдов не меняются, так что это безопасно); перестановка в
    // средний набор — когда скролл остановился
    var swipeTimer = null, swipeRaf = 0;
    list.addEventListener('scroll', function () {
      if (!mobileMq.matches || autoScrolling) return;
      if (!swipeRaf) swipeRaf = requestAnimationFrame(function () {
        swipeRaf = 0;
        var best = nearestToEdge();
        if (best !== current) activate(best, true);
      });
      clearTimeout(swipeTimer);
      swipeTimer = setTimeout(normalize, 150);
    }, { passive: true });

    // зум телефона: новый — с обычного размера, через ZOOM_DELAY увеличивается;
    // уходящий остаётся увеличенным, пока гаснет, потом сбрасывается без анимации
    var zoomTimer = null;
    var zoomPending = -1;
    function zoomPhone(i) {
      clearTimeout(zoomTimer);
      phones.forEach(function (p, j) {
        if (!p || j === i || !p.classList.contains('is-zoomed')) return;
        setTimeout(function () {
          if (!p.classList.contains('is-hidden')) return;
          p.classList.add('is-zoom-reset');
          p.classList.remove('is-zoomed');
          p.offsetWidth;
          p.classList.remove('is-zoom-reset');
        }, 550);
      });
      var phone = phones[i];
      if (!phone) return;
      var z = ZOOMS[i] || ZOOMS[0];
      phone.style.setProperty('--zoom-fy', z.fy);
      phone.style.setProperty('--zoom-scale', z.scale);
      phone.style.setProperty('--zoom-dur', z.dur);
      phone.style.setProperty('--zoom-ease', z.ease);
      phone.classList.add('is-zoom-reset');
      phone.classList.remove('is-zoomed');
      phone.offsetWidth;
      phone.classList.remove('is-zoom-reset');
      // секция не на экране — зум и сцену запускаем, когда её покажут
      if (paused) { zoomPending = i; return; }
      zoomPending = -1;
      if (live) live.play(i);
      // берём phones[i] в момент срабатывания: картинку к этому времени мог заменить живой SVG
      zoomTimer = setTimeout(function () { (phones[i] || phone).classList.add('is-zoomed'); }, ZOOM_DELAY);
    }

    function activate(i, fromSwipe) {
      nodes.forEach(function (arr, j) {
        arr.forEach(function (n) { n.classList.remove('is-active'); });
        tabs[j].setAttribute('aria-selected', 'false');
        setBar(j, 0);
      });
      elapsed = 0;
      nodes[i].forEach(function (n) { n.classList.add('is-active'); });
      tabs[i].setAttribute('aria-selected', 'true');

      phones.forEach(function (p, j) { if (p) p.classList.toggle('is-hidden', j !== i); });
      zoomPhone(i);
      if (current !== -1 && i !== current) setWord(titles[i]);
      var wasStarted = current !== -1;
      current = i;
      if (wasStarted && !fromSwipe) scrollToTab(i);
    }

    nodes.forEach(function (arr, i) {
      arr.slice(1).forEach(function (c) { c.addEventListener('click', function () { activate(i); }); });
    });
    tabs.forEach(function (tab, i) {
      tab.setAttribute('role', 'tab');
      tab.tabIndex = 0;
      tab.addEventListener('click', function () { activate(i); });
      tab.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(i); }
      });
    });

    // автоплей и бегущая строка — только пока секция видна
    function setPaused(v) {
      paused = v;
      section.classList.toggle('is-paused', v);
      if (!v && zoomPending !== -1) zoomPhone(zoomPending);
    }
    setPaused(true);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        setPaused(!entries[0].isIntersecting);
      }, { threshold: 0.35 }).observe(section);
    } else {
      setPaused(false);
    }

    // живые экраны (десктоп): SVG с текстом вместо картинок + анимация интерфейса
    var live = window.matchMedia('(min-width: 480px)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? livePhones(phones) : null;

    section.classList.add('is-tabs-ready');
    activate(0);
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------ *
   * ЖИВЫЕ ЭКРАНЫ ТЕЛЕФОНА (десктоп). Скрины — SVG из Figma с живым текстом
   * и id слоёв (assets/cadd-phones/*.svg, экспорт 12451:2205 / 2305,
   * 12789:1377, 12451:2483). Встраиваются в страницу вместо <img>, и на
   * каждом пункте вместе с зумом проигрывается своя короткая сцена:
   *   Send  — набор суммы на клавиатуре 1 → 10 → 100.00, нажатие кнопки
   *   Hold  — в Activity въезжает новая строка, баланс растёт до 1,550.00
   *   Swap  — стрелка делает оборот, сумма ETH «считается» до 0.0547
   *   Spend — нажатие Pay → обработка → «Paid ✓» и подтверждение
   * При смене пункта сцена сбрасывается в исходный кадр.
   * ------------------------------------------------------------------ */
  var LIVE_FILES = ['send.svg', 'hold.svg', 'swap.svg', 'spend.svg'];
  var LIVE_START = 0.9; // с от включения пункта — почти вместе с зумом
  var SVGNS = 'http://www.w3.org/2000/svg';
  var CX = 130.2;       // центр экрана по x в координатах SVG

  function livePhones(phones) {
    var screens = [];   // { svg, build(): timeline } по пунктам
    var tl = null;
    var wanted = -1;

    function q(svg, id) { return svg.querySelector('[id="' + id + '"]'); }
    // текст по центру экрана: якорь middle, чтобы смена цифр не сдвигала строку
    function center(text) {
      if (!text) return null;
      var ts = text.querySelector('tspan');
      text.setAttribute('text-anchor', 'middle');
      ts.setAttribute('x', CX);
      text.style.fontVariantNumeric = 'tabular-nums';
      return ts;
    }
    function money(v, d) {
      return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    }
    function el(tag, attrs, parent) {
      var n = document.createElementNS(SVGNS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }

    var BUILD = [
      // Send — набор 1 → 10 → 100, затем .00, чип «100», нажатие кнопки
      function (svg) {
        var amt = center(q(svg, '100.00'));
        var cad = center(q(svg, '$100.00 CAD'));
        var chip = q(svg, 'Chip_3');
        var chipRect = chip && chip.querySelector('rect');
        var btn = q(svg, 'Send button');
        var keypad = q(svg, 'Keypad');
        // подсветка клавиш: прямоугольники под цифрами (ряд 1 и ряд 4)
        function keyBg(col, row) {
          return el('rect', {
            x: 21.44 + col * 81.02, y: [279.8, 336.5, 393.2, 449.9][row],
            width: 55.4, height: 28.33, rx: 4, fill: '#EBEDF4', opacity: 0
          }, null);
        }
        var k1 = keyBg(0, 0), k0a = keyBg(1, 3);
        keypad.insertBefore(k1, keypad.firstChild);
        keypad.insertBefore(k0a, keypad.firstChild);
        function set(v) { amt.textContent = v; cad.textContent = '$' + v + ' CAD'; }
        function press(r) {
          return gsap.timeline().to(r, { opacity: 1, duration: 0.08 }).to(r, { opacity: 0, duration: 0.35, ease: 'power2.out' });
        }
        return function () {
          set('0.00'); amt.parentNode.setAttribute('fill', '#B8BCC6');
          if (chipRect) chipRect.setAttribute('stroke', '#EBEDF4');
          gsap.set(btn, { scale: 1, svgOrigin: CX + ' 506' });
          return gsap.timeline()
            .add(press(k1)).call(function () { set('1'); amt.parentNode.setAttribute('fill', '#090E13'); }, null, 0.05)
            .add(press(k0a), 0.45).call(function () { set('10'); }, null, 0.5)
            .add(press(k0a), 0.85).call(function () { set('100'); }, null, 0.9)
            .call(function () { set('100.00'); if (chipRect) chipRect.setAttribute('stroke', '#090E13'); }, null, 1.3)
            .to(btn, { scale: 0.96, duration: 0.12, ease: 'power2.out' }, 2.2)
            .to(btn, { scale: 1, duration: 0.3, ease: 'power3.out' }, 2.32);
        };
      },
      // Hold — новая строка сверху в Activity, баланс 1,250 → 1,550
      function (svg) {
        var bal = center(q(svg, '1,250.00'));
        var sub = center(q(svg, 'CADD · $1,250.00 CAD'));
        var list = q(svg, 'Activity list');
        var rows = [].slice.call(list.children);
        var row = rows[0].cloneNode(true);
        row.removeAttribute('id');
        var texts = row.querySelectorAll('text');
        texts.forEach(function (tx) {
          var s = tx.textContent;
          if (s === 'From Liam Chen') tx.querySelector('tspan').textContent = 'From Noah Patel';
        });
        list.insertBefore(row, list.firstChild);
        var PITCH = 40.76;
        var val = { v: 1250 };
        function setBal(v) { bal.textContent = money(v, 2); sub.textContent = 'CADD  ·  $' + money(v, 2) + ' CAD'; }
        return function () {
          setBal(1250); val.v = 1250;
          gsap.set(row, { y: -PITCH, opacity: 0 });
          gsap.set(rows, { y: 0 });
          return gsap.timeline()
            .to(rows, { y: PITCH, duration: 0.7, ease: 'power3.inOut' }, 0)
            .to(row, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.inOut' }, 0.1)
            .to(val, { v: 1550, duration: 1.1, ease: 'power2.out', onUpdate: function () { setBal(val.v); } }, 0.6);
        };
      },
      // Swap — стрелка полный оборот, ETH считается 0.0000 → 0.0547, плашка ETH вспыхивает
      function (svg) {
        var arrow = q(svg, 'Swap arrow');
        var eth = q(svg, '0.0547');
        var ethTs = eth.querySelector('tspan');
        eth.style.fontVariantNumeric = 'tabular-nums';
        var token = q(svg, 'Token_2');
        var val = { v: 0 };
        return function () {
          ethTs.textContent = '0.0000'; val.v = 0;
          gsap.set(arrow, { rotation: 0, svgOrigin: '130.21 179.96' });
          gsap.set(token, { scale: 1, svgOrigin: '203.5 237.77' });
          return gsap.timeline()
            .to(arrow, { rotation: 360, duration: 0.8, ease: 'power3.inOut' }, 0)
            .to(val, { v: 0.0547, duration: 1.2, ease: 'power2.out', onUpdate: function () { ethTs.textContent = val.v.toFixed(4); } }, 0.3)
            .to(token, { scale: 1.08, duration: 0.18, ease: 'power2.out' }, 1.4)
            .to(token, { scale: 1, duration: 0.4, ease: 'power3.out' }, 1.58);
        };
      },
      // Spend — нажатие Pay → «Processing…» → зелёная «Paid ✓» и подтверждение над кнопкой
      function (svg) {
        var btn = q(svg, 'Button');
        var rect = btn.querySelector('rect');
        var label = center(q(svg, 'Pay 42.50 CADD'));
        var screen = q(svg, 'Screen');
        var done = el('g', { opacity: 0 }, screen);
        el('circle', { cx: CX, cy: 420, r: 16, fill: '#E8F5EE' }, done);
        el('path', { d: 'M123.2 420.2l4.6 4.6 9.6-9.8', stroke: '#178C4D', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, done);
        var dt = el('text', { x: CX, y: 452, 'text-anchor': 'middle', fill: '#090E13', 'font-family': 'Suisse Intl', 'font-size': 10.09 }, done);
        dt.textContent = 'Paid to Northern Coffee Co.';
        var dt2 = el('text', { x: CX, y: 465, 'text-anchor': 'middle', fill: '#666666', 'font-family': 'Suisse Intl', 'font-size': 8.2 }, done);
        dt2.textContent = 'Order #4821  ·  just now';
        return function () {
          label.textContent = 'Pay 42.50 CADD';
          rect.setAttribute('fill', '#CE191D');
          gsap.set(btn, { scale: 1, svgOrigin: CX + ' 506' });
          gsap.set(done, { opacity: 0, y: 8 });
          return gsap.timeline()
            .to(btn, { scale: 0.96, duration: 0.12, ease: 'power2.out' }, 0.2)
            .to(btn, { scale: 1, duration: 0.3, ease: 'power3.out' }, 0.32)
            .call(function () { label.textContent = 'Processing…'; }, null, 0.3)
            .call(function () { label.textContent = 'Paid ✓'; rect.setAttribute('fill', '#178C4D'); }, null, 1.2)
            .to(done, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 1.3);
        };
      }
    ];

    // подгружаем SVG и подменяем картинки (классы сохраняем — позиция и зум из CSS)
    LIVE_FILES.forEach(function (file, i) {
      var img = phones[i];
      if (!img || !BUILD[i]) return;
      fetch(ASSET_BASE + 'assets/cadd-phones/' + file).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      }).then(function (markup) {
        var box = document.createElement('div');
        box.className = img.className;
        box.setAttribute('role', 'img');
        box.setAttribute('aria-label', img.alt || '');
        box.innerHTML = markup;
        var svg = box.querySelector('svg');
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.style.cssText = 'display:block;width:100%;height:auto;overflow:visible';
        // стили зума (CSS-переменные) уже могли быть выставлены на картинке
        box.style.cssText = img.style.cssText;
        img.parentNode.replaceChild(box, img);
        phones[i] = box;
        screens[i] = { svg: svg, start: BUILD[i](svg) };
        if (wanted === i) play(i);
      }).catch(function () { /* остаётся обычная картинка */ });
    });

    function play(i) {
      wanted = i;
      if (tl) { tl.kill(); tl = null; }
      if (!window.gsap) return;
      var s = screens[i];
      if (!s) return;
      tl = gsap.timeline({ delay: LIVE_START }).add(s.start());
    }
    return { play: play };
  }

  // Webflow keeps the same asset URLs across GitHub Pages deployments. An open
  // page (or browser cache) can therefore pair new JS with old CSS. Load the
  // matching stylesheet before creating overlapping phone layers and SVGs.
  function start() {
    if (!document.querySelector('.section_cadd-features')) return;
    if (window.Tetra && window.Tetra.off && window.Tetra.off('features')) return;
    var link = document.querySelector('link[rel="stylesheet"][href*="tetra-cadd-features.css"]');
    var url = new URL(link ? link.href : ASSET_BASE + 'tetra-cadd-features.css', document.baseURI);
    if (link && url.searchParams.get('v') === STYLE_VERSION && link.sheet) {
      init();
      return;
    }
    var isNew = !link;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
    }
    link.addEventListener('load', init, { once: true });
    link.addEventListener('error', function () {
      // Keep the original static Webflow content if component styles fail.
      console.warn('Tetra CADD features: stylesheet failed to load; keeping static content.');
    }, { once: true });
    url.searchParams.set('v', STYLE_VERSION);
    link.href = url.href;
    if (isNew) document.head.appendChild(link);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

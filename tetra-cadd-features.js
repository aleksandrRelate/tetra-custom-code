// Tetra — CADD: табы секции «What you can do» (.section_cadd-features).
//   • автоплей: бар активного пункта заполняется за DURATION, затем включается
//     следующий пункт (по кругу); пока секция вне экрана — бар на паузе
//   • клик / Enter / Space по пункту — переключает на него и перезапускает бар
//   • справа: кроссфейд скрина телефона и смена фонового слова (Send → Hold…);
//     через 1 с после включения пункта телефон плавно зумится (десктоп)
//   • фоновое слово — бесконечная бегущая строка
// Стили — tetra-cadd-features.css. Без зависимостей; ?perf=features выключает.
(function () {
  var DURATION = 5000;       // мс на пункт
  var MARQUEE_SPEED = 60;    // px/с — скорость бегущей строки
  var ZOOM_DELAY = 1000;     // мс от включения пункта до зума телефона

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
      phone.classList.add('is-zoom-reset');
      phone.classList.remove('is-zoomed');
      phone.offsetWidth;
      phone.classList.remove('is-zoom-reset');
      zoomTimer = setTimeout(function () { phone.classList.add('is-zoomed'); }, ZOOM_DELAY);
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
    }
    setPaused(true);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        setPaused(!entries[0].isIntersecting);
      }, { threshold: 0.35 }).observe(section);
    } else {
      setPaused(false);
    }

    section.classList.add('is-tabs-ready');
    activate(0);
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

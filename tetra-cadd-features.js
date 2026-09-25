// Tetra — CADD: табы секции «What you can do» (.section_cadd-features).
//   • автоплей: бар активного пункта заполняется за DURATION, затем включается
//     следующий пункт (по кругу); пока секция вне экрана — бар на паузе
//   • клик / Enter / Space по пункту — переключает на него и перезапускает бар
//   • справа: кроссфейд скрина телефона и смена фонового слова (Send → Hold…)
// Стили — tetra-cadd-features.css. Без зависимостей; ?perf=features выключает.
(function () {
  var DURATION = 5000; // мс на пункт

  // скрины телефона в порядке пунктов: Send, Hold, Swap, Spend
  var SCREENS = [
    'https://cdn.prod.website-files.com/6a97dd991f9eeb224f3914fa/6ab657c928385fd73a637753_Phone%20%E2%80%94%20Send.avif',
    'https://cdn.prod.website-files.com/6a97dd991f9eeb224f3914fa/6ab657cafa9b7a41f309e142_Phone%20%E2%80%94%20Hold.avif',
    'https://cdn.prod.website-files.com/6a97dd991f9eeb224f3914fa/6ab657ca28385fd73a637778_Phone%20%E2%80%94%20Swap.avif',
    'https://cdn.prod.website-files.com/6a97dd991f9eeb224f3914fa/6ab657cafa9b7a41f309e13a_Phone%20%E2%80%94%20Move.avif'
  ];

  function init() {
    if (window.Tetra && window.Tetra.off && window.Tetra.off('features')) return;

    var section = document.querySelector('.section_cadd-features');
    if (!section) return;
    var tabs = [].slice.call(section.querySelectorAll('.cadd-features_tab-active'));
    if (tabs.length < 2) return;

    var word = section.querySelector('.cadd-features_stage-word');
    var wordSpans = word ? [].slice.call(word.children) : [];
    var titles = tabs.map(function (tab) {
      var t = tab.querySelector('.cadd-features_tab-title');
      return t ? t.textContent.trim() : '';
    });

    // телефон: первый скрин уже в разметке, остальные — клоны поверх него
    var phones = [];
    var basePhone = section.querySelector('.cadd-features_phone');
    if (basePhone) {
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

    section.style.setProperty('--cadd-tab-duration', DURATION + 'ms');
    var list = tabs[0].parentNode;
    list.setAttribute('role', 'tablist');

    var current = -1;
    var wordTimer = null;

    function setWord(text) {
      if (!word) return;
      clearTimeout(wordTimer);
      word.classList.add('is-switching');
      wordTimer = setTimeout(function () {
        wordSpans.forEach(function (s) { s.textContent = text; });
        word.classList.remove('is-switching');
      }, 250);
    }

    function activate(i) {
      tabs.forEach(function (tab) {
        tab.classList.remove('is-active');
        tab.setAttribute('aria-selected', 'false');
      });
      void tabs[i].offsetWidth; // перезапуск CSS-анимации бара при повторном выборе
      tabs[i].classList.add('is-active');
      tabs[i].setAttribute('aria-selected', 'true');

      phones.forEach(function (p, j) { if (p) p.classList.toggle('is-hidden', j !== i); });
      if (current !== -1 && i !== current) setWord(titles[i]);
      current = i;
    }

    tabs.forEach(function (tab, i) {
      tab.setAttribute('role', 'tab');
      tab.tabIndex = 0;
      tab.addEventListener('click', function () { activate(i); });
      tab.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(i); }
      });
    });

    // бар дошёл до конца — следующий пункт
    section.addEventListener('animationend', function (e) {
      if (e.animationName !== 'cadd-features-progress') return;
      if (!tabs[current] || !tabs[current].contains(e.target)) return;
      activate((current + 1) % tabs.length);
    });

    // автоплей только пока секция видна
    section.classList.add('is-paused');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        section.classList.toggle('is-paused', !entries[0].isIntersecting);
      }, { threshold: 0.35 }).observe(section);
    } else {
      section.classList.remove('is-paused');
    }

    section.classList.add('is-tabs-ready');
    activate(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

// Tetra — CADD: FAQ-аккордеон (.cadd-faq_list).
//   • открыт максимум один пункт; клик по другому закрывает предыдущий
//   • клик по открытому — закрывает его
//   • по умолчанию открыт первый пункт (как в Figma); иконка − / +
// Стили — tetra-cadd-faq.css. Без зависимостей; ?perf=faq выключает.
(function () {
  function init() {
    if (window.Tetra && window.Tetra.off && window.Tetra.off('faq')) return;

    var list = document.querySelector('.cadd-faq_list');
    if (!list) return;
    var items = [].slice.call(list.querySelectorAll('.cadd-faq_item'));
    if (!items.length) return;

    var entries = items.map(function (item, i) {
      var q = item.querySelector('.cadd-faq_question');
      var a = item.querySelector('.cadd-faq_answer');
      var icon = item.querySelector('.cadd-faq_icon');
      if (!q || !a) return null;
      var id = 'cadd-faq-answer-' + i;
      a.id = a.id || id;
      q.setAttribute('role', 'button');
      q.setAttribute('aria-controls', a.id);
      q.tabIndex = 0;
      return { item: item, q: q, a: a, icon: icon };
    }).filter(Boolean);

    function setState(e, open, animate) {
      e.item.classList.toggle('is-expanded', open);
      e.q.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (e.icon) e.icon.textContent = open ? '−' : '+';

      var a = e.a;
      if (!animate) {
        a.style.height = open ? 'auto' : '0px';
        return;
      }
      if (open) {
        a.style.height = a.scrollHeight + 'px';
      } else {
        a.style.height = a.scrollHeight + 'px'; // из auto в px, чтобы анимировать
        void a.offsetHeight;
        a.style.height = '0px';
      }
    }

    // после раскрытия — height:auto, чтобы ответ подстраивался под ресайз
    entries.forEach(function (e) {
      e.a.addEventListener('transitionend', function (ev) {
        if (ev.propertyName === 'height' && e.item.classList.contains('is-expanded')) {
          e.a.style.height = 'auto';
        }
      });
    });

    function toggle(target) {
      var willOpen = !target.item.classList.contains('is-expanded');
      entries.forEach(function (e) {
        if (e === target) setState(e, willOpen, true);
        else if (e.item.classList.contains('is-expanded')) setState(e, false, true);
      });
    }

    entries.forEach(function (e, i) {
      setState(e, i === 0, false);
      e.q.addEventListener('click', function () { toggle(e); });
      e.q.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(e); }
      });
    });

    list.classList.add('is-faq-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

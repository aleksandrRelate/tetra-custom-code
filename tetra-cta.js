// Tetra — компонент CTA: reveal при въезде в вьюпорт.
//   heading (пословно) → text → кнопки (сверху вниз через маску).
// Компонент Contact form: submit → фирменная <button> (см. внизу).
//
// Depends on: window.Tetra (tetra-core.js), GSAP + ScrollTrigger + SplitText.
(function () {
  var T = window.Tetra;
  if (!T) { console.warn('[tetra-cta] window.Tetra не найден — подключи tetra-core.js первым'); return; }

  function init() {
    if (!window.gsap || !window.ScrollTrigger || !window.SplitText) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    if (T.off('reveal')) return;

    T.mm.add('(prefers-reduced-motion: no-preference)', function () {
      var ctaSection = document.querySelector('.section_cta');
      if (!ctaSection) return;

      var r = T.createReveal();
      var ctaHeading = ctaSection.querySelector('.cta_heading');
      if (ctaHeading) r.revealText(r.timelineFor(ctaHeading), ctaHeading, 0);
      var ctaContent = r.timelineFor(ctaSection.querySelector('.cta_text-group') || ctaSection);
      r.revealText(ctaContent, ctaSection.querySelector('.cta_text'), 0);
      r.revealButtons(ctaContent, ctaSection.querySelectorAll('.cta-button'), 0.2);

      return r.destroy;
    });

    ScrollTrigger.refresh();
  }

  /* ------------------------------------------------------------------ *
   * Компонент CONTACT FORM (.section_contact, якорь #contact) — есть на
   * всех страницах. В Webflow кнопка — стандартный Form Button
   * (input[type=submit]) с классами .button.contact_button; input не
   * может содержать разметку, поэтому меняем его на <button type=submit> с
   * теми же классами + текст + шеврон, как у остальных кнопок. Hover-reveal
   * (tetra-page.js) подхватывает её сам. Без GSAP — работает всегда.
   * ------------------------------------------------------------------ */
  function upgradeSubmit() {
    document.querySelectorAll('.contact_layout input[type="submit"], .section_contact input[type="submit"]').forEach(function (input) {
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
  /* ------------------------------------------------------------------ *
   * Свитч General Inquiry / CADD Redemption (компонент "Contact layout").
   * Отдельные формы: "General Inquiry", "CADD Redemption", "Request Proof of Reserves".
   * Кнопки [data-contact-tab="general|cadd|proof"] ставят data-contact-mode на
   * .contact_layout; CSS (tetra-page.css) прячет [data-contact-show] чужого
   * режима (интро-текст и форму). ?form=cadd или #cadd открывает CADD сразу
   * (ссылка "CADD Redemptions" в футере); ?form=proof или #proof — Proof of Reserves.
   * ------------------------------------------------------------------ */
  function initContactSwitch() {
    var q = new URLSearchParams(location.search).get('form');
    var initial = q === 'cadd' || location.hash === '#cadd' ? 'cadd' :
      q === 'proof' || location.hash === '#proof' ? 'proof' : 'general';
    document.querySelectorAll('.contact_layout').forEach(function (layout) {
      var tabs = layout.querySelectorAll('[data-contact-tab]');
      if (!tabs.length) return;

      function setMode(mode) {
        layout.setAttribute('data-contact-mode', mode);
        tabs.forEach(function (tab) {
          var on = tab.getAttribute('data-contact-tab') === mode;
          tab.classList.toggle('is-active', on);
          tab.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      }

      // Анимированная смена: текущие интро-текст и форма уходят вниз с
      // затуханием, новые приходят снизу вверх; обёртка форм плавно меняет
      // высоту. Web Animations API — без зависимости от GSAP.
      var busy = false;
      function switchTo(mode) {
        var current = layout.getAttribute('data-contact-mode');
        if (mode === current || busy) return;
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var outs = layout.querySelectorAll('[data-contact-show="' + current + '"]');
        if (reduce || !Element.prototype.animate || !outs.length) { setMode(mode); return; }
        busy = true;
        var wrap = layout.querySelector('[data-contact-forms]');
        var h0 = wrap ? wrap.offsetHeight : 0;
        var outAnims = Array.prototype.map.call(outs, function (el) {
          return el.animate([
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(24px)' }
          ], { duration: 280, easing: 'cubic-bezier(0.55, 0, 1, 0.45)', fill: 'forwards' });
        });
        outAnims[0].onfinish = function () {
          setMode(mode);
          outAnims.forEach(function (a) { a.cancel(); });
          if (wrap) {
            var h1 = wrap.offsetHeight;
            wrap.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }],
              { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
          }
          var ins = layout.querySelectorAll('[data-contact-show="' + mode + '"]');
          Array.prototype.forEach.call(ins, function (el, i) {
            el.animate([
              { opacity: 0, transform: 'translateY(24px)' },
              { opacity: 1, transform: 'translateY(0)' }
            ], { duration: 520, delay: i * 60, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
          });
          setTimeout(function () {
            busy = false;
            if (window.ScrollTrigger) ScrollTrigger.refresh();
          }, 600);
        };
      }

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () { switchTo(tab.getAttribute('data-contact-tab')); });
      });
      setMode(layout.querySelector('[data-contact-tab="' + initial + '"]') ? initial : 'general');
      switchers.push({ layout: layout, setMode: switchTo });
    });

    // Ссылки на ?form=cadd|proof (футер "CADD Redemptions" / "Request Proof of Reserves"): если форма есть на
    // этой странице — не уходим, а включаем CADD и скроллим к форме;
    // иначе обычный переход на страницу Contact.
    if (!switchers.length) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="form=cadd"], a[href*="form=proof"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      var mode = a.getAttribute('href').indexOf('form=proof') > -1 ? 'proof' : 'cadd';
      var s = switchers[0];
      if (!s.layout.querySelector('[data-contact-tab="' + mode + '"]')) return;
      e.preventDefault();
      s.setMode(mode);
      var target = s.layout.closest('.section_contact') || s.layout;
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(target, { offset: -80, immediate: reduce });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  }
  var switchers = [];

  function initContact() { upgradeSubmit(); initContactSwitch(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContact, { once: true });
  } else {
    initContact();
  }

  T.ready(init);
})();

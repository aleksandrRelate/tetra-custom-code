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
    document.querySelectorAll('.section_contact input[type="submit"]').forEach(function (input) {
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
   * Свитч General Inquiry / CADD Redemption (страница Contact).
   * Кнопки [data-contact-tab="general|cadd"] ставят data-contact-mode на
   * .section_contact; CSS (tetra-page.css) прячет [data-contact-show] чужого
   * режима. Скрытые поля disabled — не уходят в сабмит. В форму пишется
   * hidden-поле "Form type" (для роутинга заявок). ?form=cadd или #cadd
   * открывает CADD сразу (ссылка из футера).
   * ------------------------------------------------------------------ */
  function initContactSwitch() {
    document.querySelectorAll('.section_contact').forEach(function (section) {
      var tabs = section.querySelectorAll('[data-contact-tab]');
      if (!tabs.length) return;
      var form = section.querySelector('form');
      var typeInput = null;
      if (form) {
        typeInput = document.createElement('input');
        typeInput.type = 'hidden';
        typeInput.name = 'Form type';
        form.appendChild(typeInput);
      }

      function setMode(mode) {
        section.setAttribute('data-contact-mode', mode);
        tabs.forEach(function (tab) {
          var on = tab.getAttribute('data-contact-tab') === mode;
          tab.classList.toggle('is-active', on);
          tab.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        section.querySelectorAll('[data-contact-show]').forEach(function (el) {
          var off = el.getAttribute('data-contact-show') !== mode;
          el.querySelectorAll('input, textarea, select').forEach(function (f) { f.disabled = off; });
        });
        if (typeInput) typeInput.value = mode === 'cadd' ? 'CADD Redemption' : 'General Inquiry';
      }

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () { setMode(tab.getAttribute('data-contact-tab')); });
      });

      var q = new URLSearchParams(location.search).get('form');
      setMode(q === 'cadd' || location.hash === '#cadd' ? 'cadd' : 'general');
    });
  }

  function initContact() { upgradeSubmit(); initContactSwitch(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContact, { once: true });
  } else {
    initContact();
  }

  T.ready(init);
})();

/* Tetra — Legal Pages: оглавление из h2 в .legal_content, активный пункт при скролле,
   скрытие пустых оглавления и даты. */
(function () {
  function slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function init() {
    var content = document.querySelector('.legal_content');
    var toc = document.querySelector('.legal_toc');
    var updated = document.querySelector('.legal_updated');

    if (updated && !updated.textContent.replace('Last Updated:', '').trim()) updated.classList.add('is-empty');
    if (!content || !toc) return;

    var heads = content.querySelectorAll('h2');
    if (!heads.length) { toc.classList.add('is-empty'); return; }

    var used = {};
    var label = document.createElement('div');
    label.className = 'legal_toc-label';
    label.textContent = 'On this page';
    var list = document.createElement('div');
    list.className = 'legal_toc-list';
    var links = [];

    heads.forEach(function (h) {
      var id = slug(h.textContent) || 'section';
      if (used[id]) id += '-' + (++used[id]); else used[id] = 1;
      h.id = id;
      var a = document.createElement('a');
      a.className = 'legal_toc-link';
      a.href = '#' + id;
      a.textContent = h.textContent;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.lenis) window.lenis.scrollTo(h, { offset: -100 });
        else h.scrollIntoView({ behavior: 'smooth' });
        history.replaceState(null, '', '#' + id);
      });
      list.appendChild(a);
      links.push(a);
    });

    toc.innerHTML = '';
    toc.appendChild(label);
    toc.appendChild(list);
    label.addEventListener('click', function () { toc.classList.toggle('is-open'); });

    function update() {
      var cur = 0;
      heads.forEach(function (h, i) { if (h.getBoundingClientRect().top < window.innerHeight * 0.3) cur = i; });
      links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

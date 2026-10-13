/* Tetra — Newsroom: внешние записи ведут на источник, табы-фильтр списка
   (All / Announcements / News / Media, ?tab=… в URL), share-ссылки статьи. */
(function () {
  // карточки → /newsroom/<slug> (MCP не умеет ставить ссылку на текущий элемент);
  // external-link → External URL в новой вкладке
  function routeCards() {
    document.querySelectorAll('.news-card[data-slug]').forEach(function (a) {
      a.href = '/newsroom/' + a.getAttribute('data-slug');
    });
    document.querySelectorAll('.news-card[data-type="external-link"]').forEach(function (a) {
      var url = a.getAttribute('data-ext');
      if (!url) return;
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  function initTabs() {
    var groups = document.querySelector('.news-groups');
    var tabs = document.querySelectorAll('.news-tab');
    if (!groups || !tabs.length) return;

    function set(name, push) {
      var all = !name || name === 'all';
      tabs.forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-tab') === (all ? 'all' : name)); });
      if (all) groups.removeAttribute('data-filter'); else groups.setAttribute('data-filter', name);
      groups.querySelectorAll('.news-group').forEach(function (g) {
        g.classList.toggle('is-shown', !all && g.getAttribute('data-group') === name);
      });
      if (push) {
        var u = new URL(location.href);
        if (all) u.searchParams.delete('tab'); else u.searchParams.set('tab', name.toLowerCase());
        history.replaceState(null, '', u);
      }
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }

    // сетка уходит вниз, подменяется и въезжает снизу на место
    var busy = false;
    function swap(name) {
      if (busy) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return set(name, true);
      busy = true;
      var ease = 'cubic-bezier(.2, .7, .2, 1)';
      groups.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(40px)' }],
        { duration: 250, easing: 'ease-in', fill: 'forwards' }).finished.then(function () {
        set(name, true);
        return groups.animate([{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }],
          { duration: 450, easing: ease }).finished;
      }).then(function () {
        groups.getAnimations().forEach(function (a) { a.cancel(); });
        busy = false;
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function (e) { e.preventDefault(); swap(t.getAttribute('data-tab')); });
    });
    document.querySelectorAll('.news-viewall[data-tab]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        swap(a.getAttribute('data-tab'));
        var top = document.querySelector('.news-tabs');
        if (top) top.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    var q = (new URLSearchParams(location.search).get('tab') || '').toLowerCase();
    var match = Array.prototype.find.call(tabs, function (t) { return t.getAttribute('data-tab').toLowerCase() === q; });
    set(match ? match.getAttribute('data-tab') : 'all', false);
  }

  function initShare() {
    var url = location.origin + location.pathname;
    var title = document.title;
    document.querySelectorAll('.news-share_link').forEach(function (a) {
      var kind = a.getAttribute('data-share');
      if (kind === 'linkedin') {
        a.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
      } else if (kind === 'x') {
        a.href = 'https://x.com/intent/post?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title);
      }
      if (kind === 'linkedin' || kind === 'x') {
        a.target = '_blank';
        a.rel = 'noopener';
        return;
      }
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(url).then(function () {
          var txt = a.textContent;
          a.textContent = 'Copied';
          a.classList.add('is-copied');
          setTimeout(function () { a.textContent = txt; a.classList.remove('is-copied'); }, 1600);
        });
      });
    });
  }

  function init() { routeCards(); initTabs(); initShare(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// Tetra — компонент PARTNERS: анимации, живущие вместе с компонентом.
//
// Внутри:
//   • бесконечная лента логотипов (ряд 1 влево, ряд 2 вправо, бесшовно);
//     скорость модулируется скоростью скролла (вниз — быстрее, вверх — разворот)
//   • reveal заголовка и eyebrow при въезде в вьюпорт
//
// Depends on: window.Tetra (tetra-core.js), GSAP + ScrollTrigger
// (+ SplitText для reveal).
(function () {
  var T = window.Tetra;
  if (!T) { console.warn('[tetra-partners] window.Tetra не найден — подключи tetra-core.js первым'); return; }

  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    var mm = T.mm;

    /* ------------------------------------------------------------------ *
     * PARTNERS_GRID — бесконечная лента логотипов
     * ------------------------------------------------------------------ */
    var pWrap = document.querySelector('.section_partners .partners_grid');
    if (pWrap && !T.off('partners')) {
      var pRows = Array.prototype.slice.call(pWrap.querySelectorAll('.partners-row'));
      pWrap.style.overflow = 'hidden';
      var pLoops = [];
      function buildMarquee() {
        var previous = pLoops.map(function (t) {
          return { progress: t.progress(), speed: t.timeScale() };
        });
        pLoops.forEach(function (t) { t.kill(); });
        pLoops = [];
        pRows.forEach(function (row, ri) {
          if (!row.dataset.cloned) {
            var kids = Array.prototype.slice.call(row.children);
            kids.forEach(function (n) { row.appendChild(n.cloneNode(true)); });
            row.dataset.cloned = '1';
            row.dataset.count = kids.length;
          }
          row.style.display = 'flex';
          row.style.flexWrap = 'nowrap';
          row.style.width = 'max-content';
          gsap.set(row, { x: 0 });
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
          if (pActive) t.resume();
          pLoops.push(t);
        });
      }
      buildMarquee();
      var pActive = false;
      var pTarget = 1;
      var pSettled = true;
      var pLastY = window.scrollY;
      var pLastT = (window.performance && performance.now()) || Date.now();
      ScrollTrigger.create({
        trigger: '.section_partners', start: 'top bottom', end: 'bottom top',
        onToggle: function (self) {
          pActive = self.isActive;
          pLastY = window.scrollY;
          pLastT = (window.performance && performance.now()) || Date.now();
          pLoops.forEach(function (t) { pActive ? t.resume() : t.pause(); });
        }
      });
      function pOnScroll() {
        if (!pActive) return;
        var y = window.scrollY;
        var now = (window.performance && performance.now()) || Date.now();
        var dt = Math.max(now - pLastT, 16) / 1000;
        var dy = y - pLastY;
        pLastY = y;
        pLastT = now;
        if (!dy) return;
        var v = Math.abs(dy) / dt;
        var down = dy > 0;
        var div = down ? 140 : 190;
        var cap = down ? 24 : 12;
        var mag = 1 + Math.min(v / div, cap);
        pTarget = down ? mag : -mag;
        pSettled = false;
      }
      window.addEventListener('scroll', pOnScroll, { passive: true });
      if (window.lenis && window.lenis.on) window.lenis.on('scroll', pOnScroll);
      gsap.ticker.add(function () {
        if (!pLoops.length || pSettled) return;
        pTarget += (1 - pTarget) * 0.05;
        if (Math.abs(pTarget - 1) < 0.001) pTarget = 1;
        var settled = pTarget === 1;
        pLoops.forEach(function (t) {
          var cur = t.timeScale();
          var next = cur + (pTarget - cur) * 0.12;
          if (Math.abs(next - pTarget) < 0.001) next = pTarget;
          if (next !== cur) t.timeScale(next);
          if (Math.abs(next - 1) > 0.001) settled = false;
        });
        pSettled = settled;
      });
      var rt;
      var pViewportWidth = document.documentElement.clientWidth;
      window.addEventListener('resize', function () {
        var width = document.documentElement.clientWidth;
        if (width === pViewportWidth) return;
        pViewportWidth = width;
        clearTimeout(rt);
        rt = setTimeout(buildMarquee, 200);
      });
    }

    /* ------------------------------------------------------------------ *
     * PARTNERS — reveal заголовка и eyebrow
     * ------------------------------------------------------------------ */
    if (window.SplitText && !T.off('reveal')) {
      mm.add('(prefers-reduced-motion: no-preference)', function () {
        var targets = document.querySelectorAll('.section_partners .partners_heading, .section_partners .badge .eyebrow_text');
        if (!targets.length) return;
        var r = T.createReveal();
        targets.forEach(function (el) {
          r.revealText(r.timelineFor(el), el, 0);
        });
        return r.destroy;
      });
    }

    ScrollTrigger.refresh();
  }

  T.ready(init);
})();

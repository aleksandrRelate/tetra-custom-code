// Tetra — компонент FOOTER: анимации, живущие вместе с компонентом.
//
// Внутри:
//   • reveal при въезде в вьюпорт: back-to-top, колонки меню, wordmark, legal
//   • пульс обводки wordmark по ховеру (радиальный градиент за курсором)
//
// Depends on: window.Tetra (tetra-core.js), GSAP + ScrollTrigger + SplitText.
(function () {
  var T = window.Tetra;
  if (!T) { console.warn('[tetra-footer] window.Tetra не найден — подключи tetra-core.js первым'); return; }

  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    var mm = T.mm;

    /* ---- reveal контента футера ---- */
    if (window.SplitText && !T.off('reveal')) {
      mm.add('(prefers-reduced-motion: no-preference)', function () {
        var footer = document.querySelector('.section_footer');
        if (!footer) return;

        var r = T.createReveal();
        var timelineFor = r.timelineFor;
        var revealText = r.revealText;
        var revealButtons = r.revealButtons;
        var maskButton = r.maskButton;

        var backToTop = footer.querySelector('.footer_back-to-top');
        if (backToTop) {
          maskButton(backToTop);
          revealButtons(timelineFor(backToTop.parentElement, 'clamp(top 80%)'), [backToTop], 0);
        }
        footer.querySelectorAll('.footer_menu-column').forEach(function (column) {
          var columnTimeline = timelineFor(column, 'clamp(top 80%)');
          revealText(columnTimeline, column.querySelector('.footer_menu-title'), 0);
          var links = column.querySelectorAll('.footer_menu-link');
          if (links.length) {
            gsap.set(links, { autoAlpha: 0, y: 20 });
            columnTimeline.to(links, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.12);
          }
        });
        // На мобилке (<=479px) видимый знак — .footer_wordmark-mob, десктопный
        // .footer_wordmark спрятан (и наоборот). Анимируем тот, что отрисован.
        footer.querySelectorAll('.footer_wordmark, .footer_wordmark-mob').forEach(function (wordmark) {
          if (!wordmark.getClientRects().length) return;
          gsap.set(wordmark, { clipPath: 'inset(100% 0% 0% 0%)' });
          timelineFor(wordmark, 'clamp(top 80%)').to(wordmark, {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.1,
            onComplete: function () { gsap.set(wordmark, { clearProps: 'clipPath' }); }
          }, 0);
        });
        footer.querySelectorAll('.footer_legal-text').forEach(function (el) {
          revealText(timelineFor(el, 'clamp(top 80%)'), el, 0);
        });

        return r.destroy;
      });
    }

    /* ---- пульс обводки wordmark по ховеру (ховер-девайсы) ---- */
    var footerWordmark = (function () {
      var candidates = document.querySelectorAll('.section_footer .footer_wordmark, .section_footer .footer_wordmark-mob');
      for (var i = 0; i < candidates.length; i++) {
        if (candidates[i].getClientRects().length) return candidates[i];
      }
      return candidates[0] || null;
    })();
    if (footerWordmark) {
      mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', function () {
        var SVGNS = 'http://www.w3.org/2000/svg';
        var BASE = '#CE191D';
        var PULSE = '#EBEDF4';
        var path = Array.prototype.slice.call(footerWordmark.children).filter(function (el) {
          return el.tagName.toLowerCase() === 'path';
        }).pop();
        if (!path) return;
        var vb = footerWordmark.viewBox && footerWordmark.viewBox.baseVal;
        var vbW = vb && vb.width ? vb.width : 1392;
        var vbH = vb && vb.height ? vb.height : 289;
        var originalFill = path.getAttribute('fill') || BASE;

        var grad = document.createElementNS(SVGNS, 'radialGradient');
        var gid = 'footer-wordmark-pulse';
        grad.setAttribute('id', gid);
        grad.setAttribute('gradientUnits', 'userSpaceOnUse');
        grad.setAttribute('cx', vbW / 2);
        grad.setAttribute('cy', vbH / 2);
        grad.setAttribute('r', vbW);
        var stop0 = document.createElementNS(SVGNS, 'stop');
        stop0.setAttribute('offset', '0');
        stop0.setAttribute('stop-color', BASE);
        var stop1 = document.createElementNS(SVGNS, 'stop');
        stop1.setAttribute('offset', '1');
        stop1.setAttribute('stop-color', PULSE);
        grad.appendChild(stop0);
        grad.appendChild(stop1);
        var defs = document.createElementNS(SVGNS, 'defs');
        defs.appendChild(grad);
        footerWordmark.insertBefore(defs, footerWordmark.firstChild);

        var hit = document.createElementNS(SVGNS, 'rect');
        hit.setAttribute('x', '0');
        hit.setAttribute('y', '0');
        hit.setAttribute('width', vbW);
        hit.setAttribute('height', vbH);
        hit.setAttribute('fill', 'transparent');
        footerWordmark.appendChild(hit);

        var R_MIN = vbW * 0.15;
        var R_MAX = vbW * 0.30;
        var pulse = null;
        var hovering = false;

        function toSvgPoint(event) {
          var rect = footerWordmark.getBoundingClientRect();
          return {
            x: (event.clientX - rect.left) / rect.width * vbW,
            y: (event.clientY - rect.top) / rect.height * vbH
          };
        }
        function startPulse() {
          if (!hovering) return;
          if (pulse) pulse.kill();
          pulse = gsap.fromTo(grad,
            { attr: { r: R_MAX } },
            { attr: { r: R_MIN }, duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true }
          );
        }
        function onEnter(event) {
          hovering = true;
          gsap.killTweensOf(grad);
          if (pulse) { pulse.kill(); pulse = null; }
          var p = toSvgPoint(event);
          gsap.set(grad, { attr: { cx: p.x, cy: p.y, r: vbW * 1.4 } });
          path.setAttribute('fill', 'url(#' + gid + ')');
          gsap.to(grad, {
            attr: { r: R_MAX },
            duration: 0.55,
            ease: 'power2.out',
            onComplete: startPulse
          });
        }
        function onMove(event) {
          if (!hovering) return;
          var p = toSvgPoint(event);
          gsap.to(grad, { attr: { cx: p.x, cy: p.y }, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        }
        function onLeave() {
          hovering = false;
          if (pulse) { pulse.kill(); pulse = null; }
          gsap.killTweensOf(grad);
          gsap.to(grad, {
            attr: { r: vbW * 1.4 },
            duration: 0.55,
            ease: 'power2.out',
            onComplete: function () { path.setAttribute('fill', originalFill); }
          });
        }
        footerWordmark.addEventListener('pointerenter', onEnter);
        footerWordmark.addEventListener('pointermove', onMove);
        footerWordmark.addEventListener('pointerleave', onLeave);

        return function () {
          if (pulse) pulse.kill();
          gsap.killTweensOf(grad);
          footerWordmark.removeEventListener('pointerenter', onEnter);
          footerWordmark.removeEventListener('pointermove', onMove);
          footerWordmark.removeEventListener('pointerleave', onLeave);
          if (defs.parentNode) defs.parentNode.removeChild(defs);
          if (hit.parentNode) hit.parentNode.removeChild(hit);
          path.setAttribute('fill', originalFill);
        };
      });
    }

    ScrollTrigger.refresh();
  }

  T.ready(init);
})();

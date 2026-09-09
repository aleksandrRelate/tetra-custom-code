// Tetra — компонент NAVBAR: поведение и анимации, живущие вместе с компонентом.
//
// Внутри:
//   • скрытие banner + logo при скролле вниз (nav-menu и кнопки остаются)
//   • переключение цвета навбара по атрибуту секций [navbar-color]
//   • мобильное меню (<=479px): шторка + выезд пунктов из масок
//
// Reveal-строки на ссылках навбара по ховеру — в tetra-page.js
// (общая система btn-reveal для всех кнопок сайта).
//
// Depends on: GSAP (+ ScrollTrigger для 6b). window.Tetra желателен,
// но код работает и без него.
(function () {
  var T = window.Tetra || {};
  var off = T.off || function () { return false; };

  /* ------------------------------------------------------------------ *
   * 6a/6b. NAVBAR — скролл-поведение и переключение темы
   * ------------------------------------------------------------------ */
  function initNavbar() {
    if (!window.gsap) return;
    var s = getComputedStyle(document.documentElement);
    var navRoot = document.querySelector('.navbar');
    var navWrapper = document.querySelector('.navbar-wrapper');

    // 6a. Убираем banner и logo, оставляя само меню видимым.
    if (navWrapper) {
      var navBanner = navWrapper.querySelector('.section_banner');
      var scrollLogo = navWrapper.querySelector('.navbar-logo');
      var bannerH = navBanner ? navBanner.offsetHeight : 0;
      var navCompact = false;
      var lastScrollY = window.scrollY;
      var scrollTicking = false;
      navWrapper.style.willChange = 'transform';
      navWrapper.style.transition = 'transform 350ms ease';
      function updateScrollLogo() {
        if (!scrollLogo) return;
        var hidden = navCompact;                       // прячется одинаково на всех ширинах
        scrollLogo.style.willChange = 'transform, opacity';
        scrollLogo.style.transition = 'transform 350ms ease, opacity 250ms ease';
        scrollLogo.style.opacity = hidden ? '0' : '1';
        scrollLogo.style.transform = hidden ? 'translate3d(0, -100%, 0)' : 'none';
        scrollLogo.style.pointerEvents = hidden ? 'none' : '';
      }
      updateScrollLogo();
      function setNavbarPosition(compactNavbar) {
        if (navCompact === compactNavbar) return;
        navCompact = compactNavbar;
        navWrapper.style.transform = compactNavbar
          ? 'translate3d(0, -' + bannerH + 'px, 0)'
          : 'translate3d(0, 0, 0)';
        updateScrollLogo();
      }
      function updateNavbarPosition() {
        var currentScrollY = window.scrollY;
        if (currentScrollY <= 0) {
          setNavbarPosition(false);
        } else if (currentScrollY > lastScrollY) {
          setNavbarPosition(true);
        } else if (currentScrollY < lastScrollY) {
          setNavbarPosition(false);
        }
        lastScrollY = currentScrollY;
        scrollTicking = false;
      }
      window.addEventListener('scroll', function () {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(updateNavbarPosition);
      }, { passive: true });
      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          bannerH = navBanner ? navBanner.offsetHeight : 0;
          if (navCompact) {
            navWrapper.style.transform =
              'translate3d(0, -' + bannerH + 'px, 0)';
          }
        }, 200);
      });
    }

    // 6b. Переключение цвета навбара по секциям [navbar-color] — нужен ScrollTrigger.
    if (navRoot && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      var navOffset = 6 * (parseFloat(s.fontSize) || 16); // линия переключения цвета, px (= 6rem)
      // Цвет текста/лого и фон меню задаёт tetra-navbar.css по классу темы.
      // База (без класса) = тёмная тема (белый текст); navbar-color="black"
      // на секции → светлая тема (тёмный текст по токену).
      function applyNav(key) {
        navRoot.classList.toggle('is-theme-light', key === 'black');
      }
      var navSecs = gsap.utils.toArray('[navbar-color]');
      navSecs.forEach(function (sec) {
        ScrollTrigger.create({
          trigger: sec,
          start: 'top ' + navOffset + 'px',
          end: 'bottom ' + navOffset + 'px',
          refreshPriority: -1,
          onToggle: function (self) { if (self.isActive) applyNav(sec.getAttribute('navbar-color')); }
        });
      });
      ScrollTrigger.addEventListener('refreshInit', function () {
        var y = window.scrollY + navOffset + 1;
        for (var i = navSecs.length - 1; i >= 0; i--) {
          var r = navSecs[i].getBoundingClientRect();
          var top = r.top + window.scrollY;
          if (y >= top && y < top + r.height) { applyNav(navSecs[i].getAttribute('navbar-color')); break; }
        }
      });
    }
  }

  (T.ready || function (fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  })(initNavbar);

  /* ------------------------------------------------------------------ *
   * Мобильное меню (<=479px) — шторка + выезд пунктов из масок
   * Needs: gsap  |  [nav-menu-mobile], .mobile-nav-bttn
   * Lottie-иконка бургера необязательна (см. комментарии ниже).
   * ------------------------------------------------------------------ */
  (function () {
    if (typeof gsap === "undefined") {
      console.warn("[mobile-menu] GSAP не найден, меню не инициализировано");
      return;
    }

    const BREAKPOINT = 479;

    // TODO: залить JSON иконки бургера в Webflow Assets и вставить URL сюда.
    const LOTTIE_FALLBACK_PATH = "https://cdn.prod.website-files.com/6a97dd991f9eeb224f3914fa/6aa10dfddc6b0c1412dd050b_menu-burger.json";

    const mobileMenu = document.querySelector("[nav-menu-mobile]");
    const mobileNavBtn = document.querySelector(".mobile-nav-bttn");
    if (!mobileMenu || !mobileNavBtn) {
      console.warn("[mobile-menu] не найден [nav-menu-mobile] или .mobile-nav-bttn");
      return;
    }

    const lottieElement = mobileNavBtn.querySelector(".mobile-nav-bttn-lottie");

    const menuLinks = mobileMenu.querySelectorAll(".nav-menu-links-wrapper .nav-link");
    const navSocials = mobileMenu.querySelectorAll(".nav-menu-socials");
    const navButtons = mobileMenu.querySelectorAll(".nav-bttns-wrap.is-mob .button-main");
    const items = Array.from(menuLinks).concat(
      Array.from(navSocials),
      Array.from(navButtons)
    );

    const navHand = mobileMenu.querySelectorAll(".nav-menu-hand");
    const fadeItems = Array.from(navHand);

    const ITEM_TRAVEL = 130;
    const ITEM_DURATION = 0.45;
    const ITEM_EASE = "power3.out";

    const FADE_DURATION = 0.6;

    const FADE_START_ROTATION = 30;
    const FADE_EASE = "power2.out";

    const OPEN_DURATION = 0.7;
    const CURTAIN_EASE = "power1.inOut";

    let isMenuOpen = false;
    let lottieAnimation = null;
    let lottieTween = null;
    const lottiePlayhead = { frame: 0 };
    let tl = null;
    let lockedLenis = null;

    const isMobileScreen = () => window.innerWidth <= BREAKPOINT;

    /* ---------- Lottie (необязательна) ---------- */
    if (!lottieElement) {
      console.warn("[mobile-menu] .mobile-nav-bttn-lottie не найден");
    } else if (typeof lottie === "undefined") {
      console.warn("[mobile-menu] lottie не загружен, иконка работать не будет");
    } else {
      const lottiePath =
        lottieElement.getAttribute("data-src") || LOTTIE_FALLBACK_PATH;

      const inLayout =
        lottieElement.offsetParent !== null ||
        lottieElement.getClientRects().length > 0;
      const box = lottieElement.getBoundingClientRect();

      if (inLayout && (!box.width || !box.height)) {
        console.warn("[mobile-menu] у .mobile-nav-bttn-lottie нулевой размер, ставлю 2rem");
        lottieElement.style.width = lottieElement.style.width || "2rem";
        lottieElement.style.height = lottieElement.style.height || "2rem";
      }

      ["data-animation-type", "data-autoplay", "data-src", "data-w-id"].forEach((a) =>
        lottieElement.removeAttribute(a)
      );

      lottie.getRegisteredAnimations().forEach((anim) => {
        if (anim.wrapper === lottieElement) anim.destroy();
      });
      lottieElement.innerHTML = "";

      if (lottiePath) {
        lottieAnimation = lottie.loadAnimation({
          container: lottieElement,
          renderer: "svg",
          loop: false,
          autoplay: false,
          name: "mobileMenuLottie",
          path: lottiePath,
        });

        lottieAnimation.addEventListener("DOMLoaded", () => {
          lottieAnimation.goToAndStop(0, true);
          const last = lottieAnimation.totalFrames - 1;

          lottieTween = gsap.to(lottiePlayhead, {
            frame: last,
            duration: 0.4,
            ease: "power2.out",
            paused: true,
            onUpdate: () =>
              lottieAnimation.goToAndStop(lottiePlayhead.frame, true),
          });
        });

        lottieAnimation.addEventListener("data_failed", () => {
          console.warn("[mobile-menu] не удалось загрузить JSON:", lottiePath);
          lottieAnimation = null;
        });
      }
    }

    function playIcon(forward) {
      if (!lottieTween) return;
      if (forward) {
        lottieTween.play();
      } else {
        lottieTween.reverse();
      }
    }

    /* ---------- Лого ---------- */
    const navLogo = document.querySelector(".navbar-container .navbar-logo");
    let logoColorBefore = null;

    function whitenLogo() {
      if (!navLogo || logoColorBefore !== null) return;
      logoColorBefore = navLogo.style.color;
      navLogo.style.color = "#FFFFFF";
    }

    function restoreLogo() {
      if (!navLogo || logoColorBefore === null) return;
      navLogo.style.color = logoColorBefore;
      logoColorBefore = null;
    }

    function preventScroll(event) {
      event.preventDefault();
    }

    function lockPageScroll() {
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });

      const lenis = window.lenis;
      if (!lenis || typeof lenis.stop !== "function") return;

      lenis.stop();
      lockedLenis = lenis;
    }

    function unlockPageScroll() {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);

      if (lockedLenis && typeof lockedLenis.start === "function") {
        lockedLenis.start();
      }
      lockedLenis = null;
    }

    /* ---------- Меню ---------- */
    gsap.set(mobileMenu, {
      height: "0vh",
      overflow: "hidden",
      pointerEvents: "none",
    });

    function maskItem(el) {
      const mask = document.createElement("div");

      mask.className = "mob-menu-mask";
      mask.style.overflow = "hidden";
      mask.style.display = "flex";
      mask.style.paddingBottom = "0.16em";
      mask.style.marginBottom = "-0.16em";

      el.parentNode.insertBefore(mask, el);
      mask.appendChild(el);

      return mask;
    }

    let itemMasks = null;
    let fadeRotations = null;

    function ensureMasks() {
      if (itemMasks) return;
      itemMasks = items.map(maskItem);
      fadeRotations = fadeItems.map(function (el) {
        return gsap.getProperty(el, "rotation") || 0;
      });

      gsap.set(items, { yPercent: ITEM_TRAVEL });
      gsap.set(fadeItems, { opacity: 0, rotation: FADE_START_ROTATION });
    }

    const curtainEase = gsap.parseEase(CURTAIN_EASE);

    function curtainReachTime(px) {
      const full = window.innerHeight;
      if (!full) return 0;

      const target = Math.min(px / full, 1);

      for (let i = 1; i <= 120; i += 1) {
        if (curtainEase(i / 120) >= target) return (OPEN_DURATION * i) / 120;
      }

      return OPEN_DURATION;
    }

    function revealTimes(targets) {
      return targets.map(function (el) {
        return curtainReachTime(el.getBoundingClientRect().bottom);
      });
    }

    function openMenu() {
      isMenuOpen = true;
      mobileNavBtn.classList.add("active");
      whitenLogo();
      lockPageScroll();
      gsap.set(mobileMenu, { pointerEvents: "auto" });

      ensureMasks();

      if (tl) {
        tl.play();
        playIcon(true);
        return;
      }

      const at = revealTimes(itemMasks);
      const fadeAt = revealTimes(fadeItems);

      tl = gsap.timeline();
      tl.to(mobileMenu, {
        height: "100vh",
        duration: OPEN_DURATION,
        ease: CURTAIN_EASE
      });

      items.forEach(function (el, index) {
        tl.fromTo(
          el,
          { yPercent: ITEM_TRAVEL },
          { yPercent: 0, duration: ITEM_DURATION, ease: ITEM_EASE },
          at[index]
        );
      });

      fadeItems.forEach(function (el, index) {
        tl.fromTo(
          el,
          { opacity: 0, rotation: FADE_START_ROTATION },
          {
            opacity: 1,
            rotation: fadeRotations[index],
            duration: FADE_DURATION,
            ease: FADE_EASE
          },
          fadeAt[index]
        );
      });

      playIcon(true);
    }

    function closeMenu() {
      isMenuOpen = false;
      mobileNavBtn.classList.remove("active");
      restoreLogo();
      unlockPageScroll();
      gsap.set(mobileMenu, { pointerEvents: "none" });

      if (tl) {
        const closingTimeline = tl;
        closingTimeline.eventCallback("onReverseComplete", function () {
          if (tl !== closingTimeline || isMenuOpen) return;
          tl = null;
        });
        closingTimeline.reverse();
      }

      playIcon(false);
    }

    mobileNavBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (!isMobileScreen()) return;
      isMenuOpen ? closeMenu() : openMenu();
    });

    mobileMenu.querySelectorAll(".nav-link, .button-main").forEach((el) => {
      el.addEventListener("click", function () {
        if (isMenuOpen) closeMenu();
      });
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isMenuOpen) closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > BREAKPOINT && isMenuOpen) closeMenu();
    });
  })();
})();

/* Cookie consent (Figma 12861:1813).
 * Stores the choice in the `tetra_consent` cookie and reports it to GTM:
 *  - gtag('consent', 'update', …) for Google Consent Mode v2;
 *  - dataLayer event `cookie_consent_update` with `consent_analytics` / `consent_marketing`.
 * Consent defaults (all denied) are set inside GTM with a Consent Initialization tag.
 * Any element with [data-cookie-settings] reopens the preferences; a link is also added to the footer.
 */
(function () {
  var COOKIE = 'tetra_consent';
  var MAX_AGE = 60 * 60 * 24 * 180;
  var PRIVACY_URL = '/legal/privacy-policy';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function read() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]*)'));
    if (!m) return null;
    try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; }
  }

  function save(c) {
    c.ts = Date.now();
    document.cookie = COOKIE + '=' + encodeURIComponent(JSON.stringify(c)) +
      '; Max-Age=' + MAX_AGE + '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }

  function apply(c) {
    var a = c.analytics ? 'granted' : 'denied';
    var m = c.marketing ? 'granted' : 'denied';
    gtag('consent', 'update', {
      analytics_storage: a,
      ad_storage: m,
      ad_user_data: m,
      ad_personalization: m
    });
    window.dataLayer.push({
      event: 'cookie_consent_update',
      consent_analytics: a,
      consent_marketing: m
    });
  }

  function choose(c) {
    save(c);
    apply(c);
    closeBanner();
    closeModal();
  }

  function el(html) {
    var t = document.createElement('div');
    t.innerHTML = html.trim();
    return t.firstChild;
  }

  var banner, overlay, lastFocus;

  function openBanner() {
    if (banner) return;
    banner = el(
      '<div class="tc-banner" role="region" aria-label="Cookie consent">' +
        '<div class="tc-text">' +
          '<p>We use cookies to improve your experience and analyse site traffic. You can accept all, reject non-essential cookies or choose your preferences.</p>' +
          '<a class="tc-link" href="' + PRIVACY_URL + '">Privacy Policy</a>' +
        '</div>' +
        '<div class="tc-actions">' +
          '<button type="button" class="button is-nav-bttn" data-tc="accept"><span>Accept all</span></button>' +
          '<button type="button" class="button is-nav-bttn tc-secondary" data-tc="reject"><span>Reject all</span></button>' +
          '<button type="button" class="button is-nav-bttn tc-secondary" data-tc="prefs"><span>Preferences</span></button>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(banner);
  }

  function closeBanner() {
    if (banner) { banner.remove(); banner = null; }
  }

  function category(key, title, desc, checked) {
    var control = key
      ? '<input type="checkbox" class="tc-toggle" data-tc-cat="' + key + '" aria-label="' + title + '"' + (checked ? ' checked' : '') + '>'
      : '<span class="tc-always">Always active</span>';
    return '<div class="tc-cat"><div class="tc-cat-text"><div class="tc-cat-title">' + title +
      '</div><p class="tc-muted">' + desc + '</p></div>' + control + '</div>';
  }

  function openModal() {
    if (overlay) return;
    var c = read() || {};
    lastFocus = document.activeElement;
    overlay = el(
      '<div class="tc-overlay" data-lenis-prevent>' +
        '<div class="tc-modal" role="dialog" aria-modal="true" aria-labelledby="tc-title">' +
          '<div class="tc-text">' +
            '<h2 id="tc-title">Cookie preferences</h2>' +
            '<p class="tc-muted">Choose which cookies we can use. Necessary cookies are always on because the site needs them to work.</p>' +
          '</div>' +
          '<div>' +
            category(null, 'Necessary', 'Required for the website to function, such as security and saving your cookie choices.') +
            category('analytics', 'Analytics', 'Help us understand how visitors use the site (Google Analytics).', c.analytics) +
            category('marketing', 'Marketing', 'Used to measure advertising and show relevant content (LinkedIn, HubSpot).', c.marketing) +
          '</div>' +
          '<div class="tc-actions">' +
            '<button type="button" class="button is-nav-bttn" data-tc="save"><span>Save preferences</span></button>' +
            '<button type="button" class="button is-nav-bttn tc-secondary" data-tc="accept"><span>Accept all</span></button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(overlay);
    overlay.querySelector('.tc-toggle, .button').focus();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tc], [data-cookie-settings]');
    if (!t) {
      if (overlay && e.target === overlay && read()) closeModal();
      return;
    }
    e.preventDefault();
    if (t.hasAttribute('data-cookie-settings')) return openModal();
    var a = t.getAttribute('data-tc');
    if (a === 'accept') choose({ analytics: true, marketing: true });
    else if (a === 'reject') choose({ analytics: false, marketing: false });
    else if (a === 'prefs') openModal();
    else if (a === 'save') {
      choose({
        analytics: overlay.querySelector('[data-tc-cat="analytics"]').checked,
        marketing: overlay.querySelector('[data-tc-cat="marketing"]').checked
      });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && read()) closeModal();
  });

  function addFooterLink() {
    if (document.querySelector('[data-cookie-settings]')) return;
    var legal = document.querySelector('.footer_legal');
    if (!legal) return;
    var b = el('<div class="footer_legal-text"><button type="button" class="tc-settings-link" data-cookie-settings>Cookie settings</button></div>');
    // ссылка — под последней строкой (Tetra Trust …), а не третьей колонкой
    // в flex-ряду .footer_legal (space-between)
    var last = legal.lastElementChild;
    if (!last) { legal.appendChild(b); return; }
    var col = el('<div class="tc-legal-col"></div>');
    last.before(col);
    col.appendChild(last);
    col.appendChild(b);
  }

  function init() {
    addFooterLink();
    var c = read();
    if (c) apply(c);
    else openBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

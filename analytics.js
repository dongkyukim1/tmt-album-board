/* Public GA measurement ID. Credentials belong only in server environment variables. */
(function () {
  'use strict';
  if (window.tmtAnalytics) return;
  const id = 'G-RNF13TKBPY';
  const enabled = ['tmt-album-board.vercel.app', 'dongkyukim1.github.io'].includes(location.hostname)
    && !new URLSearchParams(location.search).has('mock') && !location.pathname.startsWith('/admin');
  let current = '';
  function screen(path) {
    if (path === '/' || /\/index\.html$/.test(path) || path === '/tmt-album-board/') return 'editor';
    if (path.startsWith('/album/')) return 'album_detail';
    if (path.startsWith('/c/')) return 'public_chart';
    if (path.startsWith('/taste')) return 'taste_selection';
    if (path.startsWith('/me')) return 'my_tmt';
    if (/privacy/.test(path)) return 'privacy';
    if (/terms/.test(path)) return 'terms';
    if (/account-deletion/.test(path)) return 'account_deletion';
    return 'web_page';
  }
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  function event(name) {
    if (enabled && !location.pathname.startsWith('/admin') && ['editor_open', 'chart_save', 'share_open'].includes(name)) gtag('event', name);
  }
  function page() {
    window['ga-disable-' + id] = !enabled || location.pathname.startsWith('/admin');
    if (window['ga-disable-' + id]) { current = ''; return; }
    const name = screen(location.pathname);
    if (location.pathname === current) return;
    current = location.pathname;
    // Stable screen names only. No search terms, chart IDs, email, title or query string.
    gtag('set', { page_location: location.origin + '/' + name, page_title: name, page_referrer: '' });
    gtag('event', 'page_view', { page_title: name, page_location: location.origin + '/' + name, page_referrer: '' });
    if (name === 'editor') event('editor_open');
  }
  window.tmtAnalytics = { event: event, page: page };
  if (!enabled) return;
  gtag('js', new Date());
  gtag('set', { page_location: location.origin + '/' + screen(location.pathname), page_title: screen(location.pathname), page_referrer: '' });
  gtag('config', id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
  const script = document.createElement('script'); script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id; document.head.appendChild(script);
  page();
  ['pushState', 'replaceState'].forEach(function (method) {
    const original = history[method];
    history[method] = function () { const result = original.apply(this, arguments); page(); return result; };
  });
  window.addEventListener('popstate', page);
})();

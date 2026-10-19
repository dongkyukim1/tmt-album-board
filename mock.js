/**
 * TMT 로컬 목 모드 — MSW 스타일 fetch 인터셉터 (의존성 0).
 *
 * 비유: 세트장 소품. 진짜 가게(백엔드) 문을 안 열어도 무대(디자인/UX 작업)를 꾸며볼 수 있다.
 *
 * 활성 조건: URL에 `?mock=1` — 그 외엔 아무것도 하지 않는다(배포 환경 안전).
 *   npm run mock   →  http://localhost:8000/?mock=1
 *
 * 가로채는 API (music-api 계약과 동일한 응답 봉투 {data} / {error}):
 *   GET  /itunes/search · /itunes/lookup     — 캔드 앨범/수록곡 (SVG 커버 → 캔버스 다운로드도 동작)
 *   POST /auth/login · refresh · logout      — 아무 이메일/비번이나 통과
 *   POST /auth/signup/* · /auth/password/*   — 코드 000000 으로 진행 가능
 *   GET  /me                                  — 목 프로필
 *   POST /charts                              — 목 차트 id 반환
 */
(function () {
  'use strict';
  if (!new URLSearchParams(location.search).has('mock')) return;

  var DELAY_MS = 280; // 실제 네트워크 감각 재현

  /* ---------- 목 데이터 ---------- */
  var PALETTE = ['#E3B24E', '#E1738A', '#63C39A', '#7A9CC6', '#B8865E', '#8B6FB8', '#5EA8A2', '#C65E5E'];
  function svgCover(label, idx) {
    var bg = PALETTE[idx % PALETTE.length];
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>" +
      "<rect width='600' height='600' fill='" + bg + "'/>" +
      "<rect width='600' height='600' fill='rgba(0,0,0,.28)'/>" +
      "<circle cx='300' cy='300' r='150' fill='none' stroke='rgba(255,255,255,.4)' stroke-width='6'/>" +
      "<circle cx='300' cy='300' r='40' fill='rgba(20,17,13,.9)'/>" +
      "<text x='300' y='540' font-family='Georgia,serif' font-size='52' font-weight='700' fill='rgba(255,255,255,.92)' text-anchor='middle'>" + label + "</text>" +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  var ARTISTS = [
    ['Eminem', ['The Marshall Mathers LP', 'Recovery', 'Kamikaze', 'Encore', 'Relapse', 'Revival']],
    ['Kendrick Lamar', ['DAMN.', 'good kid, m.A.A.d city', 'To Pimp a Butterfly', 'Mr. Morale']],
    ['NewJeans', ['Get Up', 'NJWMX', 'OMG', 'Ditto']],
    ['IU', ['LILAC', 'Palette', 'Love poem', 'Modern Times']],
    ['Radiohead', ['OK Computer', 'In Rainbows', 'Kid A', 'The Bends']],
    ['Frank Ocean', ['Blonde', 'channel ORANGE', 'Endless']],
  ];
  var GENRES = ['Hip-Hop/Rap', 'K-Pop', 'Alternative', 'R&B/Soul', 'Pop', 'Rock'];
  var ALBUMS = [];
  ARTISTS.forEach(function (a, ai) {
    a[1].forEach(function (title, ti) {
      var id = 900000 + ai * 100 + ti;
      ALBUMS.push({
        wrapperType: 'collection', collectionType: 'Album',
        collectionId: id, collectionName: title, artistName: a[0],
        artworkUrl100: svgCover(a[0].split(' ')[0], ai + ti),
        releaseDate: (2008 + ((ai * 3 + ti * 2) % 17)) + '-06-01T00:00:00Z',
        primaryGenreName: GENRES[ai % GENRES.length],
        trackCount: 10 + ((ai + ti) % 8),
      });
    });
  });
  function mockTracks(collectionId) {
    var al = ALBUMS.find(function (a) { return String(a.collectionId) === String(collectionId); });
    var n = al ? al.trackCount : 10;
    var list = [{ wrapperType: 'collection', collectionId: collectionId }];
    for (var i = 1; i <= n; i++) {
      list.push({ wrapperType: 'track', trackNumber: i, trackName: (al ? al.collectionName : 'Track') + ' — 곡 ' + i });
    }
    return list;
  }
  var MOCK_USER = { id: 'mock-user-0000', email: 'mock@tmt.local', nickname: '목유저' };
  var TOKENS = { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' };

  /* 저장/편집/목록용 인메모리 차트 저장소 */
  function seedChart(n, name, comment, size, isPublic) {
    var cells = [];
    for (var i = 0; i < size * size; i++) {
      var al = ALBUMS[(n * 7 + i) % ALBUMS.length];
      cells.push({ index: i, item: { id: String(al.collectionId), type: 'album', title: al.collectionName, artist: al.artistName, artworkUrl: al.artworkUrl100 } });
    }
    return { id: 'mock-chart-' + n, userId: isPublic === 'other' ? 'mock-user-9999' : MOCK_USER.id,
      name: name, comment: comment, rows: size, cols: size, style: {}, cells: cells,
      isPublic: isPublic !== false, updatedAt: '2026-07-2' + n + 'T12:00:00Z' };
  }
  var CHARTS = [
    seedChart(1, '새벽 드라이브', '창문 열고 들어봐', 3, true),
    seedChart(2, '2026 상반기 결산', '올해도 잘 들었다', 4, false),
    seedChart(3, '힙합 입문 코스', '이 순서대로 들어', 3, 'other'),
    seedChart(4, '비 오는 날', '눅눅할 때 꺼내 듣는', 3, 'other'),
    seedChart(5, '운동할 때', 'BPM 보장', 5, 'other'),
    seedChart(6, '퇴근길 한 장', '수고했어 오늘도', 3, 'other'),
  ];
  function toListItem(c) {
    var covers = c.cells.filter(function (x) { return x.item; }).slice(0, 4).map(function (x) { return x.item.artworkUrl; });
    return { id: c.id, name: c.name, comment: c.comment, rows: c.rows, cols: c.cols, style: c.style, isPublic: c.isPublic, updatedAt: c.updatedAt, coverUrls: covers };
  }

  /* ---------- 라우팅 ---------- */
  function json(body, status) {
    return new Response(JSON.stringify(body), {
      status: status || 200, headers: { 'content-type': 'application/json' },
    });
  }
  function route(method, path, params, body) {
    if (path.indexOf('/itunes/search') === 0) {
      var term = (params.get('term') || '').toLowerCase();
      var hits = ALBUMS.filter(function (a) {
        return (a.collectionName + ' ' + a.artistName).toLowerCase().indexOf(term) >= 0;
      });
      return json({ data: { resultCount: hits.length, results: hits } });
    }
    if (path.indexOf('/itunes/lookup') === 0) {
      return json({ data: { results: mockTracks(params.get('id')) } });
    }
    if (path.indexOf('/auth/login') === 0) return json({ data: Object.assign({ user: MOCK_USER }, TOKENS) });
    if (path.indexOf('/auth/refresh') === 0) return json({ data: TOKENS });
    if (path.indexOf('/auth/logout') === 0) return json({ data: { ok: true } });
    if (path.indexOf('/auth/signup/request-code') === 0) return json({ data: { sent: true } });
    if (path.indexOf('/auth/signup/verify-code') === 0) {
      if (body && body.code !== '000000') return json({ error: { code: 'invalid_code', message: '목 모드 인증코드는 000000 이에요.' } }, 400);
      return json({ data: { signupTicket: 'mock-signup-ticket' } });
    }
    if (path.indexOf('/auth/signup/complete') === 0) {
      var nick = (body && body.nickname) || MOCK_USER.nickname;
      return json({ data: Object.assign({ user: Object.assign({}, MOCK_USER, { nickname: nick }) }, TOKENS) });
    }
    if (path.indexOf('/auth/password/request-code') === 0) return json({ data: { sent: true } });
    if (path.indexOf('/auth/password/verify-code') === 0) {
      if (body && body.code !== '000000') return json({ error: { code: 'invalid_code', message: '목 모드 인증코드는 000000 이에요.' } }, 400);
      return json({ data: { resetTicket: 'mock-reset-ticket' } });
    }
    if (path.indexOf('/auth/password/reset') === 0) return json({ data: { ok: true } });
    if (path === '/me' || path.indexOf('/me?') === 0) return json({ data: MOCK_USER });
    if (path === '/me/charts') {
      return json({ data: CHARTS.filter(function (c) { return c.userId === MOCK_USER.id; }).map(toListItem) });
    }
    if (path === '/charts/public') {
      return json({ data: CHARTS.filter(function (c) { return c.isPublic; }).map(toListItem) });
    }
    var chartOne = /^\/charts\/([^/]+)$/.exec(path);
    if (chartOne && method === 'GET') {
      var found = CHARTS.find(function (c) { return c.id === chartOne[1]; });
      return found ? json({ data: found }) : json({ error: { code: 'not_found', message: '차트가 없어요.' } }, 404);
    }
    if (chartOne && method === 'PUT') {
      var idx = CHARTS.findIndex(function (c) { return c.id === chartOne[1]; });
      if (idx < 0) return json({ error: { code: 'not_found', message: '차트가 없어요.' } }, 404);
      CHARTS[idx] = Object.assign({}, CHARTS[idx], body || {});
      return json({ data: CHARTS[idx] });
    }
    if (chartOne && method === 'DELETE') {
      CHARTS = CHARTS.filter(function (c) { return c.id !== chartOne[1]; });
      return json({ data: { deleted: true } });
    }
    if (path === '/charts' && method === 'POST') {
      var created = Object.assign({ id: 'mock-chart-' + Math.random().toString(36).slice(2, 10), userId: MOCK_USER.id, updatedAt: '2026-07-30T12:00:00Z' }, body);
      CHARTS.unshift(created);
      return json({ data: created });
    }
    return json({ error: { code: 'mock_not_found', message: '목 핸들러가 없는 경로: ' + method + ' ' + path } }, 404);
  }

  /* ---------- fetch 패치 ---------- */
  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input.url;
    var apiBase = (window.__ENV__ && window.__ENV__.API_BASE_URL) || 'https://music-api-o7d8.onrender.com/api/v1';
    if (url.indexOf(apiBase) !== 0) return realFetch(input, init); // API 외 요청(폰트 등)은 통과
    var u = new URL(url);
    var path = url.slice(apiBase.length).split('?')[0];
    var method = ((init && init.method) || 'GET').toUpperCase();
    var body = null;
    try { body = init && init.body ? JSON.parse(init.body) : null; } catch (e) { body = null; }
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(route(method, path, u.searchParams, body)); }, DELAY_MS);
    });
  };

  console.info('%c[TMT mock] 로컬 목 모드 활성 — 검색어 예: eminem · iu · radiohead / 인증코드: 000000',
    'color:#E3B24E;font-weight:bold');
  var badge = document.createElement('div');
  badge.textContent = 'MOCK';
  badge.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:999;background:#E3B24E;color:#14110D;' +
    'font:700 10px/1 -apple-system,sans-serif;letter-spacing:.12em;padding:5px 8px;border-radius:4px;opacity:.85;pointer-events:none';
  document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(badge); });
})();

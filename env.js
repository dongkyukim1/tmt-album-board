/* 정적 호스팅(GitHub Pages)용 런타임 환경설정.
   Vercel 등 Next.js 배포에선 동적 /env.js 라우트(app/env.js/route.ts)가 이 파일 대신 응답한다.
   인증은 자체 백엔드(§4)로 이관됨 — 클라이언트에 노출할 시크릿은 없다. */
window.__ENV__ = {
  API_BASE_URL: "https://music-api-o7d8.onrender.com/api/v1"
};

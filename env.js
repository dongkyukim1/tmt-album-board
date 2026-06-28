/* 정적 호스팅(GitHub Pages)용 런타임 환경설정.
   Vercel 등 Next.js 배포에선 동적 /env.js 라우트(app/env.js/route.ts)가 이 파일 대신 응답한다.
   노출 키는 publishable/anon(클라이언트 노출 안전)뿐 — 실시크릿(service_role 등)은 절대 넣지 않음. */
window.__ENV__ = {
  SUPABASE_URL: "https://ctyktludgsbnzqrxviyz.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_DKpYErSKF4W_VKQIrkDfIQ_D28dywqc",
  API_BASE_URL: "https://music-api-o7d8.onrender.com/api/v1"
};

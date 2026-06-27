import { NextResponse } from 'next/server'

// 매 요청마다 현재 환경변수를 읽어 주입 (빌드시 고정 X)
export const dynamic = 'force-dynamic'

/**
 * 레거시 SPA(public/index.html)에 런타임 설정을 주입한다.
 * 값은 서버 환경변수(.env.local / Vercel)에서만 오며 소스에 하드코딩하지 않는다.
 * 노출되는 키는 publishable/anon(클라이언트 노출 안전)뿐 — 실시크릿은 백엔드 전용.
 */
export function GET() {
  const env = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  }
  const body = `window.__ENV__=${JSON.stringify(env)};`
  return new NextResponse(body, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

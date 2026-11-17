import { NextRequest, NextResponse } from 'next/server'
import { apiBase, checkAdmin, COOKIE } from '@/lib/analytics/auth'
export const dynamic = 'force-dynamic'
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/api/analytics', maxAge: 14 * 60 }
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 })
  try {
    const body = await request.json()
    if (typeof body.email !== 'string' || typeof body.password !== 'string' || body.email.length > 254 || body.password.length > 256) return NextResponse.json({ error: '이메일과 비밀번호를 확인해주세요.' }, { status: 400 })
    const response = await fetch(`${apiBase()}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: body.email, password: body.password }), cache: 'no-store', signal: AbortSignal.timeout(65_000) })
    if (!response.ok) return NextResponse.json({ error: response.status === 429 ? '요청이 많습니다. 잠시 후 다시 시도해주세요.' : '로그인 정보를 확인해주세요.' }, { status: response.status === 429 ? 429 : 401 })
    const { data } = await response.json()
    if (typeof data?.accessToken !== 'string') throw new Error('INVALID_AUTH_RESPONSE')
    if (await checkAdmin(data.accessToken) !== 200) return NextResponse.json({ error: '관리자 계정만 접근할 수 있습니다.' }, { status: 403 })
    const result = NextResponse.json({ ok: true }); result.cookies.set(COOKIE, data.accessToken, cookieOptions); return result
  } catch { return NextResponse.json({ error: '인증 서버에 연결하지 못했습니다.' }, { status: 503 }) }
}
export async function DELETE(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return new NextResponse(null, { status: 403 })
  const result = NextResponse.json({ ok: true }); result.cookies.set(COOKIE, '', { ...cookieOptions, maxAge: 0 }); return result
}

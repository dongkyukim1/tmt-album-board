import { NextRequest, NextResponse } from 'next/server'
import { adminStatus } from '@/lib/analytics/auth'
import { AnalyticsError, loadAnalytics } from '@/lib/analytics/google'
import type { Platform } from '@/lib/analytics/types'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120
const headers = { 'Cache-Control': 'private, no-store' }
export async function GET(request: NextRequest) {
  try {
    const status = await adminStatus()
    if (status !== 200) return NextResponse.json({ code: status === 403 ? 'FORBIDDEN' : 'AUTH_REQUIRED' }, { status: status === 403 ? 403 : status === 401 ? 401 : 503, headers })
    const days = Number(request.nextUrl.searchParams.get('days') ?? 28)
    const platform = request.nextUrl.searchParams.get('platform') ?? 'app'
    if (![7, 28, 90].includes(days) || !['app', 'android', 'ios', 'web'].includes(platform)) return NextResponse.json({ code: 'INVALID_FILTER' }, { status: 400, headers })
    return NextResponse.json({ data: await loadAnalytics(days, platform as Platform) }, { headers })
  } catch (error) {
    return NextResponse.json({ code: error instanceof AnalyticsError ? error.code : 'UNAVAILABLE' }, { status: 503, headers })
  }
}

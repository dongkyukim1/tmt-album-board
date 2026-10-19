/**
 * 운영자 신고 검토 API — music-api `/admin/reports`(AdminGuard, admin@tmt.com).
 *
 * - `GET  {BASE}/admin/reports?status=&cursor=&limit=` → `{ data: AdminReport[], nextCursor }`
 * - `PUT  {BASE}/admin/reports/:id` `{ status: 'resolved', hideContent: true }` | `{ status: 'dismissed' }`
 * 인증: Bearer 토큰(레거시 SPA가 localStorage `auth_access`에 저장 — 동일 오리진 공유).
 * 이용약관 제9조: 신고는 24시간 안에 검토한다.
 */

export type ReportStatus = 'open' | 'resolved' | 'dismissed'
export type ReportTargetType = 'review' | 'chart' | 'chart_comment' | 'user'
export type ReportReason = 'spam' | 'abuse' | 'sexual' | 'hate' | 'illegal' | 'other'

export type AdminReport = {
  id: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  detail: string | null
  status: ReportStatus
  createdAt: string
  resolvedAt: string | null
  /** 대상 본문 일부. 이미 지워졌으면 null. */
  targetSnippet: string | null
  reporter: { id: string; nickname: string }
  /** 대상 작성자. 탈퇴했으면 null. */
  targetUser: { id: string; nickname: string } | null
}

export type ReportPage = { items: AdminReport[]; nextCursor: string | null }

/** 앱 신고 시트(report.dart)와 같은 문구. */
export const REASON_LABEL: Record<ReportReason, string> = {
  spam: '스팸·광고',
  abuse: '욕설·괴롭힘',
  sexual: '음란·선정성',
  hate: '혐오 표현',
  illegal: '불법 정보',
  other: '기타',
}

export const TARGET_LABEL: Record<ReportTargetType, string> = {
  review: '앨범 코멘트',
  chart: '탑스터',
  chart_comment: '탑스터 코멘트',
  user: '사용자',
}

export const STATUS_LABEL: Record<ReportStatus, string> = {
  open: '미처리',
  resolved: '처리 완료',
  dismissed: '종료',
}

/** 오류 — status 로 401(로그인 필요)·403(운영자 아님)을 구분한다. */
export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
const PAGE_LIMIT = 20

export function accessToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem('auth_access')
  } catch {
    return null
  }
}

/** 목록 요청 경로(쿼리 포함). status 가 null 이면 전체. */
export function listPath(status: ReportStatus | null, cursor?: string | null): string {
  const qs = new URLSearchParams({ limit: String(PAGE_LIMIT) })
  if (status) qs.set('status', status)
  if (cursor) qs.set('cursor', cursor)
  return `/admin/reports?${qs.toString()}`
}

/** 처리 본문 — 숨기기는 resolved + hideContent, 문제 없음은 dismissed. */
export function resolveBody(hide: boolean) {
  return hide ? { status: 'resolved', hideContent: true } : { status: 'dismissed' }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = accessToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const json = (await res.json().catch(() => ({}))) as {
    data?: unknown
    nextCursor?: string | null
    error?: { message?: string }
  }
  if (!res.ok) {
    throw new AdminApiError(json.error?.message ?? `요청 실패 (${res.status})`, res.status)
  }
  return json as T
}

export async function fetchReports(
  status: ReportStatus | null,
  cursor?: string | null,
): Promise<ReportPage> {
  const json = await request<{ data?: AdminReport[]; nextCursor?: string | null }>(
    listPath(status, cursor),
  )
  return { items: json.data ?? [], nextCursor: json.nextCursor ?? null }
}

export async function resolveReport(id: string, hide: boolean): Promise<void> {
  await request(`/admin/reports/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(resolveBody(hide)),
  })
}

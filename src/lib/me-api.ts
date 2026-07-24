/**
 * MY 화면(설계 ⑭) API 클라이언트 — 위시리스트 / 내 코멘트.
 *
 * 백엔드 계약(FINAL-v3, albumId 표면):
 * - `GET {BASE}/me/wishlist?cursor=&limit=` → `{ data: WishlistItem[], nextCursor: string|null }`
 * - `GET {BASE}/me/reviews?cursor=&limit=`  → `{ data: MyReview[], nextCursor: string|null }`
 * 인증: Bearer 토큰(레거시 SPA가 localStorage `auth_access`에 저장 — 동일 오리진 공유).
 *
 * taste-api와 동일 패턴: 백엔드 미설정/실패 시 mock(→ me-mock.ts)으로 폴백.
 */

import { backendConfigured } from './taste-api'

export type WishlistItem = {
  albumId: string
  title: string
  artist: string
  artworkUrl: string
  year?: string
}

export type MyReview = {
  albumId: string
  title?: string
  artist?: string
  artworkUrl?: string
  stars: number
  text: string
  createdAt?: string
}

/** 커서 기반 페이지 — "더보기"용. nextCursor=null이면 마지막. */
export type Page<T> = {
  items: T[]
  nextCursor: string | null
}

export interface MeAdapter {
  getWishlist(cursor?: string | null): Promise<Page<WishlistItem>>
  getMyReviews(cursor?: string | null): Promise<Page<MyReview>>
}

export { backendConfigured }

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
const PAGE_LIMIT = 24

function accessToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem('auth_access')
  } catch {
    return null
  }
}

function authHeaders(): Record<string, string> {
  const token = accessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchPage<T>(path: string, cursor?: string | null): Promise<Page<T>> {
  const qs = new URLSearchParams()
  qs.set('limit', String(PAGE_LIMIT))
  if (cursor) qs.set('cursor', cursor)

  const res = await fetch(`${API_BASE}${path}?${qs.toString()}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
  const json = (await res.json()) as { data?: T[]; nextCursor?: string | null }
  return { items: json.data ?? [], nextCursor: json.nextCursor ?? null }
}

export const realMeAdapter: MeAdapter = {
  getWishlist(cursor) {
    return fetchPage<WishlistItem>('/me/wishlist', cursor)
  },
  getMyReviews(cursor) {
    return fetchPage<MyReview>('/me/reviews', cursor)
  },
}

/**
 * 취향찾기(스와이프) API 클라이언트.
 *
 * 백엔드 계약(설계 5-1): `GET /taste/feed`, `POST /taste/swipe`, 위시리스트.
 * 백엔드가 아직 미가동일 수 있으므로 실제 어댑터와 mock 어댑터(→ taste-mock.ts)를
 * 분리하고, 호출부(page.tsx)에서 `backendConfigured`로 선택 + 실패 시 폴백한다.
 */

export type SwipeAction = 'like' | 'dislike' | 'skip' | 'wish'

export const SWIPE_ACTIONS: readonly SwipeAction[] = [
  'like',
  'dislike',
  'skip',
  'wish',
]

/** 스와이프가 취향 벡터에 반영되는 가중치 (설계 5-1: 위시=+1.5 강신호). */
export const SWIPE_WEIGHT: Record<SwipeAction, number> = {
  like: 1,
  dislike: -1,
  skip: 0,
  wish: 1.5,
}

export type TasteCard = {
  albumId: string
  title: string
  artist: string
  artworkUrl: string
  genre?: string
  year?: string
}

export type TasteFeedParams = {
  /** iTunes 장르 id(숫자문자열) — 백엔드 계약 */
  genre?: string
  country?: string
  yearFrom?: number
  yearTo?: number
  limit?: number
}

/**
 * 백엔드 `/taste/swipe`가 받는 verdict — 3종만 (설계/계약).
 * UI의 4방향(SwipeAction)과 다르다: 'skip'은 'unknown'으로 매핑, 'wish'는 swipe를
 * 호출하지 않고 위시리스트로만 처리한다(위시=강신호가 like를 대체, 스와이프 중복 기록 없음).
 */
export type SwipeVerdict = 'like' | 'dislike' | 'unknown'

const VERDICTS: readonly SwipeVerdict[] = ['like', 'dislike', 'unknown']

/**
 * UI 스와이프(4방향) → 전송 verdict 매핑.
 * 'wish'는 null을 반환 = swipe 미전송(위시리스트 API만 호출).
 */
export function verdictForAction(action: SwipeAction): SwipeVerdict | null {
  switch (action) {
    case 'like':
      return 'like'
    case 'dislike':
      return 'dislike'
    case 'skip':
      return 'unknown'
    case 'wish':
      return null
  }
}

export interface TasteAdapter {
  getFeed(params?: TasteFeedParams): Promise<TasteCard[]>
  swipe(albumId: string, verdict: SwipeVerdict): Promise<void>
  addWishlist(albumId: string): Promise<void>
  removeWishlist(albumId: string): Promise<void>
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

/** 백엔드 베이스 URL이 설정돼 있는지 — 없으면 mock으로 동작. */
export const backendConfigured: boolean = API_BASE.length > 0

function isVerdict(value: string): value is SwipeVerdict {
  return (VERDICTS as readonly string[]).includes(value)
}

/** 인증은 Bearer 헤더(레거시 SPA가 localStorage `auth_access`에 저장 — 동일 오리진 공유). */
function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const token = window.localStorage.getItem('auth_access')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

async function postJson(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
}

/** 실제 백엔드를 호출하는 어댑터. 실패 시 예외를 던지고, 호출부가 mock으로 폴백한다. */
export const realAdapter: TasteAdapter = {
  async getFeed(params = {}) {
    const qs = new URLSearchParams()
    if (params.genre) qs.set('genre', params.genre)
    if (params.country) qs.set('country', params.country)
    if (params.yearFrom) qs.set('yearFrom', String(params.yearFrom))
    if (params.yearTo) qs.set('yearTo', String(params.yearTo))
    if (params.limit) qs.set('limit', String(params.limit))

    const res = await fetch(`${API_BASE}/taste/feed?${qs.toString()}`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`taste feed failed: ${res.status}`)
    // 백엔드 응답 필드가 내부 TasteCard(albumId/year)와 동일 — 매핑 불필요.
    const json = (await res.json()) as { data?: TasteCard[] }
    return json.data ?? []
  },

  async swipe(albumId, verdict) {
    if (!albumId || !isVerdict(verdict)) {
      throw new Error(`invalid swipe: ${albumId} / ${verdict}`)
    }
    await postJson('/taste/swipe', { albumId, verdict })
  },

  async addWishlist(albumId) {
    if (!albumId) throw new Error('addWishlist: albumId required')
    const res = await fetch(`${API_BASE}/albums/${albumId}/wishlist`, {
      method: 'POST',
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`addWishlist failed: ${res.status}`)
  },

  async removeWishlist(albumId) {
    if (!albumId) throw new Error('removeWishlist: albumId required')
    const res = await fetch(`${API_BASE}/albums/${albumId}/wishlist`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`removeWishlist failed: ${res.status}`)
  },
}

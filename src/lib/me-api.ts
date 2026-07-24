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

/** iTunes 프록시 lookup 결과에서 쓰는 필드만. */
type LookupResult = {
  collectionId?: number | string
  collectionName?: string
  artistName?: string
  artworkUrl100?: string
}

type AlbumMeta = { title: string; artist: string; artworkUrl: string }

function toMeta(r: LookupResult): AlbumMeta {
  return {
    title: r.collectionName ?? '',
    artist: r.artistName ?? '',
    artworkUrl: (r.artworkUrl100 ?? '').replace(/\/\d+x\d+bb\.(jpg|png)$/, '/600x600bb.$1'),
  }
}

async function lookupOnce(ids: string[]): Promise<LookupResult[]> {
  const res = await fetch(`${API_BASE}/itunes/lookup?id=${ids.join(',')}&country=KR`)
  if (!res.ok) throw new Error(`lookup failed: ${res.status}`)
  const json = (await res.json()) as { data?: { results?: LookupResult[] }; results?: LookupResult[] }
  return json.data?.results ?? json.results ?? []
}

/**
 * albumId만 있는 항목의 제목·아티스트·커버를 백엔드 iTunes 프록시로 보강.
 * 다중 id 한 방 호출을 우선하고(API 구버전 배포 대비) 실패 시 개별 조회로 폴백.
 * 조회 실패는 조용히 건너뛴다(목록 자체는 albumId로도 동작).
 */
async function resolveAlbumMetas(ids: string[]): Promise<Map<string, AlbumMeta>> {
  const metas = new Map<string, AlbumMeta>()
  if (ids.length === 0) return metas
  const collect = (results: LookupResult[]) => {
    for (const r of results) {
      if (r.collectionId != null) metas.set(String(r.collectionId), toMeta(r))
    }
  }
  try {
    collect(await lookupOnce(ids))
  } catch {
    await Promise.all(
      ids.map(async (id) => {
        try {
          collect(await lookupOnce([id]))
        } catch {
          /* 개별 실패 무시 */
        }
      }),
    )
  }
  return metas
}

async function withWishlistMetas(page: Page<WishlistItem>): Promise<Page<WishlistItem>> {
  const missing = page.items.filter((a) => !a.title || !a.artworkUrl).map((a) => a.albumId)
  const metas = await resolveAlbumMetas(missing)
  return {
    ...page,
    items: page.items.map((a) => {
      const m = metas.get(a.albumId)
      return m ? { ...a, title: a.title || m.title, artist: a.artist || m.artist, artworkUrl: a.artworkUrl || m.artworkUrl } : a
    }),
  }
}

async function withReviewMetas(page: Page<MyReview>): Promise<Page<MyReview>> {
  const missing = page.items.filter((r) => !r.title || !r.artworkUrl).map((r) => r.albumId)
  const metas = await resolveAlbumMetas(missing)
  return {
    ...page,
    items: page.items.map((r) => {
      const m = metas.get(r.albumId)
      return m ? { ...r, title: r.title ?? m.title, artist: r.artist ?? m.artist, artworkUrl: r.artworkUrl ?? m.artworkUrl } : r
    }),
  }
}

export const realMeAdapter: MeAdapter = {
  async getWishlist(cursor) {
    return withWishlistMetas(await fetchPage<WishlistItem>('/me/wishlist', cursor))
  },
  async getMyReviews(cursor) {
    return withReviewMetas(await fetchPage<MyReview>('/me/reviews', cursor))
  },
}

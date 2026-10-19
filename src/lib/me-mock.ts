/**
 * MY 화면 mock 어댑터 — 백엔드 미가동 시 폴백.
 *
 * 위시리스트: taste 스와이프가 localStorage에 담은 id(readMockWishlist)를 읽어
 *   서버 라우트 `/api/albums/lookup`(iTunes, CORS 회피)로 앨범 카드를 채운다.
 * 내 코멘트: 레거시 SPA의 로컬 리뷰 저장소(shape 결합)를 끌어오지 않고 빈 목록 반환
 *   → EmptyState 노출. 실제 내 코멘트는 백엔드 연동 시 표시된다.
 */

import type { MeAdapter, MyReview, Page, WishlistItem } from './me-api'
import { readMockWishlist } from './taste-mock'

async function lookupCards(ids: string[]): Promise<WishlistItem[]> {
  if (ids.length === 0) return []
  const res = await fetch(`/api/albums/lookup?ids=${encodeURIComponent(ids.join(','))}`)
  if (!res.ok) throw new Error(`albums lookup failed: ${res.status}`)
  const json = (await res.json()) as { data?: WishlistItem[] }
  return json.data ?? []
}

export const mockMeAdapter: MeAdapter = {
  async getWishlist(): Promise<Page<WishlistItem>> {
    const ids = readMockWishlist()
    const items = await lookupCards(ids)
    return { items, nextCursor: null }
  },

  async getMyReviews(): Promise<Page<MyReview>> {
    return { items: [], nextCursor: null }
  },
}

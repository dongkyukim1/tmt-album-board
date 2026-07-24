/**
 * 취향찾기 mock 어댑터 — 백엔드 미가동 시 폴백.
 *
 * 피드: 서버 라우트 `/api/taste/feed`(iTunes 인기 앨범, CORS 회피)에서 가져온다.
 * 스와이프/위시리스트: 브라우저 localStorage에 기록해 UI가 동작하도록 한다.
 */

import type {
  SwipeVerdict,
  TasteAdapter,
  TasteCard,
  TasteFeedParams,
} from './taste-api'

const SWIPE_LOG_KEY = 'tmt.taste.swipes'
const WISHLIST_KEY = 'tmt.taste.wishlist'

function readSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(key)
    const arr = raw ? (JSON.parse(raw) as string[]) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function writeSet(key: string, set: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify([...set]))
  } catch (error) {
    console.error('taste-mock persist failed:', error)
  }
}

function logSwipe(albumId: string, verdict: SwipeVerdict): void {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(SWIPE_LOG_KEY)
    const log = raw ? (JSON.parse(raw) as unknown[]) : []
    const next = [...(Array.isArray(log) ? log : []), { albumId, verdict, at: Date.now() }]
    window.localStorage.setItem(SWIPE_LOG_KEY, JSON.stringify(next))
  } catch (error) {
    console.error('taste-mock swipe log failed:', error)
  }
}

export const mockAdapter: TasteAdapter = {
  async getFeed(params: TasteFeedParams = {}) {
    const qs = new URLSearchParams()
    if (params.genre) qs.set('genre', params.genre)
    if (params.country) qs.set('country', params.country)
    if (params.limit) qs.set('limit', String(params.limit))

    const res = await fetch(`/api/taste/feed?${qs.toString()}`)
    if (!res.ok) throw new Error(`mock taste feed failed: ${res.status}`)
    const json = (await res.json()) as { data?: TasteCard[] }
    return json.data ?? []
  },

  async swipe(albumId, verdict) {
    logSwipe(albumId, verdict)
  },

  async addWishlist(albumId) {
    const set = readSet(WISHLIST_KEY)
    set.add(albumId)
    writeSet(WISHLIST_KEY, set)
  },

  async removeWishlist(albumId) {
    const set = readSet(WISHLIST_KEY)
    set.delete(albumId)
    writeSet(WISHLIST_KEY, set)
  },
}

/** 위시리스트 읽기 (mock 전용 — MY 화면 등에서 재사용 가능). */
export function readMockWishlist(): string[] {
  return [...readSet(WISHLIST_KEY)]
}

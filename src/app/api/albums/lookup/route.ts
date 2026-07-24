/**
 * 앨범 일괄 조회 (서버 라우트) — MY 화면 mock 위시리스트 카드 채우기용.
 *
 * localStorage에 담긴 collectionId 목록을 iTunes lookup으로 서버측 조회(CORS 회피)해
 * WishlistItem[] 형태로 반환한다. 백엔드 `/me/wishlist`가 가동되면 이 경로는 미사용.
 */

import { NextResponse } from 'next/server'
import type { WishlistItem } from '@/lib/me-api'

type ITunesRow = {
  wrapperType?: string
  collectionType?: string
  collectionId?: number
  collectionName?: string
  artistName?: string
  artworkUrl100?: string
  releaseDate?: string
}

const MAX_IDS = 50

function upscale(url: string): string {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/i, '/600x600bb.$1')
}

function toItem(r: ITunesRow): WishlistItem | null {
  if (!r.collectionId || !r.collectionName || !r.artistName) return null
  return {
    albumId: String(r.collectionId),
    title: r.collectionName,
    artist: r.artistName,
    artworkUrl: r.artworkUrl100 ? upscale(r.artworkUrl100) : '',
    year: r.releaseDate?.slice(0, 4),
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const idsRaw = searchParams.get('ids') ?? ''
  const ids = idsRaw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .slice(0, MAX_IDS)

  if (ids.length === 0) return NextResponse.json({ data: [] })

  const country = (searchParams.get('country') ?? 'KR').toUpperCase()
  const url = `https://itunes.apple.com/lookup?id=${ids.join(',')}&country=${country}&entity=album`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) {
      return NextResponse.json({ data: [], error: `itunes ${res.status}` }, { status: 502 })
    }
    const json = (await res.json()) as { results?: ITunesRow[] }
    const byId = new Map<string, WishlistItem>()
    for (const r of json.results ?? []) {
      const item = toItem(r)
      if (item) byId.set(item.albumId, item)
    }
    // 요청한 id 순서 보존
    const data = ids.map((id) => byId.get(id)).filter((x): x is WishlistItem => x != null)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('albums lookup error:', error)
    return NextResponse.json({ data: [], error: 'lookup unavailable' }, { status: 502 })
  }
}

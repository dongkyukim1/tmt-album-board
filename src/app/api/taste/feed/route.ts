/**
 * 취향찾기 mock 피드 (서버 라우트).
 *
 * 백엔드 `/taste/feed`가 없을 때의 폴백. iTunes 인기 앨범 RSS를 서버에서 조회해
 * (클라이언트 CORS 회피) TasteCard[] 형태로 반환한다. 실제 백엔드 계약과 응답 형태
 * (`{ data: TasteCard[] }`)를 동일하게 맞춰, 이후 백엔드로 교체해도 클라이언트는 무변경.
 */

import { NextResponse } from 'next/server'
import type { TasteCard } from '@/lib/taste-api'

type RssImage = { label: string }
type RssAttr = { attributes?: { label?: string; 'im:id'?: string; term?: string } }
type RssEntry = {
  'im:name'?: { label?: string }
  'im:artist'?: { label?: string }
  'im:image'?: RssImage[]
  'im:releaseDate'?: RssAttr
  id?: { attributes?: { 'im:id'?: string } }
  category?: RssAttr
}

const MAX_LIMIT = 40
const DEFAULT_LIMIT = 20

function upscale(url: string): string {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/i, '/600x600bb.$1')
}

function toCard(entry: RssEntry): TasteCard | null {
  const albumId = entry.id?.attributes?.['im:id']
  const title = entry['im:name']?.label
  const artist = entry['im:artist']?.label
  if (!albumId || !title || !artist) return null

  const images = entry['im:image'] ?? []
  const rawArt = images.length > 0 ? images[images.length - 1].label : ''

  return {
    albumId,
    title,
    artist,
    artworkUrl: rawArt ? upscale(rawArt) : '',
    genre: entry.category?.attributes?.label,
    year: entry['im:releaseDate']?.attributes?.label?.slice(0, 4),
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const country = (searchParams.get('country') ?? 'kr').toLowerCase()
  const limitParam = Number(searchParams.get('limit') ?? DEFAULT_LIMIT)
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(1, limitParam), MAX_LIMIT)
    : DEFAULT_LIMIT

  const url = `https://itunes.apple.com/${country}/rss/topalbums/limit=${limit}/json`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) {
      return NextResponse.json(
        { data: [], error: `itunes rss ${res.status}` },
        { status: 502 },
      )
    }
    const json = (await res.json()) as { feed?: { entry?: RssEntry[] } }
    const entries = json.feed?.entry ?? []
    const data = entries
      .map(toCard)
      .filter((c): c is TasteCard => c !== null)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('taste feed (mock) error:', error)
    return NextResponse.json(
      { data: [], error: 'feed unavailable' },
      { status: 502 },
    )
  }
}

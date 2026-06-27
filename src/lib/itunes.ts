/**
 * iTunes 조회 (서버 전용).
 *
 * SSR 앨범 페이지에서 서버→서버로 호출하므로 클라이언트 JSONP/레이트리밋 이슈가 없다.
 * 백엔드(§4 `/itunes/lookup`)가 준비되면 이 함수의 fetch 대상만 프록시로 교체하면 된다.
 */

export type Album = {
  collectionId: number
  collectionName: string
  artistName: string
  artworkUrl: string
  genre?: string
  releaseDate?: string
  trackCount?: number
}

type ITunesResult = {
  wrapperType?: string
  collectionType?: string
  collectionId?: number
  collectionName?: string
  artistName?: string
  artworkUrl100?: string
  primaryGenreName?: string
  releaseDate?: string
  trackCount?: number
}

/** 100x100 아트워크 URL을 고해상도(600x600)로 치환 */
function upscaleArtwork(url: string): string {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/i, '/600x600bb.$1')
}

function toAlbum(r: ITunesResult): Album | null {
  if (!r.collectionId || !r.collectionName || !r.artistName) return null
  return {
    collectionId: r.collectionId,
    collectionName: r.collectionName,
    artistName: r.artistName,
    artworkUrl: r.artworkUrl100 ? upscaleArtwork(r.artworkUrl100) : '',
    genre: r.primaryGenreName,
    releaseDate: r.releaseDate,
    trackCount: r.trackCount,
  }
}

/**
 * collectionId로 앨범 1건 조회. 없거나 실패하면 null.
 * Next의 fetch 캐시로 동일 앨범 재요청을 24h 캐싱.
 */
export async function lookupAlbum(
  collectionId: string,
  country = 'KR',
): Promise<Album | null> {
  const id = collectionId.trim()
  if (!/^\d+$/.test(id)) return null

  const url = `https://itunes.apple.com/lookup?id=${id}&country=${country}&entity=album`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) {
      console.error(`iTunes lookup failed: ${res.status} for id=${id}`)
      return null
    }
    const json = (await res.json()) as { results?: ITunesResult[] }
    const collection = (json.results ?? []).find(
      (r) => r.wrapperType === 'collection' || r.collectionType === 'Album',
    )
    return collection ? toAlbum(collection) : null
  } catch (error) {
    console.error('iTunes lookup error:', error)
    return null
  }
}

import { ImageResponse } from 'next/og'
import { lookupAlbum } from '@/lib/itunes'

export const alt = 'TMT 앨범 리뷰'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = { params: Promise<{ id: string }> }

export default async function Image({ params }: Props) {
  const { id } = await params
  const album = await lookupAlbum(id)

  const title = album?.collectionName ?? '앨범을 찾을 수 없어요'
  const artist = album?.artistName ?? 'TMT — Album Board'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 56,
          padding: 80,
          background: '#F2FF00',
          color: '#000',
          fontFamily: 'sans-serif',
        }}
      >
        {album?.artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.artworkUrl}
            alt=""
            width={420}
            height={420}
            style={{ borderRadius: 4, border: '3px solid #000', boxShadow: '10px 10px 0 rgba(0,0,0,.35)' }}
          />
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 30, color: 'rgba(0,0,0,.62)', marginBottom: 18 }}>
            TMT · 블라인드 앨범 리뷰
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ fontSize: 40, color: 'rgba(0,0,0,.55)', marginTop: 20 }}>
            {artist}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}

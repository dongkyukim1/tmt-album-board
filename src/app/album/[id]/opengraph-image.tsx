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
          background: 'linear-gradient(135deg, #111114 0%, #1c1c22 100%)',
          color: '#f2f2f2',
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
            style={{ borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,.6)' }}
          />
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 30, color: '#9a9aa2', marginBottom: 18 }}>
            TMT · 블라인드 앨범 리뷰
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ fontSize: 40, color: '#c8c8ce', marginTop: 20 }}>
            {artist}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}

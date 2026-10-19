import { ImageResponse } from 'next/og'
import { lookupAlbum } from '@/lib/itunes'
import { loadKoreanFont } from '@/lib/og-font'

export const alt = 'TMT 앨범'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = { params: Promise<{ id: string }> }

export default async function Image({ params }: Props) {
  const { id } = await params
  const album = await lookupAlbum(id)

  const title = album?.collectionName ?? '앨범을 찾을 수 없어요'
  const artist = album?.artistName ?? 'TMT — 탑스터 메이커'
  const fonts = await loadKoreanFont(`TMT · 앨범${title}${artist}`)

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
          // 딥블랙 캔버스 + 아이보리 글자 + 라임 키커
          background: '#0A0A0A',
          color: '#EDE7DB',
          fontFamily: '"Noto Sans KR", sans-serif',
        }}
      >
        {album?.artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.artworkUrl}
            alt=""
            width={420}
            height={420}
            style={{
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,.08)',
              boxShadow: '0 24px 60px rgba(0,0,0,.55)',
            }}
          />
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 30, color: '#CFF730', letterSpacing: 4, marginBottom: 18 }}>
            TMT · 앨범
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ fontSize: 40, color: 'rgba(237,231,219,.62)', marginTop: 20 }}>
            {artist}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}

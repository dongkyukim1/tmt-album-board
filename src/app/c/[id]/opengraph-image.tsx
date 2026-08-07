import { ImageResponse } from 'next/og'
import { fetchPublicChart, buildGrid } from '@/lib/charts'
import { loadKoreanFont } from '@/lib/og-font'

export const alt = 'TMT 탑스터'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = { params: Promise<{ id: string }> }

export default async function Image({ params }: Props) {
  const { id } = await params
  const chart = await fetchPublicChart(id)

  const name = chart?.name ?? '탑스터를 찾을 수 없어요'
  const covers = chart
    ? buildGrid(chart)
        .map((it) => it?.artworkUrl)
        .filter((u): u is string => !!u)
        .slice(0, 9)
    : []
  // 3x3 콜라주용으로 9칸 채움(부족하면 빈칸)
  const slots = Array.from({ length: 9 }, (_, i) => covers[i] ?? null)
  const fonts = await loadKoreanFont(`TMT · 탑스터${name}`)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 56,
          padding: 70,
          // 미드나잇 갤러리 — 잉크 캔버스 + 아이보리 글자 + 골드 키커
          background: '#14110D',
          color: '#EDE7DB',
          fontFamily: '"Noto Sans KR", sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', width: 470, height: 470, gap: 10 }}>
          {slots.map((u, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                width: 150,
                height: 150,
                borderRadius: 6,
                overflow: 'hidden',
                background: '#221D16',
                border: '1px solid rgba(255,255,255,.08)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {u ? <img src={u} alt="" width={150} height={150} style={{ objectFit: 'cover' }} /> : null}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 28, color: '#E3B24E', letterSpacing: 4, marginBottom: 16 }}>
            TMT · 탑스터
          </div>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}

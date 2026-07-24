import { ImageResponse } from 'next/og'
import { fetchPublicChart, buildGrid } from '@/lib/charts'

export const alt = 'TMT 토스터'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = { params: Promise<{ id: string }> }

export default async function Image({ params }: Props) {
  const { id } = await params
  const chart = await fetchPublicChart(id)

  const name = chart?.name ?? '토스터를 찾을 수 없어요'
  const covers = chart
    ? buildGrid(chart)
        .map((it) => it?.artworkUrl)
        .filter((u): u is string => !!u)
        .slice(0, 9)
    : []
  // 3x3 콜라주용으로 9칸 채움(부족하면 빈칸)
  const slots = Array.from({ length: 9 }, (_, i) => covers[i] ?? null)

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
          background: '#F2FF00',
          color: '#000',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', width: 490, height: 490, gap: 0 }}>
          {slots.map((u, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                width: 150,
                height: 150,
                margin: 5,
                borderRadius: 4,
                overflow: 'hidden',
                background: '#1a1a22',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {u ? <img src={u} alt="" width={150} height={150} style={{ objectFit: 'cover' }} /> : null}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 28, color: 'rgba(0,0,0,.62)', marginBottom: 16 }}>TMT · 토스터</div>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
        </div>
      </div>
    ),
    { ...size },
  )
}

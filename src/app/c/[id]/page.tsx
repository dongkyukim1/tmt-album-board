import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  fetchPublicChart,
  buildGrid,
  cssColor,
  STYLE_DEFAULTS,
} from '@/lib/charts'

type Props = { params: Promise<{ id: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const chart = await fetchPublicChart(id)
  if (!chart) return { title: '토스터를 찾을 수 없어요 — TMT' }

  const title = `${chart.name} — TMT 토스터`
  const description = `${chart.rows}×${chart.cols} 앨범 토스터. TMT에서 보기.`
  const url = `${SITE_URL}/c/${chart.id}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function ChartPage({ params }: Props) {
  const { id } = await params
  const chart = await fetchPublicChart(id)
  if (!chart) notFound()

  const s = { ...STYLE_DEFAULTS, ...(chart.style ?? {}) }
  const grid = buildGrid(chart)
  const bg = cssColor(s.backgroundColor, STYLE_DEFAULTS.backgroundColor)
  const textColor = cssColor(s.textColor, STYLE_DEFAULTS.textColor)

  return (
    <main style={{ minHeight: '100vh', background: '#0b0b0c', padding: '24px 16px 64px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', margin: '8px 0 24px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            {chart.name}
          </h1>
          <p style={{ color: '#88888d', fontSize: 13, marginTop: 6 }}>
            {chart.rows}×{chart.cols} 토스터 · Topster
          </p>
        </header>

        <div
          style={{
            background: bg,
            backgroundImage: s.backgroundImageUrl ? `url("${s.backgroundImageUrl}")` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: s.padding,
            borderRadius: 16,
            display: 'grid',
            gridTemplateColumns: `repeat(${chart.cols}, minmax(0, 1fr))`,
            gap: s.cellGap,
          }}
        >
          {grid.map((item, i) => (
            <div key={i} style={{ position: 'relative', minWidth: 0 }}>
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '1 / 1',
                  borderRadius: s.cornerRadius,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,.05)',
                }}
              >
                {item?.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.artworkUrl}
                    alt={item.title || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : null}
                {s.showNumbers ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#fff',
                      textShadow: '0 1px 3px rgba(0,0,0,.8)',
                    }}
                  >
                    {i + 1}
                  </span>
                ) : null}
              </div>
              {s.showTitles && item ? (
                <div
                  style={{
                    marginTop: 4,
                    color: textColor,
                    fontFamily: s.fontFamily,
                    fontSize: s.titleFontSize,
                    lineHeight: 1.2,
                    textAlign: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.title}
                  </div>
                  <div style={{ opacity: 0.7, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.artist}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <a
            href={SITE_URL + '/'}
            style={{
              background: '#f2f2f2',
              color: '#000',
              padding: '12px 24px',
              borderRadius: 12,
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            나도 TMT에서 만들기 →
          </a>
        </div>
      </div>
    </main>
  )
}

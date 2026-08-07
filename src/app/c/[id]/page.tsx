import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  fetchPublicChart,
  buildGrid,
  cssColor,
  STYLE_DEFAULTS,
  type ChartItem,
} from '@/lib/charts'

type Props = { params: Promise<{ id: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const chart = await fetchPublicChart(id)
  if (!chart) return { title: '탑스터를 찾을 수 없어요 — TMT' }

  const title = `${chart.name} — TMT 탑스터`
  const description = `${chart.rows}×${chart.cols} 앨범 탑스터. TMT에서 보기.`
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
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--txt)', padding: '24px 16px 64px' }}>
      <style>{`
        .c-wrap{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:start}
        @media (max-width:760px){.c-wrap{grid-template-columns:1fr}}
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', margin: '8px 0 24px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            {chart.name}
          </h1>
          <p style={{ color: 'var(--muted2)', fontSize: 13, marginTop: 6 }}>
            {chart.rows}×{chart.cols} 탑스터 · TMT
          </p>
        </header>

        <div className="c-wrap">
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
                  background: 'rgba(237,231,219,.05)',
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
                      color: 'var(--txt)',
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

        {/* 우측: 담긴 앨범 번호 리스트 (피드백 1-3 — 그리드 옆 앨범 정보 나열) */}
        <aside>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {grid
              .map((item, i) => ({ item, i }))
              .filter((e): e is { item: ChartItem; i: number } => e.item != null)
              .map((e, ord) => (
                <li
                  key={e.i}
                  style={{
                    display: 'flex',
                    gap: 11,
                    alignItems: 'baseline',
                    padding: '7px 4px',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--muted2)',
                      fontSize: 11.5,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: 20,
                      flex: 'none',
                    }}
                  >
                    {String(ord + 1).padStart(2, '0')}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {e.item.title}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 11.5,
                        color: 'var(--muted2)',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {e.item.artist}
                    </span>
                  </span>
                </li>
              ))}
          </ol>
        </aside>
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <a
            href={SITE_URL + '/'}
            style={{
              background: 'var(--cta-bg)',
              color: 'var(--cta-fg)',
              padding: '12px 24px',
              borderRadius: 'var(--r-sm)',
              fontWeight: 700,
              boxShadow: 'var(--hard-shadow)',
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

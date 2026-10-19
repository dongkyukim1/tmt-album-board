import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  fetchPublicChart,
  buildGrid,
  cssColor,
  STYLE_DEFAULTS,
  type ChartItem,
} from '@/lib/charts'
import { QuoteIcon } from '@/components/icons'
import styles from './chart.module.css'

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

  const albums = grid
    .map((item, i) => ({ item, i }))
    .filter((e): e is { item: ChartItem; i: number } => e.item != null)

  return (
    <main className={styles.screen}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <div className={styles.kicker}>Topster</div>
          <h1 className={styles.title}>{chart.name}</h1>
          <p className={styles.sub}>
            {chart.rows}×{chart.cols} · 앨범 {albums.length}장
          </p>
        </header>

        <div className={styles.wrap}>
          <div>
            <div className={styles.board}>
              <div
                className={styles.grid}
                style={{
                  background: bg,
                  backgroundImage: s.backgroundImageUrl ? `url("${s.backgroundImageUrl}")` : undefined,
                  padding: s.padding,
                  gridTemplateColumns: `repeat(${chart.cols}, minmax(0, 1fr))`,
                  gap: s.cellGap,
                }}
              >
                {grid.map((item, i) => (
                  <div key={i} className={styles.cell}>
                    <div className={styles.art} style={{ borderRadius: s.cornerRadius }}>
                      {item?.artworkUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.artworkUrl} alt={item.title || ''} />
                      ) : null}
                      {s.showNumbers ? <span className={styles.num}>{i + 1}</span> : null}
                    </div>
                    {s.showTitles && item ? (
                      <div
                        className={styles.cellText}
                        style={{ color: textColor, fontFamily: s.fontFamily, fontSize: s.titleFontSize }}
                      >
                        <div className={styles.cellTitle}>{item.title}</div>
                        <div className={styles.cellArtist}>{item.artist}</div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {chart.comment ? (
              <div className={styles.quote}>
                <div className={styles.quoteLabel}>
                  <QuoteIcon />
                  한줄평
                </div>
                <p className={styles.quoteText}>{chart.comment}</p>
              </div>
            ) : null}
          </div>

          {/* 우측: 수록 앨범 번호 리스트 (피드백 1-3 — 그리드 옆 앨범 정보 나열) */}
          <aside>
            <div className={styles.listHead}>
              <h2>수록 앨범</h2>
              <span>{albums.length}장</span>
            </div>
            <ol className={styles.list}>
              {albums.map((e, ord) => (
                <li key={e.i} className={styles.row}>
                  <span className={styles.rowNum}>{ord + 1}</span>
                  <span className={styles.rowBody}>
                    <span className={styles.rowTitle}>{e.item.title}</span>
                    <span className={styles.rowArtist}>{e.item.artist}</span>
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        <div className={styles.cta}>
          <p>나만의 탑스터를 만들고 공유해 보세요</p>
          <a href={SITE_URL + '/'} className="btn-primary">
            나도 TMT에서 만들기
          </a>
        </div>
      </div>
    </main>
  )
}

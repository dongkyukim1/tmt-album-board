/**
 * 공개 토스터(charts) 조회 (서버 전용).
 * §4 `GET /charts/:id` (공개읽기, 인증 불필요) — 비공개는 403/404 → null.
 * 설치 없이 링크(/c/:id)로 열람되는 바이럴 루프용.
 */

export type ChartItem = {
  id: string
  type: string
  title: string
  artist: string
  artworkUrl: string
}
export type ChartCell = { index: number; item: ChartItem | null }
export type ChartStyle = {
  backgroundColor?: string
  cellGap?: number
  padding?: number
  cornerRadius?: number
  showTitles?: boolean
  showNumbers?: boolean
  fontFamily?: string
  textColor?: string
  titleFontSize?: number
  backgroundImageUrl?: string | null
}
export type Chart = {
  id: string
  name: string
  rows: number
  cols: number
  style: ChartStyle
  cells: ChartCell[]
  isPublic: boolean
}

export const STYLE_DEFAULTS = {
  backgroundColor: '#111114',
  cellGap: 8,
  padding: 24,
  cornerRadius: 8,
  showTitles: false,
  showNumbers: false,
  textColor: '#ffffff',
  titleFontSize: 12,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
} as const

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

/** Flutter ARGB hex(#AARRGGBB)/#RRGGBB → CSS hex(#RRGGBBAA). 잘못된 값이면 fallback. */
export function cssColor(hex: string | null | undefined, fallback = ''): string {
  if (!hex) return fallback
  const h = hex.replace('#', '')
  if (/^[0-9a-fA-F]{6}$/.test(h)) return `#${h}`
  if (/^[0-9a-fA-F]{8}$/.test(h)) return `#${h.slice(2)}${h.slice(0, 2)}`
  return fallback
}

/** cells를 rows*cols 격자(행 우선)로 펼친다 — index 위치에 item 배치, 없으면 null. */
export function buildGrid(chart: Chart): (ChartItem | null)[] {
  const total = Math.max(0, chart.rows * chart.cols)
  const byIndex = new Map<number, ChartItem | null>()
  for (const c of chart.cells ?? []) byIndex.set(c.index, c.item)
  return Array.from({ length: total }, (_, i) => byIndex.get(i) ?? null)
}

/** collectionId 아님 — charts.id는 uuid */
function isUuid(id: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    id,
  )
}

export async function fetchPublicChart(id: string): Promise<Chart | null> {
  if (!API_BASE || !isUuid(id)) return null
  try {
    const res = await fetch(`${API_BASE}/charts/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null // 404(없음)/403(비공개) → null
    const json = (await res.json()) as { data?: Chart }
    return json?.data ?? null
  } catch (error) {
    console.error('chart fetch error:', error)
    return null
  }
}

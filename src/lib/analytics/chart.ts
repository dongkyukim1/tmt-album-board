import type { DailyPoint, Report } from './types'

export const number = (n: number | null | undefined) => n == null ? '—' : new Intl.NumberFormat('ko-KR').format(Math.round(n))
export const percent = (n: number | null | undefined) => n == null ? '—' : `${(n * 100).toFixed(1)}%`
export const divide = (a?: number, b?: number) => a == null || !b ? null : a / b
export function duration(n: number | null | undefined) {
  if (n == null) return '—'
  const seconds = Math.max(0, Math.round(n))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
export const dayOffset = (date: string, start: string) => (Date.parse(date) - Date.parse(start)) / 86400000
export function niceMax(value: number) {
  if (value <= 4) return 4
  const magnitude = 10 ** Math.floor(Math.log10(value / 4))
  return Math.ceil(Math.ceil(value / 4 / magnitude) * magnitude) * 4
}
export function linePath(points: { x: number; y: number; day: number }[]) {
  return points.map((p, i) => `${i && p.day - points[i - 1].day === 1 ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
}
export function dailyPoints(daily: DailyPoint[], start: string, span: number, max: number, metric: 'activeUsers' | 'sessions') {
  return daily.map(d => ({ x: 38 + dayOffset(d.date, start) / Math.max(1, span) * 614, y: 210 - d[metric] / max * 180, day: dayOffset(d.date, start) }))
}
export function hourlyGrid(data: Pick<Report, 'hourly' | 'hourlyRestricted'>) {
  return [1, 2, 3, 4, 5, 6, 0].map(day => Array.from({ length: 24 }, (_, hour) => ({
    day, hour, sessions: data.hourly.find(r => r.day === day && r.hour === hour)?.sessions ?? (data.hourlyRestricted ? null : 0),
  })))
}
export function editorStages(events: Report['events']) {
  return ['editor_open', 'album_add', 'chart_save', 'chart_complete'].map((name, i, names) => {
    const users = events.find(e => e.name === name)?.users ?? null
    const previous = events.find(e => e.name === names[i - 1])?.users
    return { name, users, ratio: users == null ? null : divide(users, previous) }
  })
}
export function localMockAllowed(mode: string | undefined, hostname: string, search: string) {
  return mode === 'development' && ['localhost', '127.0.0.1', '[::1]'].includes(hostname) && new URLSearchParams(search).get('mock') === '1'
}

export function dailySeries(data: Pick<Report, 'daily' | 'start' | 'end'>, value: (day: DailyPoint) => number | null) {
  const byOffset = new Map(data.daily.map(d => [dayOffset(d.date, data.start), d]))
  return Array.from({ length: dayOffset(data.end, data.start) + 1 }, (_, offset) => {
    const day = byOffset.get(offset)
    return day ? value(day) : null
  })
}

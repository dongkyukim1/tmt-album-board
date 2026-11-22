import type { Cohort, MetricSet } from './types'
export type GAReport = { rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[]; metadata?: { timeZone?: string; subjectToThresholding?: boolean; dataLossFromOtherRow?: boolean }; rowCount?: number }
export const metricNames = ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'userEngagementDuration', 'engagementRate'] as const
export function metrics(row?: GAReport['rows'] extends (infer R)[] | undefined ? R : never): MetricSet {
  return Object.fromEntries(metricNames.map((name, i) => [name, Number(row?.metricValues?.[i]?.value ?? 0)])) as MetricSet
}
export function dateShift(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10)
}
export function todayIn(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
export function cohortRanges(end: string) {
  return Array.from({ length: 8 }, (_, i) => ({ name: `week_${i}`, start: dateShift(end, -55 + i * 7), end: dateShift(end, -49 + i * 7) }))
}
export function dailyCohortRanges(ranges: ReturnType<typeof cohortRanges>) {
  return ranges.flatMap(range => Array.from({ length: 7 }, (_, i) => ({
    name: `${range.name}_day_${i}`, start: dateShift(range.start, i), end: dateShift(range.start, i),
  })))
}
export function parseCohorts(report: GAReport, ranges: ReturnType<typeof cohortRanges>, end: string): Cohort[] {
  return ranges.map(range => {
    const daily = dailyCohortRanges([range]).map(dayRange => {
      const rows = (report.rows ?? []).filter(r => r.dimensionValues?.[0]?.value === dayRange.name)
      const size = Math.max(0, ...rows.map(r => Number(r.metricValues?.[1]?.value ?? 0)))
      return { rows, size }
    })
    const size = daily.reduce((sum, day) => sum + day.size, 0)
    return { start: range.start, end: range.end, users: size, days: Object.fromEntries([0, 1, 3, 7, 14, 30].map(day => {
      const known = daily.filter(d => d.size > 0)
      const rows = known.map(d => d.rows.find(r => Number(r.dimensionValues?.[1]?.value) === day))
      const immature = dateShift(range.end, day) > end
      // Query single first-visit dates; sum their populations, never average percentages.
      // A missing return row is unknown, not evidence of zero retention.
      return [day, immature || !size || report.metadata?.subjectToThresholding || rows.some(r => !r)
        ? null : rows.reduce((sum, r) => sum + Number(r?.metricValues?.[0]?.value ?? 0), 0) / size]
    })) }
  })
}
export function weightedRetention(cohorts: Cohort[], day: number): number | null {
  const ready = cohorts.filter(c => c.users > 0 && c.days[day] != null)
  const users = ready.reduce((n, c) => n + c.users, 0)
  return users ? ready.reduce((n, c) => n + c.users * c.days[day]!, 0) / users : null
}
export function csvCell(value: string | number): string {
  const text = String(value); return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`
}

import { describe, expect, it } from 'vitest'
import { cohortRanges, dailyCohortRanges, csvCell, dateShift, metrics, parseCohorts, todayIn, weightedRetention } from '../src/lib/analytics/report'
describe('real analytics reporting', () => {
  it('handles timezone and month/year boundaries', () => {
    expect(todayIn('Asia/Seoul', new Date('2026-11-16T16:00:00Z'))).toBe('2026-11-17')
    expect(dateShift('2026-01-01', -1)).toBe('2025-12-31')
  })
  it('returns eight complete non-overlapping first-visit weeks', () => {
    const ranges = cohortRanges('2026-11-16')
    expect(ranges).toHaveLength(8)
    const daily = dailyCohortRanges(ranges)
    expect(daily).toHaveLength(56)
    expect(daily.every(r => r.start === r.end)).toBe(true)
    expect(ranges[7].end).toBe('2026-11-16')
    expect(dateShift(ranges[0].end, 1)).toBe(ranges[1].start)
  })
  it('does not turn missing or immature retention into zero', () => {
    const range = [{ name: 'test', start: '2026-11-01', end: '2026-11-07' }]
    const row = (day: number, active: number) => ({ dimensionValues: [{ value: 'test_day_0' }, { value: String(day) }], metricValues: [{ value: String(active) }, { value: '100' }] })
    const [cohort] = parseCohorts({ rows: [row(0, 100), row(1, 0), row(7, 25), row(30, 12)] }, range, '2026-11-16')
    expect(cohort.days[0]).toBe(1)
    expect(cohort.days[1]).toBe(0)
    expect(cohort.days[7]).toBe(.25)
    expect(cohort.days[14]).toBeNull()
    expect(cohort.days[30]).toBeNull()
  })
  it('weights only mature cohorts by population', () => {
    const cohorts = [{ start: '', end: '', users: 10, days: { 7: .5 } }, { start: '', end: '', users: 90, days: { 7: .1 } }, { start: '', end: '', users: 400, days: { 7: null } }]
    expect(weightedRetention(cohorts, 7)).toBe(.14)
    expect(weightedRetention([], 30)).toBeNull()
  })
  it('combines daily acquisition populations rather than averaging daily percentages', () => {
    const range = [{ name: 'week', start: '2026-09-01', end: '2026-09-07' }]
    const row = (index: number, active: number, total: number) => ({ dimensionValues: [{ value: `week_day_${index}` }, { value: '0007' }], metricValues: [{ value: String(active) }, { value: String(total) }] })
    const [cohort] = parseCohorts({ rows: [row(0, 5, 10), row(6, 9, 90)] }, range, '2026-11-16')
    expect(cohort.users).toBe(100)
    expect(cohort.days[7]).toBe(.14)
  })
  it('does not report a partial week when a populated daily cohort is missing its return row', () => {
    const range = [{ name: 'week', start: '2026-09-01', end: '2026-09-07' }]
    const row = (index: number, day: number, active: number, total: number) => ({ dimensionValues: [{ value: `week_day_${index}` }, { value: String(day) }], metricValues: [{ value: String(active) }, { value: String(total) }] })
    const [cohort] = parseCohorts({ rows: [row(0, 7, 5, 10), row(6, 0, 90, 90)] }, range, '2026-11-16')
    expect(cohort.users).toBe(100)
    expect(cohort.days[7]).toBeNull()
  })
  it('withholds retention when privacy thresholding can make the cohort population incomplete', () => {
    const range = [{ name: 'week', start: '2026-09-01', end: '2026-09-07' }]
    const rows = [{ dimensionValues: [{ value: 'week_day_0' }, { value: '0007' }], metricValues: [{ value: '5' }, { value: '10' }] }]
    expect(parseCohorts({ rows, metadata: { subjectToThresholding: true } }, range, '2026-11-16')[0].days[7]).toBeNull()
  })
  it('keeps true zero metrics and prevents CSV formula injection', () => {
    expect(metrics().activeUsers).toBe(0)
    expect(csvCell('=IMPORTXML("x")')).toBe('"\'=IMPORTXML(""x"")"')
    expect(csvCell(15)).toBe('"15"')
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { dateShift } from '../src/lib/analytics/report'
const request = vi.hoisted(() => vi.fn())
vi.mock('google-auth-library', () => ({ GoogleAuth: class { async getClient() { return { request } } } }))
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); request.mockReset() })
describe('GA4 editorial dashboard queries', () => {
  it('queries previous daily data and hourly sessions with the selected platform and property dates', async () => {
    vi.stubEnv('GA4_PROPERTY_ID', '123456')
    request.mockImplementation(async ({ data: body }) => {
      const dimensions = (body.dimensions ?? []).map((d: { name: string }) => d.name)
      if (dimensions.includes('dayOfWeek')) return { data: { rows: [{ dimensionValues: [{ value: '0' }, { value: '23' }], metricValues: [{ value: '17' }] }], metadata: { subjectToThresholding: true } } }
      if (dimensions[0] === 'date') return { data: { rows: [{ dimensionValues: [{ value: body.dateRanges[0].startDate.replaceAll('-', '') }], metricValues: [{ value: '12' }] }] } }
      return { data: { metadata: { timeZone: 'Asia/Seoul' } } }
    })
    const { loadAnalytics } = await import('../src/lib/analytics/google')
    const result = await loadAnalytics(28, 'ios')
    const bodies = request.mock.calls.map(([r]) => r.data)
    const hourly = bodies.find(b => b.dimensions?.some((d: { name: string }) => d.name === 'dayOfWeek'))
    expect(hourly.dimensions).toEqual([{ name: 'dayOfWeek' }, { name: 'hour' }])
    expect(hourly.metrics).toEqual([{ name: 'sessions' }])
    expect(hourly.dimensionFilter.filter.inListFilter.values).toEqual(['iOS'])
    expect(hourly.dateRanges).toEqual([{ startDate: result.start, endDate: result.end }])
    expect(result.hourly).toEqual([{ day: 0, hour: 23, sessions: 17 }])
    expect(result.hourlyRestricted).toBe(true)
    expect(result.previousDaily[0].date).toBe(dateShift(result.start, -28))
    expect(result.previousDaily[0].activeUsers).toBe(12)
    expect(result.durationDistribution).toBeNull()
    expect(result.warnings).toHaveLength(1)
  })
})

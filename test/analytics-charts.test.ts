import { describe, expect, it } from 'vitest'
import { dailySeries, dailyPoints, duration, editorStages, hourlyGrid, linePath, localMockAllowed, niceMax } from '../src/lib/analytics/chart'
import { mockReport } from '../src/lib/analytics/mock'

describe('analytics chart semantics', () => {
  it('rounds seconds before formatting m:ss', () => {
    expect(duration(59.9)).toBe('1:00')
    expect(duration(278)).toBe('4:38')
    expect(duration(null)).toBe('—')
  })
  it('uses actual round-number axis values above the maximum', () => {
    expect(niceMax(88)).toBe(120)
    expect(niceMax(0)).toBe(4)
    expect(niceMax(1)).toBe(4)
    expect(niceMax(3)).toBe(4)
    expect(niceMax(5)).toBe(8)
    for (let count = 1; count < 100; count++) expect(Number.isInteger(niceMax(count) / 4)).toBe(true)
  })
  it('does not connect a missing day or collapse its horizontal position', () => {
    const data = mockReport(7, 'app')
    const points = dailyPoints([data.daily[0], data.daily[2]], data.start, 6, 100, 'activeUsers')
    expect(points[1].x).toBeCloseTo(38 + 614 / 3)
    expect(linePath(points).match(/M/g)).toHaveLength(2)
    expect(dailySeries({ ...data, daily: [data.daily[0], data.daily[2]] }, d => d.newUsers)).toEqual([data.daily[0].newUsers, null, data.daily[2].newUsers, null, null, null, null])
  })
  it('places Sunday last and preserves unavailable thresholded cells', () => {
    const grid = hourlyGrid({ hourly: [{ day: 0, hour: 23, sessions: 9 }], hourlyRestricted: true })
    expect(grid[0][0]).toEqual({ day: 1, hour: 0, sessions: null })
    expect(grid[6][23].sessions).toBe(9)
    expect(hourlyGrid({ hourly: [], hourlyRestricted: false })[0][0].sessions).toBe(0)
  })
  it('keeps missing editor events unknown and independent ratios may exceed 100%', () => {
    const stages = editorStages([{ name: 'editor_open', users: 10, count: 15 }, { name: 'album_add', users: 12, count: 50 }])
    expect(stages[1].ratio).toBe(1.2)
    expect(stages[2].users).toBeNull()
    expect(stages[3].ratio).toBeNull()
  })
  it('never enables mock mode on production or remote development hosts', () => {
    expect(localMockAllowed('production', 'localhost', '?mock=1')).toBe(false)
    expect(localMockAllowed('development', 'tmt-album-board.vercel.app', '?mock=1')).toBe(false)
    expect(localMockAllowed('development', 'localhost', '')).toBe(false)
    expect(localMockAllowed('development', 'localhost', '?mock=1')).toBe(true)
  })
})

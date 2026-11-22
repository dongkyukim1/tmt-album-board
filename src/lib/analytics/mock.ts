// Deterministic visual QA fixture. Imported only by the development-only, localhost ?mock=1 branch.
import { cohortRanges, dateShift } from './report'
import type { MetricSet, Platform, Report } from './types'
export function mockReport(days: number, platform: Platform): Report {
  const end = '2026-11-16', start = dateShift(end, 1 - days)
  const factor = platform === 'ios' ? .64 : platform === 'android' ? .36 : platform === 'web' ? .2 : 1
  const daily = Array.from({ length: days }, (_, i) => {
    const users = Math.round((30 + i * 2 + [0, 2, 5, -1, 3, 6, 1][i % 7]) * factor)
    return { date: dateShift(start, i), activeUsers: users, newUsers: Math.round(users * .32), sessions: users * 3, screenPageViews: users * 12, userEngagementDuration: users * (300 - i * .8), engagementRate: .713 }
  })
  const totals: MetricSet = { activeUsers: Math.round(1284 * factor * days / 28), newUsers: Math.round(412 * factor * days / 28), sessions: daily.reduce((n, d) => n + d.sessions, 0), screenPageViews: daily.reduce((n, d) => n + d.screenPageViews, 0), userEngagementDuration: Math.round(1284 * factor * days / 28) * 278, engagementRate: .713 }
  return { source: 'Google Analytics 4', fetchedAt: `${end}T12:00:00Z`, timezone: 'Asia/Seoul', start, end, totals,
    previous: { ...totals, activeUsers: Math.round(totals.activeUsers / 1.124), newUsers: Math.round(totals.newUsers / 1.081), sessions: Math.round(totals.sessions / 1.15), userEngagementDuration: totals.userEngagementDuration * .92, engagementRate: .694 },
    daily, previousDaily: daily.map(d => ({ ...d, date: dateShift(d.date, -days), activeUsers: Math.round(d.activeUsers * .81) })),
    hourly: Array.from({ length: 168 }, (_, i) => ({ day: Math.floor(i / 24), hour: i % 24, sessions: Math.round((3 + (i % 24 > 17 ? 50 : i % 24 > 8 ? 22 : 1) + i % 11) * factor * days / 28) })), hourlyRestricted: false,
    durationDistribution: ['~10초', '10–30초', '30초–1분', '1–3분', '3–10분', '10분+'].map((label, i) => ({ label, sessions: [80, 140, 230, 430, 310, 170][i] })),
    screens: ['editor', 'digging', 'album_detail', 'home', 'my_tmt', 'search'].map((name, i) => ({ name, users: Math.round((620 - i * 65) * factor), views: Math.round((2400 - i * 320) * factor), seconds: Math.round((620 - i * 65) * factor) * [318, 187, 134, 98, 72, 45][i] })),
    cohorts: cohortRanges(end).map((c, i) => ({ start: c.start, end: c.end, users: 80 + i * 17, days: Object.fromEntries([0, 1, 3, 7, 14, 30].map(day => [day, dateShift(c.end, day) > end ? null : day === 0 ? 1 : Math.max(.09, .65 - day * .012 + i * .008)])) })),
    active: { day: daily.at(-1)!.activeUsers, week: Math.round(600 * factor), month: totals.activeUsers }, realtime: Math.round(14 * factor),
    events: ['editor_open', 'album_add', 'chart_save', 'chart_complete', 'share_open'].map((name, i) => ({ name, count: Math.round([2140, 1800, 1072, 802, 316][i] * factor), users: Math.round([780, 642, 411, 302, 140][i] * factor) })),
    platforms: platform === 'app' ? [{ name: 'iOS', users: 822 }, { name: 'Android', users: 462 }] : [{ name: platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'web', users: totals.activeUsers }], warnings: [],
  }
}

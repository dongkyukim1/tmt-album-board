import { GoogleAuth } from 'google-auth-library'
import { cohortRanges, dailyCohortRanges, dateShift, metrics, metricNames, parseCohorts, todayIn, type GAReport } from './report'
import type { Platform, Report } from './types'

export class AnalyticsError extends Error { constructor(public code: string) { super(code) } }
const cache = new Map<string, { until: number; report: Report }>()
const inflight = new Map<string, Promise<Report>>()
function platformFilter(platform: Platform) {
  return { filter: { fieldName: 'platform', inListFilter: { values: platform === 'app' ? ['Android', 'iOS'] : [platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'web'] } } }
}
export async function loadAnalytics(days: number, platform: Platform): Promise<Report> {
  const property = process.env.GA4_PROPERTY_ID
  if (!property || !/^\d+$/.test(property)) throw new AnalyticsError('NOT_CONFIGURED')
  const key = `${property}:${days}:${platform}`
  const old = cache.get(key)
  if (old && old.until > Date.now()) return old.report
  const pending = inflight.get(key)
  if (pending) return pending
  const promise = queryAnalytics(property, days, platform).then(report => {
    cache.set(key, { until: Date.now() + 60_000, report }); return report
  }).finally(() => inflight.delete(key))
  inflight.set(key, promise); return promise
}
async function queryAnalytics(property: string, days: number, platform: Platform): Promise<Report> {
  const json = process.env.GOOGLE_ANALYTICS_CREDENTIALS
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/analytics.readonly'], ...(json ? { credentials: JSON.parse(json) } : {}) })
  const client = await auth.getClient()
  const run = async (body: object, realtime = false): Promise<GAReport> => {
    const { data } = await client.request<GAReport>({
      url: `https://analyticsdata.googleapis.com/v1beta/properties/${property}:${realtime ? 'runRealtimeReport' : 'runReport'}`,
      method: 'POST', data: body, timeout: 30_000,
    }); return data
  }
  const filter = platformFilter(platform)
  // Read property timezone from Google rather than assuming browser/UTC time.
  const probe = await run({ dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }], metrics: [{ name: 'activeUsers' }], dimensionFilter: filter })
  const timezone = probe.metadata?.timeZone ?? 'Asia/Seoul'
  const end = dateShift(todayIn(timezone), -1), start = dateShift(end, 1 - days)
  const base = { dateRanges: [{ startDate: start, endDate: end }], dimensionFilter: filter, limit: 10000 }
  const named = (names: readonly string[]) => names.map(name => ({ name }))
  const ranges = cohortRanges(end)
  const reportRequests = [
    run({ ...base, metrics: named(metricNames) }),
    run({ ...base, dateRanges: [{ startDate: dateShift(start, -days), endDate: dateShift(start, -1) }], metrics: named(metricNames) }),
    run({ ...base, dimensions: named(['date']), metrics: named(metricNames), orderBys: [{ dimension: { dimensionName: 'date' } }] }),
    run({ ...base, dimensions: named([platform === 'web' ? 'unifiedPageScreen' : 'unifiedScreenName']), metrics: named(['activeUsers', 'screenPageViews', 'userEngagementDuration']), orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }] }),
    run({ ...base, dimensions: named(['eventName']), metrics: named(['eventCount', 'totalUsers']), orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }] }),
    run({ ...base, dimensions: named(['platform']), metrics: named(['activeUsers']) }),
    run({ dimensionFilter: filter, dateRanges: [1, 7, 30].map(n => ({ startDate: dateShift(end, 1 - n), endDate: end, name: `d${n}` })), metrics: named(['activeUsers']) }),
  ]
  const [totals, previous, daily, screens, events, platforms, active] = await Promise.all(reportRequests)
  const cohortReports: GAReport[] = []
  // Seven single-day cohorts per request, two requests at once to respect property concurrency.
  const runCohorts = (range: typeof ranges[number]) => run({
    dimensionFilter: filter, dimensions: named(['cohort', 'cohortNthDay']),
    metrics: named(['cohortActiveUsers', 'cohortTotalUsers']),
    cohortSpec: { cohorts: dailyCohortRanges([range]).map(r => ({ name: r.name, dimension: 'firstSessionDate', dateRange: { startDate: r.start, endDate: r.end } })),
      cohortsRange: { granularity: 'DAILY', startOffset: 0, endOffset: 30 } }, limit: 10000,
  })
  for (let i = 0; i < ranges.length; i += 2) cohortReports.push(...await Promise.all(ranges.slice(i, i + 2).map(runCohorts)))
  const cohorts: GAReport = { rows: cohortReports.flatMap(r => r.rows ?? []), metadata: { subjectToThresholding: cohortReports.some(r => r.metadata?.subjectToThresholding) } }
  const warnings: string[] = []
  let realtime: number | null = null
  try {
    const result = await run({ metrics: named(['activeUsers']), dimensionFilter: filter }, true)
    realtime = Number(result.rows?.[0]?.metricValues?.[0]?.value ?? 0)
  } catch { warnings.push('실시간 보고서를 조회하지 못했습니다. 집계 보고서는 정상적으로 표시합니다.') }
  if ([totals, previous, daily, screens, events, platforms, cohorts].some(r => r.metadata?.subjectToThresholding)) warnings.push('Google의 개인정보 보호 기준에 따라 일부 소규모 데이터가 제한될 수 있습니다.')
  if ([screens, events].some(r => r.metadata?.dataLossFromOtherRow || (r.rowCount ?? 0) > 10000)) warnings.push('일부 상세 행이 Google의 집계 또는 응답 한도로 생략되었습니다.')
  const rows = (r: GAReport) => r.rows ?? []
  const d = (r: NonNullable<GAReport['rows']>[number], i = 0) => r.dimensionValues?.[i]?.value ?? ''
  const m = (r: NonNullable<GAReport['rows']>[number], i = 0) => Number(r.metricValues?.[i]?.value ?? 0)
  const activeAt = (name: string) => m(rows(active).find(r => d(r) === name) ?? {})
  return {
    source: 'Google Analytics 4', fetchedAt: new Date().toISOString(), timezone, start, end,
    totals: metrics(totals.rows?.[0]), previous: metrics(previous.rows?.[0]),
    daily: rows(daily).map(r => ({ date: d(r).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'), ...metrics(r) })),
    screens: rows(screens).map(r => ({ name: d(r), users: m(r), views: m(r, 1), seconds: m(r, 2) })),
    events: rows(events).map(r => ({ name: d(r), count: m(r), users: m(r, 1) })),
    platforms: rows(platforms).map(r => ({ name: d(r), users: m(r) })),
    cohorts: parseCohorts(cohorts, ranges, end), active: { day: activeAt('d1'), week: activeAt('d7'), month: activeAt('d30') }, realtime, warnings,
  }
}

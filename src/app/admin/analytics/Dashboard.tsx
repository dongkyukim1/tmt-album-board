'use client'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { csvCell, weightedRetention } from '@/lib/analytics/report'
import { dailySeries, divide, duration, localMockAllowed, number, percent } from '@/lib/analytics/chart'
import { screenLabels, type Platform, type Report } from '@/lib/analytics/types'
import { Cohorts, Delta, Distribution, Empty, Events, Funnel, Hours, Platforms, Ring, ScreenBars, Spark, Trend } from './Charts'
import s from './dashboard.module.css'

const sections = [{ id: 'overview', label: '오버뷰' }, { id: 'retention', label: '리텐션' }, { id: 'screens', label: '화면 분석' }, { id: 'events', label: '사용자 행동' }, { id: 'definitions', label: '데이터 가이드' }]
export default function Dashboard() {
  const [data, setData] = useState<Report | null>(null), [status, setStatus] = useState('loading')
  const [days, setDays] = useState(28), [platform, setPlatform] = useState<Platform>('app')
  const [section, setSection] = useState('overview'), [busy, setBusy] = useState(false)
  const [search, setSearch] = useState(''), [sort, setSort] = useState('views')
  const [loginError, setLoginError] = useState(''), [message, setMessage] = useState('')
  const [mock, setMock] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const load = useCallback(async () => {
    abort.current?.abort(); const controller = new AbortController(); abort.current = controller
    setBusy(true); setStatus('loading'); setData(null)
    try {
      const preview = localMockAllowed(process.env.NODE_ENV, location.hostname, location.search)
      setMock(preview)
      if (preview) {
        const { mockReport } = await import('@/lib/analytics/mock')
        if (!controller.signal.aborted) { setData(mockReport(days, platform)); setStatus('ready') }
        return
      }
      const response = await fetch(`/api/analytics?days=${days}&platform=${platform}`, { signal: controller.signal, cache: 'no-store' })
      const body = await response.json()
      if (controller.signal.aborted) return
      if (!response.ok) { setStatus(body.code ?? 'UNAVAILABLE'); return }
      setData(body.data); setStatus('ready')
    } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setStatus('UNAVAILABLE') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }, [days, platform])
  useEffect(() => { void load(); return () => abort.current?.abort() }, [load])
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setLoginError('')
    try {
      const result = await fetch('/api/analytics/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) })
      if (!result.ok) { setLoginError((await result.json()).error); return }
      await load()
    } catch { setLoginError('연결하지 못했습니다. 잠시 후 다시 시도해주세요.') }
    finally { setBusy(false) }
  }
  async function logout() {
    abort.current?.abort(); setBusy(true)
    try {
      const result = await fetch('/api/analytics/session', { method: 'DELETE' })
      if (!result.ok) throw new Error('LOGOUT_FAILED')
      setData(null); setStatus('AUTH_REQUIRED'); setMessage('로그아웃했습니다.')
    } catch { setMessage('로그아웃하지 못했습니다. 다시 시도해주세요.') }
    finally { setBusy(false) }
  }
  function exportCsv() {
    if (!data) return
    const rows: (string | number)[][] = [['TMT Insights', mock ? 'LOCAL MOCK · 실제 데이터 아님' : data.source, data.start, data.end, platform, data.timezone], ['date', 'active_users', 'new_users', 'sessions', 'screen_views', 'engagement_seconds'], ...data.daily.map(d => [d.date, d.activeUsers, d.newUsers, d.sessions, d.screenPageViews, d.userEngagementDuration]), [], ['screen', 'users', 'views', 'foreground_seconds'], ...data.screens.map(d => [d.name, d.users, d.views, d.seconds]), [], ['cohort_start', 'cohort_end', 'users', 'D1', 'D3', 'D7', 'D14', 'D30'], ...data.cohorts.map(c => [c.start, c.end, c.users, c.days[1] ?? '', c.days[3] ?? '', c.days[7] ?? '', c.days[14] ?? '', c.days[30] ?? '']), [], ['day_of_week_sunday_0', 'hour', 'sessions'], ...data.hourly.map(h => [h.day, h.hour, h.sessions])]
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = `tmt-insights-${mock ? 'mock-' : ''}${platform}-${data.start}-${data.end}.csv`; a.click(); URL.revokeObjectURL(url); setMessage(mock ? '모의 데이터를 CSV로 내보냈습니다.' : '선택한 기간의 실제 데이터를 CSV로 내보냈습니다.')
  }
  const visible = (id: string) => section === 'overview' || section === id
  const filteredScreens = (data?.screens ?? []).filter(row => `${screenLabels[row.name] ?? ''} ${row.name}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'duration' ? (divide(b.seconds, b.users) ?? 0) - (divide(a.seconds, a.users) ?? 0) : b.views - a.views)
  const stateText: Record<string, [string, string]> = {
    NOT_CONFIGURED: ['Firebase 보고서 연결을 준비하고 있어요', 'Google Analytics 속성과 읽기 권한을 연결하면 실제 앱 데이터가 표시됩니다.'],
    UNAVAILABLE: ['데이터를 가져오지 못했어요', 'Google Analytics 연결과 서버 설정을 확인한 후 다시 시도해주세요.'],
    FORBIDDEN: ['관리자 권한이 필요해요', 'TMT 관리자 계정으로 로그인해주세요.'],
  }
  const heroNumber = number(data?.totals.activeUsers), d7 = data ? weightedRetention(data.cohorts, 7) : null
  return <div className={s.app}>
    <a href="#dashboard-content" className={s.skip}>본문으로 건너뛰기</a>
    <header className={s.header}>
      <a className={s.brand} href="/admin/analytics"><Image src="/tmt-logo.png" alt="" width={28} height={22} /><span>TMT insights</span></a>
      <nav aria-label="분석 메뉴">{sections.map(item => <button key={item.id} aria-current={section === item.id ? 'page' : undefined} onClick={() => { setSection(item.id); document.getElementById('dashboard-content')?.focus() }}>{item.label}</button>)}</nav>
      <div className={s.controls}><div className={s.platforms} role="group" aria-label="플랫폼">{([['app', '전체 앱'], ['ios', 'iOS'], ['android', 'Android'], ['web', 'Web']] as const).map(([value, label]) => <button key={value} aria-pressed={platform === value} onClick={() => setPlatform(value)}>{label}</button>)}</div><label><span className={s.srOnly}>조회 기간</span><select value={days} onChange={e => setDays(Number(e.target.value))}><option value={7}>최근 7일</option><option value={28}>최근 28일</option><option value={90}>최근 90일</option></select></label><button onClick={exportCsv} disabled={!data} aria-label="CSV 내보내기">↓ CSV</button></div>
    </header>
    <main id="dashboard-content" className={s.main} tabIndex={-1} aria-busy={busy}>
      <h1 className={s.srOnly}>TMT Insights · {sections.find(item => item.id === section)?.label}</h1>
      <div className={s.meta}><span>{mock ? 'LOCAL PREVIEW · 모의 데이터' : 'TMT PRODUCT ANALYTICS · 관리자 전용'}</span><div><button onClick={load} disabled={busy}>↻ 새로고침</button>{data && !mock && <button onClick={logout} disabled={busy}>로그아웃</button>}<a href="/">TMT 웹 ↗</a></div></div>
      {mock && <p className={s.mockBanner} role="status">디자인 검증용 모의 데이터입니다. 실제 사용자 지표가 아니며 로컬 개발 환경에서만 표시됩니다.</p>}
        {status === 'AUTH_REQUIRED' && <section className={s.loginPanel}><div><span className={s.eyebrow}>YOUR PRODUCT, IN FOCUS</span><h2>진짜 사용자의<br />이야기를 만나보세요.</h2><p>앱의 성장과 사용자 경험을 한곳에서.<br />TMT 관리자 계정으로 시작하세요.</p><div className={s.loginFeatures}><span>01 <strong>활성 사용자</strong></span><span>02 <strong>코호트 리텐션</strong></span><span>03 <strong>화면 체류시간</strong></span></div></div><form onSubmit={login}><span className={s.loginLock}>↗</span><h3>워크스페이스 로그인</h3><p>기존 TMT 관리자 계정을 사용합니다.</p><label>이메일<input type="email" name="email" autoComplete="username" placeholder="admin@tmt.com" required /></label><label>비밀번호<input type="password" name="password" autoComplete="current-password" placeholder="비밀번호를 입력하세요" required /></label>{loginError && <p role="alert" className={s.error}>{loginError}</p>}<button className={s.primary} disabled={busy}>{busy ? '확인 중…' : '대시보드 열기'} <span>→</span></button><small>보고서는 관리자에게만 공개됩니다.</small></form></section>}
        {status === 'loading' && <div className={s.loading} role="status"><span /> 실제 분석 데이터를 불러오는 중입니다…</div>}
        {stateText[status] && <section className={s.statePanel}><Empty text={stateText[status][0]} sub={stateText[status][1]} /><button className={s.primary} onClick={status === 'FORBIDDEN' ? logout : load}>{status === 'FORBIDDEN' ? '다른 계정으로 로그인' : '다시 확인'}</button><a href="https://console.firebase.google.com/project/tmt-product-analytics/overview" target="_blank" rel="noreferrer">Firebase 콘솔 열기 ↗</a></section>}
      {data && <>
        {data.warnings.map(w => <p key={w} className={s.warning} role="status">{w}</p>)}
        {section === 'overview' && <>
          <section className={s.hero} aria-label="활성 사용자와 일별 추이"><div className={s.heroCopy}><p className={s.eyebrow}>활성 사용자 · {data.start.replaceAll('-', '.')} – {data.end.slice(5).replace('-', '.')}</p><div className={s.big}>{heroNumber.slice(0, -3)}<em>{heroNumber.slice(-3)}</em></div><div className={s.rule} /><p className={s.heroSummary}><Delta now={data.totals.activeUsers} before={data.previous.activeUsers} /> 이전 동기간 대비. 신규 {number(data.totals.newUsers)}명{d7 == null ? '.' : `, 관찰 완료 코호트의 ${percent(d7)}가 첫 방문 7일 후 다시 돌아왔습니다.`}</p></div><Trend data={data} /></section>
          <section className={s.kpis} aria-label="주요 지표"><article><div><h2>신규 사용자</h2><strong>{number(data.totals.newUsers)}</strong><small><Delta now={data.totals.newUsers} before={data.previous.newUsers} /></small></div><Spark values={dailySeries(data, d => d.newUsers)} label="일별 신규 사용자 추이" /></article><article><div><h2>세션</h2><strong>{number(data.totals.sessions)}</strong><small><Delta now={data.totals.sessions} before={data.previous.sessions} /></small></div><Spark values={dailySeries(data, d => d.sessions)} color="var(--txt)" label="일별 세션 추이" /></article><article><div><h2>평균 체류시간 <span> / 사용자</span></h2><strong>{duration(divide(data.totals.userEngagementDuration, data.totals.activeUsers))}</strong><small><Delta now={divide(data.totals.userEngagementDuration, data.totals.activeUsers)} before={divide(data.previous.userEngagementDuration, data.previous.activeUsers)} /></small></div><Spark values={dailySeries(data, d => divide(d.userEngagementDuration, d.activeUsers))} color="var(--secondary)" label="일별 사용자당 활성 체류시간 추이" /></article><article><div><h2>참여율</h2><strong>{percent(data.totals.engagementRate)}</strong><small className={data.totals.engagementRate >= data.previous.engagementRate ? s.positive : s.negative}>{data.previous.sessions ? `${data.totals.engagementRate >= data.previous.engagementRate ? '↗' : '↘'} ${Math.abs((data.totals.engagementRate - data.previous.engagementRate) * 100).toFixed(1)}%p` : '비교 데이터 없음'}</small></div><Ring value={data.totals.engagementRate} /></article></section>
        </>}
        {(visible('retention') || visible('screens')) && <div className={s.sectionRow}>{visible('retention') && <section><Cohorts data={data} /></section>}{visible('screens') && <section><ScreenBars data={data} /></section>}</div>}
        {(visible('events') || visible('screens')) && <div className={s.sectionRow}>{visible('events') && <section><Hours data={data} /></section>}{visible('screens') && <section><Distribution data={data} /></section>}</div>}
        {visible('events') && <div className={s.sectionRow}><section><Funnel data={data} /></section><section><Platforms data={data} /><div className={s.eventSection}><Events data={data} /></div></section></div>}
        {section === 'screens' && <section className={s.screenDetails}><div className={s.screenTools}><h2>화면별 상세 데이터</h2><label><span className={s.srOnly}>화면 검색</span><input placeholder="화면 검색…" value={search} onChange={e => setSearch(e.target.value)} /></label><label>정렬 <select value={sort} onChange={e => setSort(e.target.value)}><option value="views">조회수 높은 순</option><option value="duration">사용자당 체류시간 순</option></select></label></div>{filteredScreens.length ? <div className={s.tableWrap}><table><thead><tr><th>화면</th><th>조회수</th><th>활성 사용자</th><th>사용자당 활성 체류</th><th>조회 비중</th></tr></thead><tbody>{filteredScreens.map(row => <tr key={row.name}><td>{screenLabels[row.name] ?? row.name}<small>{row.name}</small></td><td>{number(row.views)}</td><td>{number(row.users)}</td><td>{duration(divide(row.seconds, row.users))}</td><td>{percent(divide(row.views, data.totals.screenPageViews))}</td></tr>)}</tbody></table></div> : <Empty text={search ? '검색 결과가 없습니다' : undefined} sub={search ? '다른 화면 이름으로 검색해보세요.' : undefined} />}</section>}
        {section === 'definitions' && <section className={s.definitions}><article><h2>활성 사용자와 방문</h2><p>GA4의 활성 사용자와 세션 정의를 사용합니다. DAU·WAU·MAU는 어제까지 1·7·30일의 고유 활성 사용자이며 합산 값이 아닙니다. 세션 추이 점선은 자체 최댓값으로 정규화하며 왼쪽 사용자 수 눈금을 적용하지 않습니다.</p></article><article><h2>리텐션과 관찰 기간</h2><p>첫 방문 주차에 속한 사용자가 D1·D3·D7·D14·D30에 다시 활동한 비율입니다. 코호트 전체의 관찰 기간이 끝나야 표시합니다. 최근 4주를 표로 보여주며 요약은 최근 8주 중 관찰 완료 코호트의 인원 가중 평균입니다.</p></article><article><h2>화면에서 보낸 시간</h2><p>Firebase가 측정한 포그라운드 참여시간입니다. 사용자당·세션당 평균을 구분하며 백그라운드 시간은 포함하지 않습니다. 세션별 체류 분포는 수집 준비 중입니다.</p></article><article><h2>수집 이후의 실제 데이터</h2><p>Firebase가 연결된 앱 버전부터 수집합니다. 과거 이용 기록을 복원하거나 샘플 값으로 채우지 않습니다. 공유 시트 열기는 공유 완료가 아니며 행동별 사용자 수는 순차 전환율이 아닙니다.</p></article></section>}
        <div className={s.liveStats}><span>최근 30분 <b>{number(data.realtime)}</b>명</span><span>DAU <b>{number(data.active.day)}</b></span><span>WAU <b>{number(data.active.week)}</b></span><span>MAU <b>{number(data.active.month)}</b></span><span>{data.timezone} · {new Date(data.fetchedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 조회</span></div>
      </>}
      <footer className={s.footer}><span>TASTE MY TASTE <b>×</b> INSIGHTS</span><p>일별 보고서 최대 48시간 지연 반영 · 코호트 빈 칸은 0%가 아닙니다.</p></footer>
      <p className={s.statusMessage} role="status">{message}</p>
    </main>
  </div>
}

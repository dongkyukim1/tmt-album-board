'use client'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { csvCell, weightedRetention } from '@/lib/analytics/report'
import { eventLabels, screenLabels, type Platform, type Report } from '@/lib/analytics/types'
import s from './dashboard.module.css'

const number = (n: number | null | undefined) => n == null ? '—' : new Intl.NumberFormat('ko-KR').format(Math.round(n))
const percent = (n: number | null | undefined) => n == null ? '—' : `${(n * 100).toFixed(1)}%`
const duration = (n: number | null | undefined) => n == null ? '—' : `${Math.floor(n / 60)}분 ${Math.round(n % 60)}초`
const divide = (a?: number, b?: number) => a == null || !b ? null : a / b
const sections = [{ id: 'overview', label: '오버뷰', icon: 'grid' }, { id: 'retention', label: '리텐션', icon: 'repeat' }, { id: 'screens', label: '화면 분석', icon: 'screen' }, { id: 'events', label: '사용자 행동', icon: 'activity' }, { id: 'definitions', label: '데이터 가이드', icon: 'book' }]
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    repeat: <><path d="M20 7H6a3 3 0 0 0-3 3m17-3-4-4m4 4-4 4M4 17h14a3 3 0 0 0 3-3M4 17l4 4m-4-4 4-4" /></>,
    screen: <><rect x="3" y="3" width="18" height="13" rx="2" /><path d="M8 21h8m-4-5v5" /></>,
    activity: <path d="M2 12h4l4-8 4 16 4-8h4" />,
    book: <><path d="M12 5v16M3 4h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6v15h-6a3 3 0 0 0-3 2 3 3 0 0 0-3-2H3z" /></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" /></>,
    arrow: <path d="M5 19 19 5M6 5h13v13" />,
    refresh: <><path d="M20 10a8 8 0 1 0-1 7M20 3v7h-7" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.activity}</svg>
}
function Empty({ text = '아직 수집된 데이터가 없습니다', sub = '연결된 앱에서 활동이 발생하면 이곳에 표시됩니다.' }: { text?: string; sub?: string }) {
  return <div className={s.empty}><span className={s.emptyIcon}><Icon name="activity" size={26} /></span><strong>{text}</strong><p>{sub}</p></div>
}
function Delta({ now, before }: { now?: number; before?: number }) {
  if (now == null || !before) return <span className={s.muted}>비교 데이터 없음</span>
  const delta = (now - before) / before
  return <span className={delta >= 0 ? s.positive : s.negative}>{delta >= 0 ? '↗' : '↘'} {Math.abs(delta * 100).toFixed(1)}% <span className={s.muted}>이전 동기간 대비</span></span>
}
function Trend({ data, metric }: { data: Report; metric: 'activeUsers' | 'sessions' }) {
  const [hover, setHover] = useState<number | null>(null)
  if (!data.daily.length) return <Empty />
  const max = Math.max(1, ...data.daily.map(d => d[metric])); const count = data.daily.length
  const dayOffset = (date: string) => (Date.parse(date) - Date.parse(data.start)) / 86400000
  const span = Math.max(1, dayOffset(data.end))
  const points = data.daily.map(d => [48 + dayOffset(d.date) / span * 752, 190 - d[metric] / max * 155])
  const path = points.map(([x, y], i) => `${i && dayOffset(data.daily[i].date) - dayOffset(data.daily[i - 1].date) === 1 ? 'L' : 'M'}${x},${y}`).join(' ')
  return <div className={s.trend}>
    <svg viewBox="0 0 830 235" role="img" aria-label={`${data.start}부터 ${data.end}까지 ${metric === 'activeUsers' ? '활성 사용자' : '세션'} 추이`}>
      <defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#cff730" stopOpacity=".2" /><stop offset="1" stopColor="#cff730" stopOpacity="0" /></linearGradient></defs>
      {[0, .5, 1].map(n => <g key={n}><line x1="48" y1={190 - n * 155} x2="800" y2={190 - n * 155} stroke="#ffffff12" strokeDasharray="4 5" /><text x="2" y={195 - n * 155} fill="#969b92" fontSize="11">{number(n * max)}</text></g>)}
      <path d={path} fill="none" stroke="#cff730" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map(([x, y], i) => <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
        <circle cx={x} cy={y} r={hover === i ? 5 : 3} fill="#cff730" /><rect x={x - 12} y="20" width="24" height="175" fill="transparent"><title>{data.daily[i].date}: {number(data.daily[i][metric])}</title></rect>
      </g>)}
      {[0, Math.floor((count - 1) / 2), count - 1].filter((v, i, arr) => arr.indexOf(v) === i).map(i => <text key={i} x={points[i][0]} y="222" textAnchor="middle" fill="#969b92" fontSize="11">{data.daily[i].date.slice(5).replace('-', '.')}</text>)}
    </svg>
    <div className={s.chartCaption} aria-live="polite">{hover == null ? `${metric === 'activeUsers' ? '일별 활성 사용자 · 중복 방문 제외' : '일별 세션 수'} · 누락 일자는 선을 연결하지 않음` : `${data.daily[hover].date} · ${number(data.daily[hover][metric])}${metric === 'activeUsers' ? '명' : '회'}`}</div>
    <details className={s.chartData}><summary>일별 데이터 표 보기</summary><table><thead><tr><th>날짜</th><th>활성 사용자</th><th>세션</th></tr></thead><tbody>{data.daily.map(d => <tr key={d.date}><td>{d.date}</td><td>{number(d.activeUsers)}</td><td>{number(d.sessions)}</td></tr>)}</tbody></table></details>
  </div>
}
export default function Dashboard() {
  const [data, setData] = useState<Report | null>(null), [status, setStatus] = useState('loading')
  const [days, setDays] = useState(28), [platform, setPlatform] = useState<Platform>('app')
  const [section, setSection] = useState('overview'), [busy, setBusy] = useState(false)
  const [search, setSearch] = useState(''), [sort, setSort] = useState('views'), [metric, setMetric] = useState<'activeUsers' | 'sessions'>('activeUsers')
  const [loginError, setLoginError] = useState(''), [message, setMessage] = useState('')
  const abort = useRef<AbortController | null>(null)
  const load = useCallback(async () => {
    abort.current?.abort(); const controller = new AbortController(); abort.current = controller
    setBusy(true); setStatus('loading'); setData(null)
    try {
      const response = await fetch(`/api/analytics?days=${days}&platform=${platform}`, { signal: controller.signal, cache: 'no-store' })
      const body = await response.json()
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
    const rows: (string | number)[][] = [['TMT Insights', data.source, data.start, data.end, platform, data.timezone], ['date', 'active_users', 'new_users', 'sessions', 'screen_views', 'engagement_seconds'], ...data.daily.map(d => [d.date, d.activeUsers, d.newUsers, d.sessions, d.screenPageViews, d.userEngagementDuration]), [], ['screen', 'users', 'views', 'foreground_seconds'], ...data.screens.map(d => [d.name, d.users, d.views, d.seconds]), [], ['cohort_start', 'cohort_end', 'users', 'D1', 'D7', 'D30'], ...data.cohorts.map(c => [c.start, c.end, c.users, c.days[1] ?? '', c.days[7] ?? '', c.days[30] ?? ''])]
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = `tmt-insights-${platform}-${data.start}-${data.end}.csv`; a.click(); URL.revokeObjectURL(url); setMessage('선택한 기간의 실제 데이터를 CSV로 내보냈습니다.')
  }
  const visible = (id: string) => section === 'overview' || section === id
  const filteredScreens = (data?.screens ?? []).filter(row => `${screenLabels[row.name] ?? ''} ${row.name}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'duration' ? (divide(b.seconds, b.users) ?? 0) - (divide(a.seconds, a.users) ?? 0) : b.views - a.views)
  const stateText: Record<string, [string, string]> = {
    NOT_CONFIGURED: ['Firebase 보고서 연결을 준비하고 있어요', 'Google Analytics 속성과 읽기 권한을 연결하면 실제 앱 데이터가 표시됩니다.'],
    UNAVAILABLE: ['데이터를 가져오지 못했어요', 'Google Analytics 연결과 서버 설정을 확인한 후 다시 시도해주세요.'],
    FORBIDDEN: ['관리자 권한이 필요해요', 'TMT 관리자 계정으로 로그인해주세요.'],
  }
  return <div className={s.app}>
    <a href="#dashboard-content" className={s.skip}>본문으로 건너뛰기</a>
    <aside className={s.sidebar}>
      <a className={s.brand} href="/admin/analytics"><img src="/tmt-logo.png" alt="TMT" width="42" height="31" /><span>insights<span className={s.brandDot}>.</span></span></a>
      <div className={s.workspace}><span className={s.workspaceIcon}>t</span><div><strong>Taste My Taste</strong><span>Product analytics</span></div><span className={s.workspaceChevron}>⌄</span></div>
      <p className={s.navLabel}>WORKSPACE</p>
      <nav aria-label="분석 메뉴">{sections.map(item => <button key={item.id} className={section === item.id ? s.navActive : ''} onClick={() => { setSection(item.id); document.getElementById('dashboard-content')?.focus() }} aria-current={section === item.id ? 'page' : undefined}><Icon name={item.icon} />{item.label}{item.id === 'overview' && <span className={s.navTag}>01</span>}</button>)}</nav>
      <div className={s.sidebarBottom}><div className={s.connection}><span className={data ? s.greenDot : s.grayDot} /><div><strong>Firebase Analytics</strong><p>{data ? '실제 데이터 연결됨' : '연결 상태 확인 중'}</p></div><Icon name="activity" size={17} /></div><a href="/" className={s.backLink}>TMT 웹으로 돌아가기 <Icon name="arrow" size={16} /></a><div className={s.profile}><span>TM</span><div><strong>TMT Workspace</strong><small>관리자 전용</small></div>{data && <button onClick={logout} aria-label="로그아웃">↪</button>}</div></div>
    </aside>
    <main className={s.main} id="dashboard-content" tabIndex={-1}>
      <div className={s.topbar}><span>Workspace <span>/</span> Analytics</span><div><span className={s.private}><Icon name="lock" size={13} /> Private workspace</span><span className={s.avatar}>T</span>{data && <button className={s.logout} onClick={logout} disabled={busy}>로그아웃</button>}</div></div>
      <div className={s.content}>
        <header className={s.pageHeader}><div><p className={s.eyebrow}>TMT PRODUCT ANALYTICS</p><h1>{sections.find(i => i.id === section)?.label}<span className={s.titleDot}>.</span></h1><p>사용자가 머무는 순간부터, 다시 돌아오는 이유까지.</p></div><button className={s.export} onClick={exportCsv} disabled={!data}><Icon name="download" size={17} /> 리포트 내보내기</button></header>
        <div className={s.filters}><div className={s.platforms} role="group" aria-label="플랫폼">{([['app', '전체 앱'], ['ios', 'iOS'], ['android', 'Android'], ['web', 'Web']] as const).map(([value, label]) => <button key={value} aria-pressed={platform === value} className={platform === value ? s.platformOn : ''} onClick={() => setPlatform(value)}>{label}</button>)}</div><div className={s.filterRight}><span className={s.timezone}>{data?.timezone ?? '속성 시간대 기준'}</span><label className={s.dateSelect}><span className={s.srOnly}>조회 기간</span><select value={days} onChange={e => setDays(Number(e.target.value))}><option value={7}>최근 7일</option><option value={28}>최근 28일</option><option value={90}>최근 90일</option></select></label><button className={s.refresh} onClick={load} disabled={busy} aria-label="데이터 새로고침"><Icon name="refresh" size={17} /></button></div></div>
        {status === 'AUTH_REQUIRED' && <section className={s.loginPanel}><div><span className={s.eyebrow}>YOUR PRODUCT, IN FOCUS</span><h2>진짜 사용자의<br />이야기를 만나보세요.</h2><p>앱의 성장과 사용자 경험을 한곳에서.<br />TMT 관리자 계정으로 시작하세요.</p><div className={s.loginFeatures}><span>01 <strong>활성 사용자</strong></span><span>02 <strong>코호트 리텐션</strong></span><span>03 <strong>화면 체류시간</strong></span></div></div><form onSubmit={login}><span className={s.loginLock}><Icon name="lock" size={24} /></span><h3>워크스페이스 로그인</h3><p>기존 TMT 관리자 계정을 사용합니다.</p><label>이메일<input type="email" name="email" autoComplete="username" placeholder="admin@tmt.com" required /></label><label>비밀번호<input type="password" name="password" autoComplete="current-password" placeholder="비밀번호를 입력하세요" required /></label>{loginError && <p role="alert" className={s.error}>{loginError}</p>}<button className={s.primary} disabled={busy}>{busy ? '확인 중…' : '대시보드 열기'} <span>→</span></button><small>보고서는 관리자에게만 공개됩니다.</small></form></section>}
        {status === 'loading' && <div className={s.loading} role="status"><span /> 실제 분석 데이터를 불러오는 중입니다…</div>}
        {stateText[status] && <section className={s.statePanel}><Empty text={stateText[status][0]} sub={stateText[status][1]} /><button className={s.primary} onClick={status === 'FORBIDDEN' ? logout : load}>{status === 'FORBIDDEN' ? '다른 계정으로 로그인' : '다시 확인'}</button><a href="https://console.firebase.google.com/project/tmt-product-analytics/overview" target="_blank" rel="noreferrer">Firebase 콘솔 열기 ↗</a></section>}
        {data && <>
          <div className={s.dataNote}><span><span className={s.greenDot} /> 실제 앱 데이터 <b>·</b> {data.start.replaceAll('-', '.')} — {data.end.replaceAll('-', '.')}</span><small>{new Date(data.fetchedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 조회 · 일별 보고서 지연 반영</small></div>
          {data.warnings.map(w => <p key={w} className={s.warning} role="status">{w}</p>)}
          {visible('overview') && <>
            <div className={s.metrics}>
              <article className={s.metric}><div>활성 사용자 <Icon name="activity" size={17} /></div><strong>{number(data.totals.activeUsers)}<small>명</small></strong><Delta now={data.totals.activeUsers} before={data.previous.activeUsers} /><div className={s.metricFoot}>신규 사용자 <b>{number(data.totals.newUsers)}명</b></div></article>
              <article className={s.metric}><div>방문 세션 <Icon name="grid" size={17} /></div><strong>{number(data.totals.sessions)}<small>회</small></strong><Delta now={data.totals.sessions} before={data.previous.sessions} /><div className={s.metricFoot}>참여 세션 비율 <b>{percent(data.totals.engagementRate)}</b></div></article>
              <article className={s.metric}><div>세션당 활성 체류시간 <Icon name="screen" size={17} /></div><strong className={s.timeValue}>{duration(divide(data.totals.userEngagementDuration, data.totals.sessions))}</strong><Delta now={divide(data.totals.userEngagementDuration, data.totals.sessions) ?? undefined} before={divide(data.previous.userEngagementDuration, data.previous.sessions) ?? undefined} /><div className={s.metricFoot}>백그라운드 시간 제외</div></article>
              <article className={`${s.metric} ${s.retentionMetric}`}><div>D7 리텐션 <Icon name="repeat" size={17} /></div><strong>{percent(weightedRetention(data.cohorts, 7))}</strong><span className={s.muted}>관찰 완료 코호트 가중 평균</span><div className={s.metricFoot}>첫 방문 7일 후 재방문율 <span>↗</span></div></article>
            </div>
            <div className={s.primaryGrid}><section className={s.card}><div className={s.cardHeader}><div><h2>사용자의 발자취</h2><p>앱을 찾는 흐름을 살펴보세요.</p></div><div className={s.chartToggle}><button aria-pressed={metric === 'activeUsers'} onClick={() => setMetric('activeUsers')}>활성 사용자</button><button aria-pressed={metric === 'sessions'} onClick={() => setMetric('sessions')}>세션</button></div></div><Trend data={data} metric={metric} /></section>
              <section className={`${s.card} ${s.liveCard}`}><div className={s.cardHeader}><h2>지금의 TMT</h2><span className={s.liveBadge}><span className={s.greenDot} /> LIVE</span></div><p>최근 30분 활성 사용자</p><div className={s.liveNumber}>{number(data.realtime)}<span>명</span></div><div className={s.activeRows}>{[['DAU', '어제', data.active.day], ['WAU', '지난 7일', data.active.week], ['MAU', '지난 30일', data.active.month]].map(([label, description, value]) => <div key={label}><span><b>{label}</b><small>{description}</small></span><strong>{number(Number(value))}<small>명</small></strong></div>)}</div><p className={s.liveHint}>일별 지표는 어제까지 · 새로고침 시 갱신</p></section></div>
          </>}
          {visible('retention') && <section className={s.card} id="retention"><div className={s.cardHeader}><div><span className={s.sectionNumber}>01 / RETENTION</span><h2>다시 돌아오는 취향</h2><p>첫 방문 주차별 리텐션 · 최근 8주 코호트</p></div><span className={s.softBadge}>첫 방문 기준</span></div><div className={s.retentionSummary}>{[1, 7, 30].map(day => <div key={day}><span>DAY {day}</span><strong>{percent(weightedRetention(data.cohorts, day))}</strong><p>{day}일 후 재방문</p></div>)}</div><div className={s.tableWrap}><table className={s.cohortTable}><thead><tr><th>첫 방문 코호트</th><th>사용자</th>{[0, 1, 7, 14, 30].map(day => <th key={day}>Day {day}</th>)}</tr></thead><tbody>{data.cohorts.map(c => <tr key={c.start}><td>{c.start.slice(5).replace('-', '.')} — {c.end.slice(5).replace('-', '.')}</td><td>{number(c.users)}명</td>{[0, 1, 7, 14, 30].map(day => <td key={day}><span className={s.heatCell} style={c.days[day] == null ? undefined : { background: `rgba(207,247,48,${.08 + c.days[day]! * .65})`, color: c.days[day]! > .5 ? '#10150a' : '#e4efc3' }} title={c.days[day] == null ? '관찰 기간 미완료, 데이터 없음 또는 보호 기준 적용' : `첫 방문 ${day}일 후 활성 사용자 비율`}>{c.days[day] == null ? '—' : percent(c.days[day])}</span></td>)}</tr>)}</tbody></table></div><div className={s.tableFooter}><span>— 관찰 대기 또는 데이터 없음 · 누적 재방문율이 아닌 해당 일자 재방문율</span><span className={s.legend}>낮음 <i /><i /><i /><i /> 높음</span></div></section>}
          {visible('screens') && <section className={s.card} id="screens"><div className={s.cardHeader}><div><span className={s.sectionNumber}>02 / SCREEN ENGAGEMENT</span><h2>어떤 화면에 머무를까요?</h2><p>화면별 조회와 실제 활성 체류시간</p></div><label className={s.search}><span className={s.srOnly}>화면 검색</span><input placeholder="화면 검색…" value={search} onChange={e => setSearch(e.target.value)} /></label></div><div className={s.screenTools}><span>{filteredScreens.length}개 화면</span><label>정렬 <select value={sort} onChange={e => setSort(e.target.value)}><option value="views">조회수 높은 순</option><option value="duration">사용자당 체류시간 순</option></select></label></div>{filteredScreens.length ? <div className={s.tableWrap}><table className={s.screenTable}><thead><tr><th>화면</th><th>조회수</th><th>활성 사용자</th><th>사용자당 활성 체류</th><th>조회 비중</th></tr></thead><tbody>{filteredScreens.map((row, i) => <tr key={row.name}><td><span className={s.rank}>{String(i + 1).padStart(2, '0')}</span><span><strong>{screenLabels[row.name] ?? row.name}</strong><small>{row.name}</small></span></td><td>{number(row.views)}</td><td>{number(row.users)}</td><td>{duration(divide(row.seconds, row.users))}</td><td><div className={s.miniBar}><span style={{ width: `${Math.min(100, (divide(row.views, data.totals.screenPageViews) ?? 0) * 100)}%` }} /></div><span>{percent(divide(row.views, data.totals.screenPageViews))}</span></td></tr>)}</tbody></table></div> : <Empty text={search ? '검색 결과가 없습니다' : undefined} sub={search ? '다른 화면 이름으로 검색해보세요.' : undefined} />}<div className={s.tableFooter}>체류시간 = 해당 화면의 포그라운드 시간 합계 ÷ 활성 사용자 · 조회당 평균과 다릅니다.</div></section>}
          {visible('events') && <section className={s.card} id="events"><div className={s.cardHeader}><div><span className={s.sectionNumber}>03 / PRODUCT ACTIVITY</span><h2>취향이 행동이 되는 순간</h2><p>실제로 발생한 이벤트 · 각 행동은 독립 집계됩니다.</p></div><span className={s.softBadge}>{number(data.events.reduce((a, b) => a + b.count, 0))} events</span></div>{data.events.length ? <div className={s.eventGrid}>{data.events.map(event => <article key={event.name}><span className={s.eventDot} /><div><strong>{eventLabels[event.name] ?? event.name}</strong><small>{event.name}</small></div><div><b>{number(event.count)}</b><small>{number(event.users)}명</small></div></article>)}</div> : <Empty />}<div className={s.tableFooter}>공유 시트 열기는 공유 완료가 아닙니다. 행동별 사용자 수를 순차 전환율로 해석하지 않습니다.</div></section>}
          {visible('definitions') && <section className={s.card} id="definitions"><div className={s.cardHeader}><div><span className={s.sectionNumber}>DATA, WITH CONTEXT</span><h2>숫자를 이해하는 기준</h2></div><Icon name="book" /></div><div className={s.definitions}><article><h3>활성 사용자와 방문</h3><p>GA4의 활성 사용자와 세션 정의를 사용합니다. DAU·WAU·MAU는 어제까지 1·7·30일의 고유 활성 사용자이며 합산 값이 아닙니다.</p></article><article><h3>리텐션과 관찰 기간</h3><p>첫 방문 주차에 속한 사용자가 D1·D7·D30에 다시 활동한 비율입니다. 코호트 전체의 관찰 기간이 끝나야 표시하며, 데이터가 없으면 0%로 추정하지 않습니다.</p></article><article><h3>화면에서 보낸 시간</h3><p>Firebase가 측정한 포그라운드 참여시간입니다. 세션당·사용자당 평균을 구분하며 앱이 백그라운드에 있는 시간은 포함하지 않습니다.</p></article><article><h3>수집 이후의 실제 데이터</h3><p>Firebase가 연결된 앱 버전부터 수집합니다. 과거 이용 기록을 복원하거나 샘플 값으로 채우지 않습니다. 일별 보고서는 처리 지연이 있으며 실시간 지표와 다를 수 있습니다.</p></article></div></section>}
        </>}
        <div className={s.bottomLine}><span>TASTE MY TASTE <b>×</b> INSIGHTS</span><span>실제 행동에서 시작하는 더 나은 경험.</span></div>
        <p className={s.statusMessage} role="status">{message}</p>
      </div>
    </main>
  </div>
}

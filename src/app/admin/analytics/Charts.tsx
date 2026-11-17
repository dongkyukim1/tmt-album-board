'use client'
import { Fragment, useState, type ReactNode } from 'react'
import { dailyPoints, dayOffset, divide, duration, editorStages, hourlyGrid, linePath, niceMax, number, percent } from '@/lib/analytics/chart'
import { dateShift } from '@/lib/analytics/report'
import { eventLabels, screenLabels, type Report } from '@/lib/analytics/types'
import s from './dashboard.module.css'

export function Empty({ text = '아직 수집된 데이터가 없습니다', sub = '연결된 앱에서 활동이 발생하면 이곳에 표시됩니다.' }: { text?: string; sub?: string }) {
  return <div className={s.empty}><strong>{text}</strong><p>{sub}</p></div>
}
export function Heading({ children, detail }: { children: ReactNode; detail: string }) {
  return <h3 className={s.sectionHeading}><span>{children}</span><b>{detail}</b></h3>
}
export function Delta({ now, before }: { now?: number | null; before?: number | null }) {
  if (now == null || !before) return <span className={s.muted}>비교 데이터 없음</span>
  const delta = (now - before) / before
  return <span className={delta >= 0 ? s.positive : s.negative}>{delta >= 0 ? '↗' : '↘'} {Math.abs(delta * 100).toFixed(1)}%</span>
}
export function Spark({ values, color = 'var(--primary)', label }: { values: (number | null)[]; color?: string; label: string }) {
  const known = values.filter((v): v is number => v != null)
  if (!known.length) return <span className={s.muted}>—</span>
  const min = Math.min(...known), span = Math.max(1, Math.max(...known) - min)
  const points = values.flatMap((v, i) => v == null ? [] : [{ x: 2 + i / Math.max(1, values.length - 1) * 92, y: 37 - (v - min) / span * 31, day: i }])
  return <svg viewBox="0 0 96 40" className={s.spark} role="img" aria-label={label}><path d={linePath(points)} fill="none" stroke={color} strokeWidth="1.5" />{points.length === 1 && <circle cx={points[0].x} cy={points[0].y} r="2" fill={color} />}</svg>
}
export function Ring({ value }: { value: number }) {
  return <svg viewBox="0 0 60 60" className={s.ring} role="img" aria-label={`참여율 ${percent(value)}`}><circle cx="30" cy="30" r="24" className={s.ringTrack} /><circle cx="30" cy="30" r="24" fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" pathLength="100" strokeDasharray={`${value * 100} 100`} transform="rotate(-90 30 30)" /></svg>
}
export function Trend({ data }: { data: Report }) {
  const [hover, setHover] = useState<number | null>(null)
  if (!data.daily.length) return <Empty />
  const max = niceMax(Math.max(...data.daily.map(d => d.activeUsers), ...data.previousDaily.map(d => d.activeUsers)))
  const span = dayOffset(data.end, data.start), previousStart = dateShift(data.start, -span - 1)
  const points = dailyPoints(data.daily, data.start, span, max, 'activeUsers')
  const previous = dailyPoints(data.previousDaily, previousStart, span, max, 'activeUsers')
  const sessions = dailyPoints(data.daily, data.start, span, Math.max(1, ...data.daily.map(d => d.sessions)), 'sessions')
  // Close each contiguous segment separately, so absent dates never acquire an invented area.
  const segments: typeof points[] = []
  points.forEach((point, i) => { if (!i || point.day !== points[i - 1].day + 1) segments.push([]); segments.at(-1)!.push(point) })
  const selected = hover == null ? null : data.daily[hover]
  return <div className={s.trend}>
    <div className={s.legend}><span><i />활성 사용자</span><span><i className={s.dotted} />세션 · 정규화</span><span><i className={s.previous} />이전 동기간</span></div>
    <svg viewBox="0 0 680 250" role="img" aria-label={`${data.start}부터 ${data.end}까지 일별 활성 사용자, 이전 기간 및 정규화된 세션 추이`}>
      {[0, .25, .5, .75, 1].map(n => <g key={n}><line x1="38" x2="652" y1={210 - n * 180} y2={210 - n * 180} className={s.gridLine} /><text x="29" y={214 - n * 180} textAnchor="end">{number(n * max)}</text></g>)}
      {segments.map((segment, i) => <path key={i} d={`${linePath(segment)} L${segment.at(-1)!.x},210 L${segment[0].x},210 Z`} fill="var(--lime-tint)" />)}
      <path d={linePath(previous)} fill="none" stroke="var(--ink-3)" strokeWidth="1.4" />
      <path d={linePath(sessions)} fill="none" stroke="var(--ink-2)" strokeDasharray="3 4" strokeWidth="1.4" />
      <path d={linePath(points)} fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinejoin="round" />
      {points.map((p, i) => <g key={data.daily[i].date} tabIndex={0} role="button" aria-label={`${data.daily[i].date}, 활성 사용자 ${number(data.daily[i].activeUsers)}명, 세션 ${number(data.daily[i].sessions)}회`} onFocus={() => setHover(i)} onBlur={() => setHover(null)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHover(i) } }}>
        <rect x={p.x - 7} y="25" width="14" height="190" fill="transparent" />
        <circle cx={p.x} cy={p.y} r={hover === i || i === points.length - 1 ? 4 : 1.5} fill="var(--primary)" />
      </g>)}
      {[0, .25, .5, .75, 1].map((n, i) => <text key={i} x={38 + n * 614} y="238" textAnchor="middle">{dateShift(data.start, Math.round(span * n)).slice(5).replace('-', '.')}</text>)}
    </svg>
    <p className={s.chartCaption} aria-live="polite">{selected ? `${selected.date} · 활성 ${number(selected.activeUsers)}명 · 세션 ${number(selected.sessions)}회` : '세션은 자체 최댓값으로 정규화 · 누락 일자는 연결하지 않음'}</p>
    <details className={s.chartData}><summary>일별 데이터 표 보기</summary><div className={s.tableWrap}><table><thead><tr><th>날짜</th><th>활성 사용자</th><th>세션</th></tr></thead><tbody>{data.daily.map(d => <tr key={d.date}><td>{d.date}</td><td>{number(d.activeUsers)}</td><td>{number(d.sessions)}</td></tr>)}</tbody></table></div></details>
  </div>
}
export function Cohorts({ data }: { data: Report }) {
  const days = [1, 3, 7, 14, 30], cohorts = data.cohorts.slice(-4)
  return <><Heading detail="첫 방문 주 기준 · D-곡선">코호트 리텐션</Heading><div className={s.tableWrap}><table className={s.cohort}><thead><tr><th>첫 방문 주</th>{days.map(day => <th key={day}>D{day}</th>)}<th>재방문 추이</th></tr></thead><tbody>{cohorts.map((c, i) => {
    const path = days.map((day, j) => c.days[day] == null ? '' : `${j && c.days[days[j - 1]] != null ? 'L' : 'M'}${4 + day / 30 * 92},${35 - c.days[day]! * 30}`).join(' ')
    return <tr key={c.start}><th scope="row">{c.start.slice(5).replace('-', '.')}<small>{number(c.users)}명</small></th>{days.map(day => <td key={day}><span className={c.days[day] == null ? s.heatMissing : s.heatCell} style={c.days[day] == null ? undefined : { background: `rgb(from var(--primary) r g b / ${.06 + Math.min(1, c.days[day]!) * .9})`, color: c.days[day]! > .45 ? 'var(--bg)' : 'var(--txt)' }} title={c.days[day] == null ? '데이터 없음: 관찰 기간 미완료, 누락 또는 보호 기준 적용' : `첫 방문 ${day}일 후 재방문 ${percent(c.days[day])}`}>{c.days[day] == null ? '—' : `${Math.round(c.days[day]! * 100)}%`}</span></td>)}<td><svg viewBox="0 0 100 40" className={s.cohortCurve} role="img" aria-label={`${c.start} 코호트 D1·D3·D7·D14·D30 재방문율, 없는 값은 연결하지 않음`}><path d={path} fill="none" stroke={i === 0 ? 'var(--primary)' : 'var(--ink-2)'} strokeWidth="1.5" />{days.map(day => c.days[day] == null ? null : <circle key={day} cx={4 + day / 30 * 92} cy={35 - c.days[day]! * 30} r="2" fill={i === 0 ? 'var(--primary)' : 'var(--ink-2)'} />)}</svg></td></tr>
  })}</tbody></table></div><p className={s.note}>최근 4주 · — 관찰 대기 또는 데이터 없음 · 해당 일자 재방문율</p></>
}
export function ScreenBars({ data }: { data: Report }) {
  const rows = data.screens.filter(r => r.users > 0).sort((a, b) => b.seconds / b.users - a.seconds / a.users).slice(0, 6)
  const max = Math.max(1, ...rows.map(r => r.seconds / r.users))
  return <><Heading detail="사용자당 · m:ss">화면별 평균 체류</Heading>{!rows.length ? <Empty /> : <div className={s.hbars}>{rows.map((r, i) => <div key={r.name}><span>{screenLabels[r.name] ?? r.name}</span><svg viewBox="0 0 200 22" preserveAspectRatio="none" role="img" aria-label={`${screenLabels[r.name] ?? r.name} 평균 체류 ${duration(r.seconds / r.users)}`}><rect width="200" height="22" rx="3" fill="var(--hairline)" /><rect width={r.seconds / r.users / max * 200} height="22" rx="3" fill={i === 0 ? 'var(--primary)' : 'var(--ink-3)'} /></svg><b>{duration(r.seconds / r.users)}</b></div>)}</div>}<p className={s.note}>포그라운드 참여시간 합계 ÷ 해당 화면 활성 사용자</p></>
}
export function Hours({ data }: { data: Report }) {
  const max = Math.max(1, ...data.hourly.map(r => r.sessions)), labels = ['월', '화', '수', '목', '금', '토', '일']
  return <><Heading detail="세션 수 · 속성 시간대">요일 × 시간대</Heading>{!data.hourly.length ? <Empty sub="집계된 시간대별 세션이 아직 없습니다." /> : <div className={s.tableWrap}><div className={s.hours}>{hourlyGrid(data).map((row, i) => <Fragment key={i}><span className={s.dayLabel}>{labels[i]}</span>{row.map(cell => <span key={cell.hour} className={cell.sessions == null ? s.hourMissing : s.hourCell} tabIndex={0} aria-label={`${labels[i]}요일 ${cell.hour}시, ${cell.sessions == null ? '데이터 없음' : `${number(cell.sessions)} 세션`}`} title={`${labels[i]} ${cell.hour}:00 · ${cell.sessions == null ? '데이터 없음' : `${number(cell.sessions)} 세션`}`} style={cell.sessions == null ? undefined : { background: `rgb(from var(--primary) r g b / ${.06 + cell.sessions / max * .9})` }} />)}</Fragment>)}<span />{Array.from({ length: 24 }, (_, i) => <span key={i} className={s.hourLabel}>{i % 3 === 0 ? String(i).padStart(2, '0') : ''}</span>)}</div></div>}<p className={s.note}>{data.timezone} · 선택 기간 합계 · 셀에 초점을 맞추면 세션 수 표시</p></>
}
export function Distribution({ data }: { data: Report }) {
  const bins = data.durationDistribution, total = bins?.reduce((n, b) => n + b.sessions, 0) ?? 0
  const max = niceMax(Math.max(1, ...(bins ?? []).map(b => b.sessions / (total || 1) * 100)))
  return <><Heading detail="세션 기준">세션 체류시간 분포</Heading>{bins && total ? <svg className={s.histogram} viewBox="0 0 460 175" role="img" aria-label={`세션 체류시간 분포: ${bins.map(b => `${b.label} ${percent(b.sessions / total)}`).join(', ')}`}>
    {[0, .5, 1].map(n => <g key={n}><line x1="32" x2="454" y1={140 - n * 120} y2={140 - n * 120} className={s.gridLine} /><text x="27" y={144 - n * 120} textAnchor="end">{Math.round(n * max)}%</text></g>)}
    {bins.map((b, i) => { const h = b.sessions / total * 100 / max * 120; return <g key={b.label}><rect x={42 + i * 69} y={140 - h} width="48" height={h} rx="3" fill={i === 3 ? 'var(--primary)' : 'var(--ink-3)'} /><text x={66 + i * 69} y="163" textAnchor="middle">{b.label}</text></g> })}
  </svg> : <div className={s.distributionPending}><span>세션당 평균 활성 체류</span><strong>{duration(divide(data.totals.userEngagementDuration, data.totals.sessions))}</strong><p>구간 분포는 준비 중</p><small>세션별 체류 구간이 집계되면 여기에 표시됩니다.</small></div>}</>
}
export function Funnel({ data }: { data: Report }) {
  const stages = editorStages(data.events), max = Math.max(1, ...stages.map(e => e.users ?? 0))
  return <><Heading detail="각 행동의 사용자 수">에디터 퍼널</Heading><div className={s.funnel}>{stages.map((e, i) => <div key={e.name}><b>{number(e.users)}</b><span className={s.funnelPlot}><svg viewBox="0 0 100 110" preserveAspectRatio="none" role="img" aria-label={`${eventLabels[e.name]} ${e.users == null ? '집계 없음' : `${number(e.users)}명`}`}><rect x="0" y={110 - (e.users ?? 0) / max * 110} width="100" height={(e.users ?? 0) / max * 110} rx="3" fill={i === 0 ? 'var(--primary)' : 'var(--ink-3)'} /></svg></span><span>{eventLabels[e.name]}</span><small>{i ? `이전 행동 대비 ${percent(e.ratio)}` : '시작 행동'}</small></div>)}</div><p className={s.note}>행동별 독립 집계 비율이며 순차 전환율이 아닙니다. — 집계 없음</p></>
}
export function Platforms({ data }: { data: Report }) {
  const rows = [...data.platforms].sort((a, b) => a.name.toLowerCase() === 'ios' ? -1 : b.name.toLowerCase() === 'ios' ? 1 : b.users - a.users)
  const total = rows.reduce((n, r) => n + r.users, 0), colors = (name: string) => name.toLowerCase() === 'ios' ? 'var(--primary)' : name.toLowerCase() === 'android' ? 'var(--txt)' : 'var(--ink-3)'
  const offsets = rows.map((_, i) => rows.slice(0, i).reduce((n, r) => n + r.users, 0) / total * 100)
  return <><Heading detail="활성 사용자 구성">플랫폼</Heading>{!total ? <Empty /> : <div className={s.platformChart}><svg viewBox="0 0 120 120" role="img" aria-label={rows.map(r => `${r.name} ${percent(r.users / total)}`).join(', ')}>{rows.map((r, i) => <circle key={r.name} cx="60" cy="60" r="49" fill="none" stroke={colors(r.name)} strokeWidth="10" pathLength="100" strokeDasharray={`${r.users / total * 100} 100`} strokeDashoffset={-offsets[i]} transform="rotate(-90 60 60)" />)}<text className={s.donutValue} x="60" y="64" textAnchor="middle">{Math.round(Math.max(...rows.map(r => r.users)) / total * 100)}%</text><text x="60" y="82" textAnchor="middle">{rows.reduce((a, b) => a.users >= b.users ? a : b).name}</text></svg><ul>{rows.map(r => <li key={r.name}><i style={{ background: colors(r.name) }} /><span>{r.name}</span><b>{percent(r.users / total)}</b></li>)}</ul></div>}<p className={s.note}>플랫폼별 활성 사용자 합계 기준 · 플랫폼 간 중복 가능</p></>
}
export function Events({ data }: { data: Report }) {
  const rows = [...data.events].sort((a, b) => b.count - a.count).slice(0, 4), max = Math.max(1, ...rows.map(e => e.count))
  return <><Heading detail="발생 횟수 · 상위 4개">주요 이벤트</Heading>{!rows.length ? <Empty /> : <div className={s.hbars}>{rows.map((e, i) => <div key={e.name}><span>{eventLabels[e.name] ?? e.name}</span><svg viewBox="0 0 200 18" preserveAspectRatio="none" role="img" aria-label={`${eventLabels[e.name] ?? e.name} ${number(e.count)}회`}><rect width={e.count / max * 200} height="18" rx="3" fill={i === 0 ? 'var(--primary)' : 'var(--ink-3)'} /></svg><b>{number(e.count)}</b></div>)}</div>}</>
}

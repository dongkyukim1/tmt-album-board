'use client'

import { useCallback, useEffect, useState } from 'react'
import styles from './reports.module.css'
import {
  AdminApiError,
  REASON_LABEL,
  STATUS_LABEL,
  TARGET_LABEL,
  accessToken,
  fetchReports,
  resolveReport,
  type AdminReport,
  type ReportStatus,
} from '@/lib/admin-reports-api'

type Filter = ReportStatus | null
type View =
  | { kind: 'loading' }
  | { kind: 'signin' }
  | { kind: 'forbidden' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; items: AdminReport[]; cursor: string | null }

const FILTERS: Filter[] = ['open', 'resolved', 'dismissed', null]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60_000))}분 전`
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

/** 접수 24시간이 지난 미처리 신고 — 이용약관 제9조 검토 기한 초과. */
function overdue(r: AdminReport): boolean {
  return r.status === 'open' && Date.now() - new Date(r.createdAt).getTime() > 24 * 3_600_000
}

/**
 * 신고 관리(운영자 전용, /admin/reports). 웹 로그인(admin@tmt.com) 토큰으로
 * 미처리 신고를 보고 '숨기기'(콘텐츠 내림) 또는 '문제 없음'(종료)으로 처리한다.
 */
export default function AdminReportsPage() {
  const [filter, setFilter] = useState<Filter>('open')
  const [view, setView] = useState<View>({ kind: 'loading' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const toView = (e: unknown): View =>
    e instanceof AdminApiError && e.status === 401
      ? { kind: 'signin' }
      : e instanceof AdminApiError && e.status === 403
        ? { kind: 'forbidden' }
        : { kind: 'error', message: e instanceof Error ? e.message : '불러오지 못했어요' }

  const load = useCallback(async () => {
    if (!accessToken()) return setView({ kind: 'signin' })
    setView({ kind: 'loading' })
    try {
      const page = await fetchReports(filter)
      setView({ kind: 'ready', items: page.items, cursor: page.nextCursor })
    } catch (e) {
      setView(toView(e))
    }
  }, [filter])

  useEffect(() => {
    void load()
  }, [load])

  async function more() {
    if (view.kind !== 'ready' || !view.cursor) return
    setLoadingMore(true)
    try {
      const page = await fetchReports(filter, view.cursor)
      setView({ kind: 'ready', items: [...view.items, ...page.items], cursor: page.nextCursor })
    } catch (e) {
      setView(toView(e))
    } finally {
      setLoadingMore(false)
    }
  }

  async function resolve(r: AdminReport, hide: boolean) {
    const target = TARGET_LABEL[r.targetType]
    const ok = window.confirm(
      hide ? `신고된 ${target}을(를) 숨기고 처리 완료할까요?` : '조치 없이 종료할까요?',
    )
    if (!ok) return
    setBusyId(r.id)
    try {
      await resolveReport(r.id, hide)
      await load()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '처리하지 못했어요')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <h1 className={styles.h1}>신고 관리</h1>
        <p className={styles.lead}>접수 후 24시간 안에 검토해요 (이용약관 제9조).</p>

        <div className={styles.segments} role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f ?? 'all'}
              role="tab"
              aria-selected={filter === f}
              className={`${styles.seg} ${filter === f ? styles.segOn : ''}`}
              onClick={() => setFilter(f)}
            >
              {f ? STATUS_LABEL[f] : '전체'}
            </button>
          ))}
        </div>

        {view.kind === 'loading' ? <div className={styles.note}>불러오는 중…</div> : null}
        {view.kind === 'signin' ? (
          <div className={styles.empty}>
            <h2>운영자 계정으로 로그인해 주세요</h2>
            <a href="/" className={`btn-primary ${styles.cta}`}>
              로그인하러 가기
            </a>
          </div>
        ) : null}
        {view.kind === 'forbidden' ? (
          <div className={styles.empty}>
            <h2>운영자만 볼 수 있어요</h2>
          </div>
        ) : null}
        {view.kind === 'error' ? (
          <div className={styles.empty}>
            <h2>불러오지 못했어요</h2>
            <p>{view.message}</p>
            <button className={`btn-primary ${styles.cta}`} onClick={() => void load()}>
              다시 시도
            </button>
          </div>
        ) : null}

        {view.kind === 'ready' && view.items.length === 0 ? (
          <div className={styles.empty}>
            <h2>{filter === 'open' ? '검토할 신고가 없어요' : '신고 내역이 없어요'}</h2>
          </div>
        ) : null}

        {view.kind === 'ready' && view.items.length > 0 ? (
          <>
            <div className={styles.list}>
              {view.items.map((r) => (
                <article key={r.id} className={styles.card}>
                  <div className={styles.top}>
                    <span className={r.status === 'open' ? styles.titleOpen : styles.title}>
                      {REASON_LABEL[r.reason]} · {TARGET_LABEL[r.targetType]}
                    </span>
                    <span className={overdue(r) ? styles.overdue : styles.meta}>
                      {STATUS_LABEL[r.status]} · {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <div className={styles.meta}>
                    대상 {r.targetUser?.nickname ?? '탈퇴한 사용자'} · 신고 {r.reporter.nickname}
                  </div>
                  <p className={styles.snippet}>{r.targetSnippet ?? '(이미 삭제된 콘텐츠)'}</p>
                  {r.detail ? <p className={styles.detail}>신고 내용: {r.detail}</p> : null}
                  {r.status === 'open' ? (
                    <div className={styles.actions}>
                      <button
                        className="btn-neutral"
                        disabled={busyId === r.id}
                        onClick={() => void resolve(r, false)}
                      >
                        문제 없음
                      </button>
                      <button
                        className={styles.danger}
                        disabled={busyId === r.id}
                        onClick={() => void resolve(r, true)}
                      >
                        숨기기
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
            {view.cursor ? (
              <button className={`btn-neutral ${styles.more}`} onClick={() => void more()} disabled={loadingMore}>
                {loadingMore ? '불러오는 중…' : '더보기'}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}

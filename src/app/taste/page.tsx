'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './taste.module.css'
import {
  backendConfigured,
  realAdapter,
  verdictForAction,
  type SwipeAction,
  type TasteAdapter,
  type TasteCard,
} from '@/lib/taste-api'
import { mockAdapter } from '@/lib/taste-mock'

type Status = 'loading' | 'ready' | 'empty' | 'error'
type Drag = { dx: number; dy: number; active: boolean }
type LastSwipe = { index: number; action: SwipeAction; card: TasteCard }

const THRESHOLD = 90
const FEED_LIMIT = 20
const FEED_COUNTRY = 'kr'
const NO_DRAG: Drag = { dx: 0, dy: 0, active: false }

/** 드래그 변위를 4방향 액션으로 해석. 임계값 미만이면 null(스냅백). */
function resolveDirection(dx: number, dy: number): SwipeAction | null {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax < THRESHOLD && ay < THRESHOLD) return null
  if (ax >= ay) return dx > 0 ? 'like' : 'dislike'
  return dy < 0 ? 'wish' : 'skip'
}

export default function TastePage() {
  const [adapter] = useState<TasteAdapter>(() =>
    backendConfigured ? realAdapter : mockAdapter,
  )
  const [cards, setCards] = useState<TasteCard[]>([])
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<Status>('loading')
  const [usingMock, setUsingMock] = useState(!backendConfigured)
  const [drag, setDrag] = useState<Drag>(NO_DRAG)
  const [last, setLast] = useState<LastSwipe | null>(null)

  const pointerId = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const loadFeed = useCallback(async () => {
    setStatus('loading')
    setIndex(0)
    setLast(null)
    try {
      let data = await adapter.getFeed({ limit: FEED_LIMIT, country: FEED_COUNTRY })
      if (data.length === 0 && adapter !== mockAdapter) {
        data = await mockAdapter.getFeed({ limit: FEED_LIMIT })
        setUsingMock(true)
      }
      setCards(data)
      setStatus(data.length > 0 ? 'ready' : 'empty')
    } catch (error) {
      console.error('taste feed load failed, falling back to mock:', error)
      try {
        const data = await mockAdapter.getFeed({ limit: FEED_LIMIT })
        setUsingMock(true)
        setCards(data)
        setStatus(data.length > 0 ? 'ready' : 'empty')
      } catch (fallbackError) {
        console.error('taste mock feed failed:', fallbackError)
        setStatus('error')
      }
    }
  }, [adapter])

  useEffect(() => {
    void loadFeed()
  }, [loadFeed])

  const commit = useCallback(
    (action: SwipeAction) => {
      const card = cards[index]
      if (!card) return

      // 'wish'는 verdict=null → swipe 미전송, 위시리스트로만 강신호 기록 (계약).
      const verdict = verdictForAction(action)
      if (verdict) {
        adapter.swipe(card.albumId, verdict).catch((e) => console.error('swipe failed:', e))
      }
      if (action === 'wish') {
        adapter.addWishlist(card.albumId).catch((e) => console.error('wish failed:', e))
      }

      setLast({ index, action, card })
      setIndex((prev) => prev + 1)
      setDrag(NO_DRAG)
    },
    [adapter, cards, index],
  )

  // 되돌리기 1회: 직전 스와이프만 복원. 위시였다면 위시리스트에서도 제거.
  const undo = useCallback(() => {
    if (!last) return
    if (last.action === 'wish') {
      adapter.removeWishlist(last.card.albumId).catch((e) => console.error('undo wish failed:', e))
    }
    setIndex(last.index)
    setLast(null)
    setDrag(NO_DRAG)
  }, [adapter, last])

  const onPointerDown = (e: React.PointerEvent) => {
    if (status !== 'ready') return
    pointerId.current = e.pointerId
    start.current = { x: e.clientX, y: e.clientY }
    setDrag({ dx: 0, dy: 0, active: true })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return
    setDrag({
      dx: e.clientX - start.current.x,
      dy: e.clientY - start.current.y,
      active: true,
    })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return
    pointerId.current = null
    const action = resolveDirection(drag.dx, drag.dy)
    if (action) commit(action)
    else setDrag(NO_DRAG)
  }

  const remaining = cards.length - index
  const current = cards[index]
  const next = cards[index + 1]
  const liveDir = drag.active ? resolveDirection(drag.dx, drag.dy) : null
  const dragProgress = Math.min(1, Math.max(Math.abs(drag.dx), Math.abs(drag.dy)) / THRESHOLD)

  return (
    <div className={styles.screen}>
      <div className={styles.top}>
        <Link href="/" className={styles.brand}>
          TMT
        </Link>
        <span className={styles.count}>
          {status === 'ready' ? `${remaining}장 남음` : ''}
        </span>
      </div>

      <div className={styles.title}>
        <h1>취향찾기</h1>
        <p>커버를 넘기며 취향을 알려줘요. 오른쪽 좋아요 · 왼쪽 별로 · 위로 위시 · 아래 모름.</p>
        {usingMock ? (
          <p className={styles.mockNote}>* 데모 모드: iTunes 인기 앨범으로 미리 체험 중</p>
        ) : null}
      </div>

      {status === 'loading' ? <div className={styles.skel} /> : null}

      {status === 'error' ? (
        <div className={styles.state}>
          <h2>불러오지 못했어요</h2>
          <p>네트워크 상태를 확인하고 다시 시도해 주세요.</p>
          <button className={styles.retry} onClick={() => void loadFeed()}>
            다시 시도
          </button>
        </div>
      ) : null}

      {status === 'empty' || (status === 'ready' && !current) ? (
        <div className={styles.state}>
          <h2>오늘 취향찾기 끝! 👾</h2>
          <p>새로운 앨범을 더 불러올까요?</p>
          <button className={styles.retry} onClick={() => void loadFeed()}>
            더 불러오기
          </button>
        </div>
      ) : null}

      {status === 'ready' && current ? (
        <>
          <div className={styles.stack}>
            {next ? (
              <div className={`${styles.card} ${styles.cardBack}`}>
                {next.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.cardArt} src={next.artworkUrl} alt="" />
                ) : null}
                <div className={styles.cardMeta}>
                  <div className={styles.cardTitle}>{next.title}</div>
                  <div className={styles.cardArtist}>{next.artist}</div>
                </div>
              </div>
            ) : null}

            <div
              className={styles.card}
              style={{
                transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(${drag.dx / 22}deg)`,
                transition: drag.active ? 'none' : 'transform 0.28s cubic-bezier(.2,.8,.25,1)',
                cursor: drag.active ? 'grabbing' : 'grab',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <span
                className={`${styles.overlay} ${styles.ovLike}`}
                style={{ opacity: liveDir === 'like' ? dragProgress : 0 }}
              >
                좋아요
              </span>
              <span
                className={`${styles.overlay} ${styles.ovDislike}`}
                style={{ opacity: liveDir === 'dislike' ? dragProgress : 0 }}
              >
                별로
              </span>
              <span
                className={`${styles.overlay} ${styles.ovWish}`}
                style={{ opacity: liveDir === 'wish' ? dragProgress : 0 }}
              >
                위시
              </span>
              <span
                className={`${styles.overlay} ${styles.ovSkip}`}
                style={{ opacity: liveDir === 'skip' ? dragProgress : 0 }}
              >
                모름
              </span>

              {current.artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.cardArt} src={current.artworkUrl} alt={`${current.title} 커버`} draggable={false} />
              ) : null}
              <div className={styles.cardMeta}>
                <div className={styles.cardTitle}>{current.title}</div>
                <div className={styles.cardArtist}>{current.artist}</div>
                <div className={styles.cardTags}>
                  {current.genre ? <span className={styles.tag}>{current.genre}</span> : null}
                  {current.year ? <span className={styles.tag}>{current.year}</span> : null}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.btn} ${styles.btnSmall}`}
              onClick={() => commit('dislike')}
              aria-label="별로"
            >
              👎
            </button>
            <button
              className={`${styles.btn} ${styles.btnLike}`}
              onClick={() => commit('like')}
              aria-label="좋아요"
            >
              💗
            </button>
            <button
              className={`${styles.btn} ${styles.btnWish}`}
              onClick={() => commit('wish')}
              aria-label="위시리스트"
            >
              🤍
            </button>
            <button
              className={`${styles.btn} ${styles.btnSmall}`}
              onClick={() => commit('skip')}
              aria-label="모름"
            >
              ❓
            </button>
          </div>

          <button className={styles.undo} onClick={undo} disabled={!last}>
            ↩ 되돌리기
          </button>
        </>
      ) : null}
    </div>
  )
}

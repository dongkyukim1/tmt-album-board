'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './me.module.css'
import {
  backendConfigured,
  realMeAdapter,
  type MeAdapter,
  type MyReview,
  type Page,
  type WishlistItem,
} from '@/lib/me-api'
import { mockMeAdapter } from '@/lib/me-mock'

type Segment = 'wishlist' | 'reviews'
type Status = 'loading' | 'ready' | 'empty' | 'error'

type SegState<T> = {
  items: T[]
  cursor: string | null
  status: Status
  loadingMore: boolean
}

const EMPTY: SegState<never> = { items: [], cursor: null, status: 'loading', loadingMore: false }

function starLabel(stars: number): string {
  return `★ ${stars.toFixed(1)}`
}

export default function MePage() {
  const [segment, setSegment] = useState<Segment>('wishlist')
  const [usingMock, setUsingMock] = useState(!backendConfigured)
  const [wishlist, setWishlist] = useState<SegState<WishlistItem>>(EMPTY)
  const [reviews, setReviews] = useState<SegState<MyReview>>(EMPTY)

  // 실제 어댑터 실패 시 mock으로 폴백. cursor는 첫 페이지엔 null.
  const fetchWishlist = useCallback(
    async (cursor: string | null): Promise<Page<WishlistItem>> => {
      const adapter: MeAdapter = usingMock ? mockMeAdapter : realMeAdapter
      try {
        return await adapter.getWishlist(cursor)
      } catch (error) {
        if (usingMock) throw error
        console.error('me wishlist failed, falling back to mock:', error)
        setUsingMock(true)
        return mockMeAdapter.getWishlist(cursor)
      }
    },
    [usingMock],
  )

  const fetchReviews = useCallback(
    async (cursor: string | null): Promise<Page<MyReview>> => {
      const adapter: MeAdapter = usingMock ? mockMeAdapter : realMeAdapter
      try {
        return await adapter.getMyReviews(cursor)
      } catch (error) {
        if (usingMock) throw error
        console.error('me reviews failed, falling back to mock:', error)
        setUsingMock(true)
        return mockMeAdapter.getMyReviews(cursor)
      }
    },
    [usingMock],
  )

  const loadWishlist = useCallback(async () => {
    setWishlist({ ...EMPTY, status: 'loading' })
    try {
      const page = await fetchWishlist(null)
      setWishlist({
        items: page.items,
        cursor: page.nextCursor,
        status: page.items.length > 0 ? 'ready' : 'empty',
        loadingMore: false,
      })
    } catch {
      setWishlist({ items: [], cursor: null, status: 'error', loadingMore: false })
    }
  }, [fetchWishlist])

  const loadReviews = useCallback(async () => {
    setReviews({ ...EMPTY, status: 'loading' })
    try {
      const page = await fetchReviews(null)
      setReviews({
        items: page.items,
        cursor: page.nextCursor,
        status: page.items.length > 0 ? 'ready' : 'empty',
        loadingMore: false,
      })
    } catch {
      setReviews({ items: [], cursor: null, status: 'error', loadingMore: false })
    }
  }, [fetchReviews])

  useEffect(() => {
    if (segment === 'wishlist') void loadWishlist()
    else void loadReviews()
  }, [segment, loadWishlist, loadReviews])

  const moreWishlist = useCallback(async () => {
    if (!wishlist.cursor || wishlist.loadingMore) return
    setWishlist((s) => ({ ...s, loadingMore: true }))
    try {
      const page = await fetchWishlist(wishlist.cursor)
      setWishlist((s) => ({
        items: [...s.items, ...page.items],
        cursor: page.nextCursor,
        status: 'ready',
        loadingMore: false,
      }))
    } catch {
      setWishlist((s) => ({ ...s, loadingMore: false }))
    }
  }, [wishlist.cursor, wishlist.loadingMore, fetchWishlist])

  const moreReviews = useCallback(async () => {
    if (!reviews.cursor || reviews.loadingMore) return
    setReviews((s) => ({ ...s, loadingMore: true }))
    try {
      const page = await fetchReviews(reviews.cursor)
      setReviews((s) => ({
        items: [...s.items, ...page.items],
        cursor: page.nextCursor,
        status: 'ready',
        loadingMore: false,
      }))
    } catch {
      setReviews((s) => ({ ...s, loadingMore: false }))
    }
  }, [reviews.cursor, reviews.loadingMore, fetchReviews])

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <Link href="/" className={styles.brand}>
            TMT
          </Link>
          <Link href="/taste" className={styles.brand} aria-label="취향찾기로 이동" style={{ fontSize: 20 }}>
            🎮
          </Link>
        </div>
        <h1 className={styles.h1}>My Taste</h1>

        <div className={styles.segments} role="tablist">
          <button
            role="tab"
            aria-selected={segment === 'wishlist'}
            className={`${styles.seg} ${segment === 'wishlist' ? styles.segOn : ''}`}
            onClick={() => setSegment('wishlist')}
          >
            위시리스트
          </button>
          <button
            role="tab"
            aria-selected={segment === 'reviews'}
            className={`${styles.seg} ${segment === 'reviews' ? styles.segOn : ''}`}
            onClick={() => setSegment('reviews')}
          >
            내 코멘트
          </button>
        </div>

        {usingMock ? <p className={styles.mockNote}>* 데모 모드: 취향찾기에서 담은 위시리스트로 미리 보기 중</p> : null}

        {segment === 'wishlist' ? (
          <WishlistView state={wishlist} onMore={moreWishlist} onRetry={loadWishlist} />
        ) : (
          <ReviewsView state={reviews} onMore={moreReviews} onRetry={loadReviews} />
        )}
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className={styles.skelGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.skel} />
      ))}
    </div>
  )
}

function WishlistView({
  state,
  onMore,
  onRetry,
}: {
  state: SegState<WishlistItem>
  onMore: () => void
  onRetry: () => void
}) {
  if (state.status === 'loading') return <SkeletonGrid />
  if (state.status === 'error') {
    return (
      <div className={styles.empty}>
        <h2>불러오지 못했어요</h2>
        <button className={styles.cta} onClick={onRetry}>
          다시 시도
        </button>
      </div>
    )
  }
  if (state.status === 'empty') {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>👾</div>
        <h2>아직 찜한 앨범이 없어요</h2>
        <p>취향찾기 한 판 어때요?</p>
        <Link href="/taste" className={styles.cta}>
          취향찾기 시작
        </Link>
      </div>
    )
  }
  return (
    <>
      <div className={styles.grid}>
        {state.items.map((a) => (
          <Link key={a.albumId} href={`/album/${a.albumId}`} className={styles.card}>
            {a.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.cover} src={a.artworkUrl} alt={`${a.title} 커버`} loading="lazy" />
            ) : (
              <div className={styles.cover} />
            )}
            <div className={styles.cardTitle}>{a.title}</div>
            <div className={styles.cardArtist}>{a.artist}</div>
          </Link>
        ))}
      </div>
      {state.cursor ? (
        <button className={styles.more} onClick={onMore} disabled={state.loadingMore}>
          {state.loadingMore ? '불러오는 중…' : '더보기'}
        </button>
      ) : null}
    </>
  )
}

function ReviewsView({
  state,
  onMore,
  onRetry,
}: {
  state: SegState<MyReview>
  onMore: () => void
  onRetry: () => void
}) {
  if (state.status === 'loading') return <SkeletonGrid />
  if (state.status === 'error') {
    return (
      <div className={styles.empty}>
        <h2>불러오지 못했어요</h2>
        <button className={styles.cta} onClick={onRetry}>
          다시 시도
        </button>
      </div>
    )
  }
  if (state.status === 'empty') {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✍️</div>
        <h2>아직 남긴 코멘트가 없어요</h2>
        <p>앨범을 평가하면 여기에 한 줄 평이 쌓여요.</p>
        <Link href="/" className={styles.cta}>
          앨범 둘러보기
        </Link>
      </div>
    )
  }
  return (
    <>
      <div className={styles.reviewList}>
        {state.items.map((r) => (
          <div key={r.albumId} className={styles.review}>
            {r.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.reviewCover} src={r.artworkUrl} alt="" loading="lazy" />
            ) : (
              <div className={styles.reviewCover} />
            )}
            <div className={styles.reviewBody}>
              <div className={styles.reviewTop}>
                <span className={styles.reviewTitle}>{r.title ?? r.albumId}</span>
                <span className={styles.stars}>{starLabel(r.stars)}</span>
              </div>
              <div className={styles.reviewText}>{r.text}</div>
            </div>
          </div>
        ))}
      </div>
      {state.cursor ? (
        <button className={styles.more} onClick={onMore} disabled={state.loadingMore}>
          {state.loadingMore ? '불러오는 중…' : '더보기'}
        </button>
      ) : null}
    </>
  )
}

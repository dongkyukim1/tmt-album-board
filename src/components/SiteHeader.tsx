'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import styles from './site-shell.module.css'

const LINKS = [
  { href: '/', label: '탑스터' },
  { href: '/taste', label: '취향찾기' },
  { href: '/me', label: '마이' },
] as const

/** 운영자 전용 링크 — 신고 24시간 검토(이용약관 제9조). */
const ADMIN_LINK = { href: '/admin/reports', label: '신고 관리' } as const

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

/**
 * 로그인 사용자가 운영자인지. SPA 가 localStorage `auth_user` 에 캐시한
 * isAdmin 을 먼저 쓰고, 캐시에 값이 없으면(구버전 캐시) GET /me 로 한 번 확인한다.
 * 실제 권한은 서버(AdminGuard)가 판단하므로 여기선 메뉴 노출만 정한다.
 */
function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    let cancelled = false
    try {
      const token = localStorage.getItem('auth_access')
      if (!token) return
      const cached = JSON.parse(localStorage.getItem('auth_user') || 'null') as
        | { isAdmin?: boolean }
        | null
      if (typeof cached?.isAdmin === 'boolean') {
        setIsAdmin(cached.isAdmin)
        return
      }
      if (!API_BASE) return
      fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : null))
        .then((json: { data?: { isAdmin?: boolean } } | null) => {
          const admin = !!json?.data?.isAdmin
          if (cancelled) return
          setIsAdmin(admin)
          if (cached) localStorage.setItem('auth_user', JSON.stringify({ ...cached, isAdmin: admin }))
        })
        .catch(() => {})
    } catch {
      /* localStorage 차단 등 — 메뉴만 숨긴다 */
    }
    return () => {
      cancelled = true
    }
  }, [])
  return isAdmin
}

/** 웹 공통 상단 네비 — 앱 하단 탭바에 대응. 메이커(`/`)는 SPA라 전체 페이지 이동(<a>)을 쓴다. */
export default function SiteHeader() {
  const pathname = usePathname()
  const isAdmin = useIsAdmin()
  const links = isAdmin ? [...LINKS, ADMIN_LINK] : LINKS
  return (
    <header className={styles.nav}>
      <a href="/" className={styles.brand} aria-label="TMT 홈">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tmt-logo.png" alt="TMT" width={48} height={34} />
      </a>
      <nav className={styles.links} aria-label="주요 메뉴">
        {links.map((l) => {
          const on = l.href !== '/' && pathname.startsWith(l.href)
          return (
            <a
              key={l.href}
              href={l.href}
              className={`${styles.link} ${on ? styles.linkOn : ''}`}
              aria-current={on ? 'page' : undefined}
            >
              {l.label}
            </a>
          )
        })}
      </nav>
    </header>
  )
}

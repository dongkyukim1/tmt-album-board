'use client'

import { usePathname } from 'next/navigation'
import styles from './site-shell.module.css'

const LINKS = [
  { href: '/', label: '탑스터' },
  { href: '/taste', label: '취향찾기' },
  { href: '/me', label: '마이' },
] as const

/** 웹 공통 상단 네비 — 앱 하단 탭바에 대응. 메이커(`/`)는 SPA라 전체 페이지 이동(<a>)을 쓴다. */
export default function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className={styles.nav}>
      <a href="/" className={styles.brand} aria-label="TMT 홈">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tmt-logo.png" alt="TMT" width={48} height={34} />
      </a>
      <nav className={styles.links} aria-label="주요 메뉴">
        {LINKS.map((l) => {
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

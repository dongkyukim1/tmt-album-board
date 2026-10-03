import styles from './site-shell.module.css'

/** 웹 공통 푸터 — index.html `.site-foot`과 동일 구성. */
export default function SiteFooter() {
  return (
    <footer className={styles.foot}>
      <div className={styles.footIn}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tmt-logo.png" alt="TMT" width={39} height={28} />
        <nav className={styles.footNav} aria-label="푸터 메뉴">
          <a href="/">탑스터 만들기</a>
          <a href="/taste">취향찾기</a>
          <a href="/me">마이</a>
        </nav>
        <p className={styles.footNote}>앨범 데이터 © Apple iTunes</p>
      </div>
    </footer>
  )
}

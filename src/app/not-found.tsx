import type { Metadata } from 'next'
import { DiscIcon } from '@/components/icons'

export const metadata: Metadata = { title: '페이지를 찾을 수 없어요 — TMT' }

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: 'calc(100dvh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '48px 20px',
        textAlign: 'center',
      }}
    >
      <DiscIcon size={44} style={{ color: 'var(--muted)' }} />
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--white)' }}>
        페이지를 찾을 수 없어요
      </h1>
      <p style={{ fontSize: 14, color: 'var(--muted)' }}>
        링크가 잘못됐거나 비공개로 바뀐 탑스터일 수 있어요.
      </p>
      <a href="/" className="btn-primary" style={{ marginTop: 12 }}>
        탑스터 만들러 가기
      </a>
    </main>
  )
}

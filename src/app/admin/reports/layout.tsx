import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '신고 관리 — TMT',
  robots: { index: false, follow: false },
}

export default function AdminReportsLayout({ children }: { children: React.ReactNode }) {
  return children
}

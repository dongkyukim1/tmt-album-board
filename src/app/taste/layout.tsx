import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '취향찾기 — TMT 탑스터 메이커',
  description: '앨범 카드를 넘기며 취향을 찾는 TMT 스와이프.',
}

export default function TasteLayout({ children }: { children: React.ReactNode }) {
  return children
}

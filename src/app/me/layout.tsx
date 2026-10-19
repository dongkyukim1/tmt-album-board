import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MY — TMT 탑스터 메이커',
  description: '내 위시리스트와 앨범 한 줄 평을 모아보는 MY 페이지.',
}

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return children
}

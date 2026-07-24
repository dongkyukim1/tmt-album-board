import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TMT — Album Board',
  description: '블라인드 앨범 리뷰 + 소셜 허브',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/galmuri/dist/galmuri.css" />
      </head>
      <body
        style={{
          margin: 0,
          background: 'var(--bg)',
          color: 'var(--txt)',
          fontFamily: 'var(--sans)',
        }}
      >
        {children}
      </body>
    </html>
  )
}

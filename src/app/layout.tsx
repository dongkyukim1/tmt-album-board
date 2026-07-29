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
        <meta name="theme-color" content="#14110D" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Song+Myung&display=swap"
        />
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

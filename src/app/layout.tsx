import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TMT — 탑스터 메이커',
  description: '앨범 그리드를 채우고 한 줄 평과 함께 저장·공유하는 탑스터(Topster) 메이커.',
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
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
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

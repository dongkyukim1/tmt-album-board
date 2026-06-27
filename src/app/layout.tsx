import type { Metadata } from 'next'

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
      <body
        style={{
          margin: 0,
          background: '#0b0b0c',
          color: '#f2f2f2',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  )
}

import { ImageResponse } from 'next/og'

/** iOS 홈 화면 아이콘(PNG) — apple-touch-icon은 SVG를 지원하지 않는다. */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A',
          color: '#CFF730',
          fontSize: 58,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        TMT
      </div>
    ),
    { ...size },
  )
}

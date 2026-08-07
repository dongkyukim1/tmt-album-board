import { ImageResponse } from 'next/og'

/** SSR 라우트(/c/:id, /album/:id, /me, /taste) 공용 파비콘 — 잉크 캔버스 + 골드 TMT 모노그램. */
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#14110D',
          border: '3px solid #E3B24E',
          borderRadius: 12,
          color: '#E3B24E',
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        TMT
      </div>
    ),
    { ...size },
  )
}

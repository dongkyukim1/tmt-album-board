import { ImageResponse } from 'next/og'

/** SSR 라우트(/c/:id, /album/:id, /me, /taste) 공용 파비콘 — 딥블랙 캔버스 + 라임 TMT 모노그램. */
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
          background: '#0A0A0A',
          border: '3px solid #CFF730',
          borderRadius: 12,
          color: '#CFF730',
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

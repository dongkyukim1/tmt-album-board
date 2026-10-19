import type { NextConfig } from 'next'

/**
 * 하이브리드 구성:
 * - 신규 SSR 라우트(`/album/[id]` 등)는 App Router가 처리.
 * - 기존 SPA(`public/index.html`)는 루트(`/`)에서 그대로 서빙 → 점진적 이주.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: '/', destination: '/index.html' }]
  },
}

export default nextConfig

import { defineConfig } from 'vitest/config'

// 순수 유틸/로직 함수 유닛테스트용 최소 설정.
// DOM이 필요 없으므로 node 환경. 테스트는 test/ 아래 co-locate.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})

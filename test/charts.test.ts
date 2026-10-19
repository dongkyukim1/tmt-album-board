import { describe, it, expect } from 'vitest'
import { cssColor, buildGrid, type Chart, type ChartItem } from '../src/lib/charts'

describe('cssColor', () => {
  it('6자리 hex는 # 붙여 그대로 통과', () => {
    expect(cssColor('#1a2b3c')).toBe('#1a2b3c')
    expect(cssColor('1a2b3c')).toBe('#1a2b3c')
  })

  it('8자리 Flutter ARGB(#AARRGGBB)를 CSS RGBA(#RRGGBBAA)로 재정렬', () => {
    // AA=ff RR=11 GG=22 BB=33 → #112233ff
    expect(cssColor('#ff112233')).toBe('#112233ff')
    // 반투명 알파(80) 보존
    expect(cssColor('80abcdef')).toBe('#abcdef80')
  })

  it('잘못된 값이면 fallback 반환', () => {
    expect(cssColor('xyz')).toBe('')
    expect(cssColor('#12345')).toBe('') // 5자리 = 무효
    expect(cssColor('', 'red')).toBe('red')
    expect(cssColor(null)).toBe('')
    expect(cssColor(undefined, '#000')).toBe('#000')
  })
})

describe('buildGrid', () => {
  const item = (id: string): ChartItem => ({
    id,
    type: 'album',
    title: id,
    artist: 'a',
    artworkUrl: '',
  })

  const chart = (partial: Partial<Chart>): Chart => ({
    id: 'x',
    name: 'x',
    rows: 2,
    cols: 2,
    style: {},
    cells: [],
    isPublic: true,
    ...partial,
  })

  it('cells를 index 위치에 배치하고 빈 칸은 null', () => {
    const grid = buildGrid(
      chart({
        rows: 2,
        cols: 2,
        cells: [
          { index: 0, item: item('a') },
          { index: 3, item: item('b') },
        ],
      }),
    )
    expect(grid).toHaveLength(4)
    expect(grid[0]?.id).toBe('a')
    expect(grid[1]).toBeNull()
    expect(grid[2]).toBeNull()
    expect(grid[3]?.id).toBe('b')
  })

  it('rows*cols 밖의 셀은 격자 길이에 포함되지 않음', () => {
    const grid = buildGrid(
      chart({ rows: 1, cols: 1, cells: [{ index: 5, item: item('z') }] }),
    )
    expect(grid).toHaveLength(1)
    expect(grid[0]).toBeNull()
  })

  it('rows/cols가 0이면 빈 격자', () => {
    expect(buildGrid(chart({ rows: 0, cols: 3 }))).toEqual([])
  })
})

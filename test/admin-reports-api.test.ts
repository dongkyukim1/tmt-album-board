import { describe, it, expect } from 'vitest'
import { listPath, resolveBody, REASON_LABEL } from '../src/lib/admin-reports-api'

describe('admin-reports-api', () => {
  it('목록 경로: 상태·커서를 쿼리로 붙이고, 전체(null)면 status 를 뺀다', () => {
    expect(listPath('open')).toBe('/admin/reports?limit=20&status=open')
    expect(listPath(null, '2026-10-19T00:00:00.000Z')).toBe(
      '/admin/reports?limit=20&cursor=2026-10-19T00%3A00%3A00.000Z',
    )
  })

  it('처리 본문: 숨기기 = resolved + hideContent, 문제 없음 = dismissed (서버 resolveReportSchema)', () => {
    expect(resolveBody(true)).toEqual({ status: 'resolved', hideContent: true })
    expect(resolveBody(false)).toEqual({ status: 'dismissed' })
  })

  it('서버 신고 사유 6종 모두 문구가 있다', () => {
    expect(Object.keys(REASON_LABEL).sort()).toEqual(
      ['abuse', 'hate', 'illegal', 'other', 'sexual', 'spam'],
    )
  })
})

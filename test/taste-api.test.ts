import { describe, it, expect } from 'vitest'
import {
  verdictForAction,
  SWIPE_ACTIONS,
  SWIPE_WEIGHT,
  type SwipeAction,
} from '../src/lib/taste-api'

describe('verdictForAction', () => {
  it('like/dislike는 동일 verdict로 매핑', () => {
    expect(verdictForAction('like')).toBe('like')
    expect(verdictForAction('dislike')).toBe('dislike')
  })

  it("skip은 'unknown'으로 매핑", () => {
    expect(verdictForAction('skip')).toBe('unknown')
  })

  it('wish는 null — swipe 미전송(위시리스트 API만 호출)', () => {
    expect(verdictForAction('wish')).toBeNull()
  })

  it('모든 SWIPE_ACTIONS를 예외 없이 처리', () => {
    for (const action of SWIPE_ACTIONS) {
      expect(() => verdictForAction(action)).not.toThrow()
    }
  })
})

describe('SWIPE_WEIGHT', () => {
  it('wish가 like보다 강한 양의 신호 (설계 5-1: 위시=+1.5)', () => {
    expect(SWIPE_WEIGHT.wish).toBeGreaterThan(SWIPE_WEIGHT.like)
    expect(SWIPE_WEIGHT.wish).toBe(1.5)
  })

  it('dislike는 음수, skip은 중립(0)', () => {
    expect(SWIPE_WEIGHT.dislike).toBeLessThan(0)
    expect(SWIPE_WEIGHT.skip).toBe(0)
  })

  it('모든 액션에 가중치가 정의됨', () => {
    for (const action of SWIPE_ACTIONS) {
      expect(typeof SWIPE_WEIGHT[action as SwipeAction]).toBe('number')
    }
  })
})

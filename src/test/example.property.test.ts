import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * 示例属性测试文件
 * 展示如何使用 fast-check 进行属性测试
 */
describe('Property Testing Example', () => {
  // 基础属性测试示例
  it('string concatenation is associative', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
        expect(a + (b + c)).toBe((a + b) + c)
      })
    )
  })

  // 数值属性测试示例
  it('addition is commutative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        expect(a + b).toBe(b + a)
      })
    )
  })

  // 数组属性测试示例
  it('array reverse is involutory (reversing twice returns original)', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const reversed = [...arr].reverse()
        const doubleReversed = [...reversed].reverse()
        expect(doubleReversed).toEqual(arr)
      })
    )
  })

  // JSON 往返属性测试示例 (与 ChainQuest 序列化需求相关)
  it('JSON serialization round-trip preserves data', () => {
    const simpleObjectArb = fc.record({
      id: fc.string(),
      value: fc.integer(),
      active: fc.boolean(),
    })

    fc.assert(
      fc.property(simpleObjectArb, (obj) => {
        const serialized = JSON.stringify(obj)
        const deserialized = JSON.parse(serialized)
        expect(deserialized).toEqual(obj)
      })
    )
  })
})

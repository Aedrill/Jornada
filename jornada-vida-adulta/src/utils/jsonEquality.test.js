import { describe, expect, it } from 'vitest'
import { areJsonValuesEqual } from './jsonEquality'

describe('areJsonValuesEqual', () => {
  it('preserva a igualdade profunda independentemente da ordem das chaves', () => {
    expect(areJsonValuesEqual({ a: 1, nested: { b: [1, 2] } }, { nested: { b: [1, 2] }, a: 1 })).toBe(true)
    expect(areJsonValuesEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    expect(areJsonValuesEqual([1, 2], [2, 1])).toBe(false)
  })
})

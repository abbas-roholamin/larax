/** @format */
import { describe, expect, test } from "vitest"
import Num from "../../src/number"

describe("Num", () => {
  test("Clamp", () => {
    expect(Num.clamp({ num: 105, min: 10, max: 100 })).toBe(100)
    expect(Num.clamp({ num: 5, min: 10, max: 100 })).toBe(10)
    expect(Num.clamp({ num: 10, min: 10, max: 100 })).toBe(10)
    expect(Num.clamp({ num: 20, min: 10, max: 100 })).toBe(20)
  })
})

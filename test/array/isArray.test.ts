/** @format */
import { describe, expect, test } from "vitest"
import Arr from "../../src/array"

describe("Arr", () => {
  test("isArray", () => {
    expect(Arr.isArray([])).toBe(true)
    expect(Arr.isArray({})).toBe(false)
  })
})

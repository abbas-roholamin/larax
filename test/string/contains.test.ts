/** @format */
import { describe, expect, test } from "vitest"
import Str from "../../src/string"

describe("Str", () => {
  test("Contains", () => {
    expect(Str.contains("This is my name", "my")).toBe(true)
    expect(Str.contains("This is my name", ["my", "foo"])).toBe(true)
    expect(Str.contains("This is my name", "foo")).toBe(false)
    expect(Str.contains("This is my name", ["foo", "bar"])).toBe(false)
    expect(Str.contains("This is my name", ["FOO", "BAR"], true)).toBe(false)
    expect(Str.contains("This is my name", "MY", true)).toBe(true)
  })
})

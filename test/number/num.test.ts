/** @format */
import { describe, expect, test } from "vitest"
import Num from "../../src/number"

describe("Num formatting", () => {
  test("format", () => {
    expect(Num.format(100000)).toBe("100,000")
    expect(Num.format(100000.123, { precision: 2 })).toBe("100,000.12")
    expect(Num.format(100000.12345, { maxPrecision: 2 })).toBe("100,000.12")
    expect(Num.format(100000, { locale: "de-DE" })).toBe("100.000")
  })

  test("currency", () => {
    expect(Num.currency(1000)).toBe("$1,000.00")
    expect(Num.currency(1000, { currency: "EUR", locale: "de-DE" })).toContain("1.000,00")
  })

  test("percentage", () => {
    expect(Num.percentage(10)).toBe("10%")
    expect(Num.percentage(17.5)).toBe("18%")
    expect(Num.percentage(17.5, { precision: 2 })).toBe("17.50%")
  })

  test("fileSize", () => {
    expect(Num.fileSize(1024)).toBe("1 KB")
    expect(Num.fileSize(1024 * 1024)).toBe("1 MB")
    expect(Num.fileSize(1024, { precision: 2 })).toBe("1.00 KB")
    expect(Num.fileSize(500)).toBe("500 B")
  })

  test("abbreviate", () => {
    expect(Num.abbreviate(1000)).toBe("1K")
    expect(Num.abbreviate(489939)).toBe("490K")
    expect(Num.abbreviate(1230000, { precision: 2 })).toBe("1.23M")
    expect(Num.abbreviate(-1000)).toBe("-1K")
  })

  test("forHumans", () => {
    expect(Num.forHumans(1000)).toBe("1 thousand")
    expect(Num.forHumans(489939)).toBe("490 thousand")
    expect(Num.forHumans(1230000, { precision: 2 })).toBe("1.23 million")
    expect(Num.forHumans(100)).toBe("100")
  })
})

describe("Num words", () => {
  test("spell", () => {
    expect(Num.spell(0)).toBe("zero")
    expect(Num.spell(7)).toBe("seven")
    expect(Num.spell(21)).toBe("twenty-one")
    expect(Num.spell(102)).toBe("one hundred two")
    expect(Num.spell(1234)).toBe("one thousand two hundred thirty-four")
    expect(Num.spell(-5)).toBe("negative five")
    expect(Num.spell(1.5)).toBe("one point five")
  })

  test("spell honours after/until thresholds", () => {
    expect(Num.spell(10, { until: 10 })).toBe("10")
    expect(Num.spell(9, { until: 10 })).toBe("nine")
    expect(Num.spell(5, { after: 10 })).toBe("5")
  })

  test("ordinal", () => {
    expect(Num.ordinal(1)).toBe("1st")
    expect(Num.ordinal(2)).toBe("2nd")
    expect(Num.ordinal(3)).toBe("3rd")
    expect(Num.ordinal(4)).toBe("4th")
    expect(Num.ordinal(11)).toBe("11th")
    expect(Num.ordinal(21)).toBe("21st")
  })

  test("spellOrdinal", () => {
    expect(Num.spellOrdinal(1)).toBe("first")
    expect(Num.spellOrdinal(2)).toBe("second")
    expect(Num.spellOrdinal(3)).toBe("third")
    expect(Num.spellOrdinal(4)).toBe("fourth")
    expect(Num.spellOrdinal(20)).toBe("twentieth")
  })
})

describe("Num maths", () => {
  test("clamp with positional arguments", () => {
    expect(Num.clamp(105, 10, 100)).toBe(100)
    expect(Num.clamp(5, 10, 100)).toBe(10)
    expect(Num.clamp(50, 10, 100)).toBe(50)
  })

  test("clamp still accepts the legacy object signature", () => {
    expect(Num.clamp({ num: 105, min: 10, max: 100 })).toBe(100)
    expect(Num.clamp({ num: 5, min: 10, max: 100 })).toBe(10)
    expect(Num.clamp({ num: 20, min: 10, max: 100 })).toBe(20)
  })

  test("pairs", () => {
    expect(Num.pairs(25, 10)).toStrictEqual([
      [0, 10],
      [11, 20],
      [21, 25],
    ])
    expect(Num.pairs(25, 10, 0)).toStrictEqual([
      [0, 10],
      [10, 20],
      [20, 25],
    ])
  })

  test("trim / parseInt / parseFloat / isNumeric", () => {
    expect(Num.trim(12.0)).toBe(12)
    expect(Num.parseInt("42px")).toBe(42)
    expect(Num.parseInt("nope", -1)).toBe(-1)
    expect(Num.parseFloat("3.14rad")).toBe(3.14)
    expect(Num.isNumeric("1.5")).toBe(true)
    expect(Num.isNumeric("abc")).toBe(false)
    expect(Num.isNumeric("")).toBe(false)
    expect(Num.isNumeric(Number.NaN)).toBe(false)
  })

  test("round avoids float drift", () => {
    expect(Num.round(1.005, 2)).toBe(1.01)
    expect(Num.round(2.5)).toBe(3)
  })

  test("sum / average / lerp / percentOf", () => {
    expect(Num.sum([1, 2, 3])).toBe(6)
    expect(Num.average([1, 2, 3])).toBe(2)
    expect(Num.average([])).toBeUndefined()
    expect(Num.lerp(0, 10, 0.5)).toBe(5)
    expect(Num.percentOf(25, 200)).toBe(12.5)
    expect(Num.percentOf(1, 0)).toBe(0)
  })

  test("random stays within bounds", () => {
    const value = Num.random(1, 5)

    expect(value).toBeGreaterThanOrEqual(1)
    expect(value).toBeLessThanOrEqual(5)
  })
})

describe("Num configuration", () => {
  test("withLocale scopes the change and restores it", () => {
    const before = Num.defaultLocale()
    const scoped = Num.withLocale("de-DE", () => Num.format(100000))

    expect(scoped).toBe("100.000")
    expect(Num.defaultLocale()).toBe(before)
    expect(Num.format(100000)).toBe("100,000")
  })

  test("withCurrency scopes the change", () => {
    const scoped = Num.withCurrency("EUR", () => Num.currency(10, { locale: "de-DE" }))

    expect(scoped).toContain("€")
    expect(Num.defaultCurrency()).toBe("USD")
  })

  test("restores the locale even when the callback throws", () => {
    expect(() =>
      Num.withLocale("de-DE", () => {
        throw new Error("boom")
      }),
    ).toThrow("boom")

    expect(Num.defaultLocale()).toBe("en-US")
  })
})

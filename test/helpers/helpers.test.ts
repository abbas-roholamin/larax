/** @format */
import { describe, expect, test, vi } from "vitest"
import {
  blank,
  classBasename,
  dataFill,
  dataForget,
  dataGet,
  dataSet,
  filled,
  head,
  last,
  once,
  optional,
  retry,
  sleep,
  tap,
  throwIf,
  throwUnless,
  transform,
  value,
  withValue,
} from "../../src/helpers"

describe("value / blank / filled", () => {
  test("value resolves closures", () => {
    expect(value(42)).toBe(42)
    expect(value(() => 42)).toBe(42)
    expect(value((a: number, b: number) => a + b, 1, 2)).toBe(3)
  })

  test("blank / filled", () => {
    expect(blank(null)).toBe(true)
    expect(blank(undefined)).toBe(true)
    expect(blank("")).toBe(true)
    expect(blank("   ")).toBe(true)
    expect(blank([])).toBe(true)
    expect(blank({})).toBe(true)
    expect(blank(new Map())).toBe(true)
    expect(blank(Number.NaN)).toBe(true)

    expect(blank(0)).toBe(false)
    expect(blank(false)).toBe(false)
    expect(blank("a")).toBe(false)
    expect(filled(0)).toBe(true)
    expect(filled(null)).toBe(false)
  })
})

describe("data helpers", () => {
  test("dataGet with dot notation and wildcards", () => {
    const data = { products: [{ name: "Desk" }, { name: "Chair" }] }

    expect(dataGet(data, "products.0.name")).toBe("Desk")
    expect(dataGet(data, "products.*.name")).toStrictEqual(["Desk", "Chair"])
    expect(dataGet(data, "products.5.name", "fallback")).toBe("fallback")
    expect(dataGet(data, null)).toBe(data)
  })

  test("dataSet / dataFill / dataForget", () => {
    const data: any = { products: { desk: { price: 100 } } }

    dataSet(data, "products.desk.price", 200)
    expect(data.products.desk.price).toBe(200)

    dataFill(data, "products.desk.price", 999)
    dataFill(data, "products.desk.name", "Desk")
    expect(data.products.desk).toStrictEqual({ price: 200, name: "Desk" })

    dataForget(data, "products.desk.name")
    expect(data.products.desk).toStrictEqual({ price: 200 })
  })
})

describe("head / last / tap / transform", () => {
  test("head / last", () => {
    expect(head([1, 2, 3])).toBe(1)
    expect(last([1, 2, 3])).toBe(3)
    expect(head([])).toBeUndefined()
  })

  test("tap returns the original value", () => {
    let seen = 0

    expect(tap(42, (item) => {
      seen = item
    })).toBe(42)
    expect(seen).toBe(42)
  })

  test("transform skips blank values", () => {
    expect(transform(5, (item) => item * 2)).toBe(10)
    expect(transform(null, (item) => item)).toBeUndefined()
    expect(transform("", (item) => item, "fallback")).toBe("fallback")
    expect(transform(0, (item) => item + 1)).toBe(1)
  })

  test("withValue", () => {
    expect(withValue(5, (item) => item * 2)).toBe(10)
    expect(withValue(5)).toBe(5)
  })
})

describe("throwIf / throwUnless", () => {
  test("throws on the expected condition", () => {
    expect(() => throwIf(true, "boom")).toThrow("boom")
    expect(throwIf(false, "boom")).toBe(false)
    expect(() => throwUnless(false, "boom")).toThrow("boom")
    expect(throwUnless(true, "boom")).toBe(true)
  })

  test("accepts an error class or instance", () => {
    expect(() => throwIf(true, TypeError, "bad type")).toThrow(TypeError)
    expect(() => throwIf(true, new RangeError("out of range"))).toThrow(RangeError)
  })
})

describe("retry", () => {
  test("returns the first successful result", async () => {
    const callback = vi.fn(() => "ok")

    await expect(retry(3, callback)).resolves.toBe("ok")
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test("retries until it succeeds", async () => {
    let attempts = 0

    const result = await retry(3, () => {
      attempts++

      if (attempts < 3) {
        throw new Error("not yet")
      }

      return attempts
    })

    expect(result).toBe(3)
  })

  test("rethrows after exhausting attempts", async () => {
    await expect(
      retry(2, () => {
        throw new Error("always fails")
      }),
    ).rejects.toThrow("always fails")
  })

  test("stops early when the `when` guard rejects the error", async () => {
    let attempts = 0

    await expect(
      retry(
        5,
        () => {
          attempts++
          throw new Error("fatal")
        },
        0,
        (error) => (error as Error).message !== "fatal",
      ),
    ).rejects.toThrow("fatal")

    expect(attempts).toBe(1)
  })
})

describe("once / optional / sleep / classBasename", () => {
  test("once memoizes the callback", () => {
    const callback = vi.fn(() => Math.random())
    const memoized = once(callback)

    expect(memoized()).toBe(memoized())
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test("once caches a falsy result too", () => {
    const callback = vi.fn(() => 0)
    const memoized = once(callback)

    memoized()
    memoized()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test("optional guards property access on nullish values", () => {
    expect(optional({ name: "Taylor" }).name).toBe("Taylor")
    expect(optional(null).name).toBeUndefined()
    expect(optional(undefined).anything).toBeUndefined()
    expect(optional({ name: "Taylor" }, (user) => user.name)).toBe("Taylor")
    expect(optional(null, (user: any) => user.name)).toBeUndefined()
  })

  test("sleep resolves", async () => {
    await expect(sleep(1)).resolves.toBeUndefined()
  })

  test("classBasename", () => {
    class Widget {}

    expect(classBasename(new Widget())).toBe("Widget")
    expect(classBasename(Widget)).toBe("Widget")
  })
})

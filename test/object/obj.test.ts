/** @format */
import { describe, expect, test } from "vitest"
import Obj from "../../src/object"

describe("Obj reading", () => {
  const data = {
    products: { desk: { price: 100 } },
    users: [{ name: "Taylor" }, { name: "Abigail" }],
  }

  test("get resolves dot notation", () => {
    expect(Obj.get(data, "products.desk.price")).toBe(100)
    expect(Obj.get(data, "products.chair.price", 0)).toBe(0)
    expect(Obj.get(data, "users.0.name")).toBe("Taylor")
  })

  test("get supports wildcards", () => {
    expect(Obj.get(data, "users.*.name")).toStrictEqual(["Taylor", "Abigail"])
    expect(Obj.get({ a: { x: 1 }, b: { x: 2 } }, "*.x")).toStrictEqual([1, 2])
  })

  test("get returns falsy stored values instead of the fallback", () => {
    // The original implementation used `||`, so 0 / "" / false leaked the default.
    expect(Obj.get({ count: 0 }, "count", 99)).toBe(0)
    expect(Obj.get({ flag: false }, "flag", true)).toBe(false)
    expect(Obj.get({ text: "" }, "text", "fallback")).toBe("")
    expect(Obj.get({ nested: { count: 0 } }, "nested.count", 99)).toBe(0)
  })

  test("get still accepts the legacy object signature", () => {
    const legacy = { my: "my", foo: { bar: "bar" } }

    expect(Obj.get({ obj: legacy, path: "my" })).toBe("my")
    expect(Obj.get({ obj: legacy, path: "foo.bar" })).toBe("bar")
    expect(Obj.get({ obj: legacy, path: "bar" })).toBeUndefined()
    expect(Obj.get({ obj: legacy, path: "bar", daf: "default" })).toBe("default")
  })

  test("has / hasAny / exists", () => {
    expect(Obj.has(data, "products.desk.price")).toBe(true)
    expect(Obj.has(data, "products.chair")).toBe(false)
    expect(Obj.hasAny(data, ["products.chair", "products.desk"])).toBe(true)
    expect(Obj.exists(data, "products")).toBe(true)
  })
})

describe("Obj writing", () => {
  test("set creates intermediate structures", () => {
    const data: any = {}

    Obj.set(data, "products.desk.price", 100)
    expect(data).toStrictEqual({ products: { desk: { price: 100 } } })
  })

  test("set creates arrays for numeric segments", () => {
    const data: any = {}

    Obj.set(data, "items.0.name", "Desk")
    expect(Array.isArray(data.items)).toBe(true)
    expect(data.items[0]).toStrictEqual({ name: "Desk" })
  })

  test("set supports wildcards", () => {
    const data: any = { products: [{ price: 100 }, { price: 200 }] }

    Obj.set(data, "products.*.price", 0)
    expect(data.products).toStrictEqual([{ price: 0 }, { price: 0 }])
  })

  test("fill only writes missing values", () => {
    const data: any = { products: { desk: { price: 100 } } }

    Obj.fill(data, "products.desk.price", 200)
    Obj.fill(data, "products.desk.discount", 10)

    expect(data.products.desk).toStrictEqual({ price: 100, discount: 10 })
  })

  test("forget removes nested paths", () => {
    const data: any = { products: { desk: { price: 100, name: "Desk" } } }

    Obj.forget(data, "products.desk.price")
    expect(data).toStrictEqual({ products: { desk: { name: "Desk" } } })
  })
})

describe("Obj shape", () => {
  const data = { name: "Desk", price: 100, orders: 10 }

  test("only / except and their aliases", () => {
    expect(Obj.only(data, ["name", "price"])).toStrictEqual({ name: "Desk", price: 100 })
    expect(Obj.pick(data, "name")).toStrictEqual({ name: "Desk" })
    expect(Obj.except(data, ["price", "orders"])).toStrictEqual({ name: "Desk" })
    expect(Obj.omit(data, "orders")).toStrictEqual({ name: "Desk", price: 100 })
  })

  test("keys / values / entries / count", () => {
    expect(Obj.keys(data)).toStrictEqual(["name", "price", "orders"])
    expect(Obj.values(data)).toStrictEqual(["Desk", 100, 10])
    expect(Obj.entries({ a: 1 })).toStrictEqual([["a", 1]])
    expect(Obj.count(data)).toBe(3)
  })

  test("invert / dot / undot", () => {
    expect(Obj.invert({ a: "1", b: "2" })).toStrictEqual({ 1: "a", 2: "b" })
    expect(Obj.dot({ a: { b: 1 } })).toStrictEqual({ "a.b": 1 })
    expect(Obj.undot({ "a.b": 1 })).toStrictEqual({ a: { b: 1 } })
  })
})

describe("Obj transformation", () => {
  test("map / mapKeys / filter / reject", () => {
    expect(Obj.map({ a: 1, b: 2 }, (item) => item * 2)).toStrictEqual({ a: 2, b: 4 })
    expect(Obj.mapKeys({ a: 1 }, (key) => key.toUpperCase())).toStrictEqual({ A: 1 })
    expect(Obj.filter({ a: 1, b: null, c: "" })).toStrictEqual({ a: 1 })
    expect(Obj.filter({ a: 1, b: 2 }, (item) => item > 1)).toStrictEqual({ b: 2 })
    expect(Obj.reject({ a: 1, b: 2 }, (item) => item > 1)).toStrictEqual({ a: 1 })
  })

  test("merge is recursive and later sources win", () => {
    expect(Obj.merge({ a: { x: 1, y: 2 } }, { a: { y: 3, z: 4 } })).toStrictEqual({
      a: { x: 1, y: 3, z: 4 },
    })
  })

  test("merge does not share references with its sources", () => {
    const source = { nested: { list: [1] } }
    const merged = Obj.merge({}, source)

    merged.nested.list.push(2)
    expect(source.nested.list).toStrictEqual([1])
  })

  test("defaults fills only missing keys", () => {
    expect(Obj.defaults({ a: 1 }, { a: 9, b: 2 })).toStrictEqual({ a: 1, b: 2 })
  })

  test("freeze is recursive", () => {
    const frozen = Obj.freeze({ nested: { a: 1 } })

    expect(Object.isFrozen(frozen)).toBe(true)
    expect(Object.isFrozen(frozen.nested)).toBe(true)
  })
})

describe("Obj comparison", () => {
  test("equals is structural", () => {
    expect(Obj.equals({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true)
    expect(Obj.equals({ a: 1 }, { a: 2 })).toBe(false)
  })

  test("isEmpty / isObject", () => {
    expect(Obj.isEmpty({})).toBe(true)
    expect(Obj.isNotEmpty({ a: 1 })).toBe(true)
    expect(Obj.isObject({})).toBe(true)
    expect(Obj.isObject([])).toBe(false)
    expect(Obj.isObject(new Date())).toBe(false)
  })
})

/** @format */
import { describe, expect, test } from "vitest"
import Arr from "../../src/array"

describe("Arr type checks", () => {
  test("isArray / accessible / isAssoc / isList", () => {
    expect(Arr.isArray([])).toBe(true)
    expect(Arr.isArray({})).toBe(false)
    expect(Arr.accessible([1, 2])).toBe(true)
    expect(Arr.accessible({ a: 1 })).toBe(true)
    expect(Arr.accessible("string")).toBe(false)
    expect(Arr.isAssoc({ product: { name: "Desk" } })).toBe(true)
    expect(Arr.isAssoc([1, 2, 3])).toBe(false)
    expect(Arr.isList([1, 2, 3])).toBe(true)
  })
})

describe("Arr reading", () => {
  const data = { products: { desk: { price: 100 } } }

  test("get resolves dot notation", () => {
    expect(Arr.get(data, "products.desk.price")).toBe(100)
    expect(Arr.get(data, "products.desk")).toStrictEqual({ price: 100 })
    expect(Arr.get(data, "products.chair", "fallback")).toBe("fallback")
    expect(Arr.get(data, "products.chair.price")).toBeUndefined()
    expect(Arr.get(null, "products", "fallback")).toBe("fallback")
  })

  test("get returns falsy stored values rather than the fallback", () => {
    expect(Arr.get({ count: 0 }, "count", 99)).toBe(0)
    expect(Arr.get({ flag: false }, "flag", true)).toBe(false)
    expect(Arr.get({ text: "" }, "text", "fallback")).toBe("")
  })

  test("exists / has / hasAny", () => {
    expect(Arr.exists({ a: 1 }, "a")).toBe(true)
    expect(Arr.exists({ a: 1 }, "b")).toBe(false)
    expect(Arr.has(data, "products.desk")).toBe(true)
    expect(Arr.has(data, ["products.desk", "products.desk.price"])).toBe(true)
    expect(Arr.has(data, ["products.desk", "products.chair"])).toBe(false)
    expect(Arr.hasAny(data, ["products.chair", "products.desk"])).toBe(true)
  })

  test("first / last", () => {
    const numbers = [100, 200, 300]

    expect(Arr.first(numbers)).toBe(100)
    expect(Arr.first(numbers, (item) => item >= 150)).toBe(200)
    expect(Arr.first([], null, "fallback")).toBe("fallback")
    expect(Arr.last(numbers)).toBe(300)
    expect(Arr.last(numbers, (item) => item < 250)).toBe(200)
  })

  test("sole", () => {
    expect(Arr.sole([1, 2, 3], (item) => item === 2)).toBe(2)
    expect(() => Arr.sole([1, 2, 3])).toThrow(/3 items matched/)
    expect(() => Arr.sole([])).toThrow(/no matching items/)
  })
})

describe("Arr writing", () => {
  test("set / add", () => {
    const data: any = { products: { desk: { price: 100 } } }

    Arr.set(data, "products.desk.price", 200)
    expect(data.products.desk.price).toBe(200)

    Arr.add(data, "products.desk.discount", 10)
    Arr.add(data, "products.desk.price", 999)
    expect(data.products.desk).toStrictEqual({ price: 200, discount: 10 })
  })

  test("forget removes nested keys", () => {
    const data: any = { products: { desk: { price: 100 }, chair: { price: 50 } } }

    Arr.forget(data, "products.desk")
    expect(data).toStrictEqual({ products: { chair: { price: 50 } } })
  })

  test("pull reads and removes", () => {
    const data: any = { name: "Desk", price: 100 }

    expect(Arr.pull(data, "name")).toBe("Desk")
    expect(data).toStrictEqual({ price: 100 })
    expect(Arr.pull(data, "missing", "fallback")).toBe("fallback")
  })

  test("prepend", () => {
    expect(Arr.prepend([1, 2, 3], 0)).toStrictEqual([0, 1, 2, 3])
    expect(Arr.prepend({ b: 2 }, 1, "a")).toStrictEqual({ a: 1, b: 2 })
  })
})

describe("Arr shape", () => {
  test("collapse / flatten", () => {
    expect(Arr.collapse([[1, 2], [3, 4], [5]])).toStrictEqual([1, 2, 3, 4, 5])
    expect(Arr.flatten({ name: "Joe", languages: ["PHP", "Ruby"] })).toStrictEqual([
      "Joe",
      "PHP",
      "Ruby",
    ])
    expect(Arr.flatten([1, [2, [3, [4]]]], 1)).toStrictEqual([1, 2, [3, [4]]])
  })

  test("dot / undot round-trip", () => {
    const nested = { products: { desk: { price: 100 } } }
    const flat = { "products.desk.price": 100 }

    expect(Arr.dot(nested)).toStrictEqual(flat)
    expect(Arr.undot(flat)).toStrictEqual(nested)
  })

  test("divide / wrap / from", () => {
    expect(Arr.divide({ name: "Desk" })).toStrictEqual([["name"], ["Desk"]])
    expect(Arr.wrap("string")).toStrictEqual(["string"])
    expect(Arr.wrap(null)).toStrictEqual([])
    expect(Arr.wrap(["a"])).toStrictEqual(["a"])
    expect(Arr.from(new Set([1, 2]))).toStrictEqual([1, 2])
  })

  test("crossJoin", () => {
    expect(Arr.crossJoin([1, 2], ["a", "b"])).toStrictEqual([
      [1, "a"],
      [1, "b"],
      [2, "a"],
      [2, "b"],
    ])
  })

  test("chunk / split / take / partition", () => {
    expect(Arr.chunk([1, 2, 3, 4, 5], 2)).toStrictEqual([[1, 2], [3, 4], [5]])
    expect(Arr.split([1, 2, 3, 4, 5], 3)).toStrictEqual([[1, 2], [3, 4], [5]])
    expect(Arr.take([1, 2, 3, 4], 2)).toStrictEqual([1, 2])
    expect(Arr.take([1, 2, 3, 4], -2)).toStrictEqual([3, 4])
    expect(Arr.partition([1, 2, 3, 4], (item) => item % 2 === 0)).toStrictEqual([
      [2, 4],
      [1, 3],
    ])
  })
})

describe("Arr selection", () => {
  const rows = [
    { developer: { id: 1, name: "Taylor", role: "lead" } },
    { developer: { id: 2, name: "Abigail", role: "dev" } },
  ]

  test("only / except", () => {
    const data = { name: "Desk", price: 100, orders: 10 }

    expect(Arr.only(data, ["name", "price"])).toStrictEqual({ name: "Desk", price: 100 })
    expect(Arr.except(data, ["price", "orders"])).toStrictEqual({ name: "Desk" })
  })

  test("pluck", () => {
    expect(Arr.pluck(rows, "developer.name")).toStrictEqual(["Taylor", "Abigail"])
    expect(Arr.pluck(rows, "developer.name", "developer.id")).toStrictEqual({
      1: "Taylor",
      2: "Abigail",
    })
  })

  test("select", () => {
    expect(Arr.select([{ id: 1, name: "a", role: "b" }], ["id", "name"])).toStrictEqual([
      { id: 1, name: "a" },
    ])
  })

  test("keyBy / groupBy / countBy", () => {
    const users = [
      { id: "a", team: "x" },
      { id: "b", team: "y" },
      { id: "c", team: "x" },
    ]

    expect(Arr.keyBy(users, "id")["b"]).toStrictEqual({ id: "b", team: "y" })
    expect(Arr.groupBy(users, "team")["x"]).toHaveLength(2)
    expect(Arr.countBy(users, "team")).toStrictEqual({ x: 2, y: 1 })
  })

  test("prependKeysWith", () => {
    expect(Arr.prependKeysWith({ name: "Desk" }, "product.")).toStrictEqual({
      "product.name": "Desk",
    })
  })
})

describe("Arr filtering and mapping", () => {
  test("where / reject / whereNotNull", () => {
    expect(Arr.where([100, "200", 300], (item) => typeof item === "string")).toStrictEqual(["200"])
    expect(Arr.where({ a: 1, b: 2 }, (item) => item > 1)).toStrictEqual({ b: 2 })
    expect(Arr.reject([1, 2, 3], (item) => item > 1)).toStrictEqual([1])
    expect(Arr.whereNotNull([0, null, "a", undefined])).toStrictEqual([0, "a"])
  })

  test("filter drops blank values", () => {
    expect(Arr.filter([0, "", null, "a", [], {}, false])).toStrictEqual([0, "a", false])
  })

  test("map / mapWithKeys / mapSpread", () => {
    expect(Arr.map([1, 2], (item) => item * 2)).toStrictEqual([2, 4])
    expect(Arr.map({ a: 1 }, (item) => item * 2)).toStrictEqual({ a: 2 })
    expect(
      Arr.mapWithKeys([{ name: "a", email: "a@x.com" }], (item) => [item.name, item.email]),
    ).toStrictEqual({ a: "a@x.com" })
    expect(Arr.mapSpread([[1, 2], [3, 4]], (a: number, b: number) => a + b)).toStrictEqual([3, 7])
  })
})

describe("Arr ordering and sets", () => {
  test("sort / sortDesc / sortRecursive", () => {
    expect(Arr.sort([3, 1, 2])).toStrictEqual([1, 2, 3])
    expect(Arr.sortDesc([3, 1, 2])).toStrictEqual([3, 2, 1])
    expect(Arr.sort([{ n: 2 }, { n: 1 }], "n")).toStrictEqual([{ n: 1 }, { n: 2 }])
    expect(Arr.sortRecursive({ b: [3, 1], a: 1 })).toStrictEqual({ a: 1, b: [1, 3] })
  })

  test("sorts numbers numerically, not lexicographically", () => {
    expect(Arr.sort([10, 9, 100])).toStrictEqual([9, 10, 100])
  })

  test("shuffle keeps every element", () => {
    expect(Arr.shuffle([1, 2, 3, 4]).sort()).toStrictEqual([1, 2, 3, 4])
  })

  test("unique / diff / intersect / contains", () => {
    expect(Arr.unique([1, 1, 2, 2, 3])).toStrictEqual([1, 2, 3])
    expect(Arr.unique([{ a: 1 }, { a: 1 }, { a: 2 }])).toStrictEqual([{ a: 1 }, { a: 2 }])
    expect(Arr.diff([1, 2, 3], [2])).toStrictEqual([1, 3])
    expect(Arr.intersect([1, 2, 3], [2, 3, 4])).toStrictEqual([2, 3])
    expect(Arr.contains([{ a: 1 }], { a: 1 })).toBe(true)
    expect(Arr.contains([1, 2], (item) => item > 1)).toBe(true)
  })
})

describe("Arr output and aggregation", () => {
  test("join", () => {
    expect(Arr.join(["a", "b", "c"], ", ")).toBe("a, b, c")
    expect(Arr.join(["Tailwind", "Alpine", "Livewire"], ", ", " and ")).toBe(
      "Tailwind, Alpine and Livewire",
    )
    expect(Arr.join(["a"], ", ", " and ")).toBe("a")
    expect(Arr.join([], ", ", " and ")).toBe("")
  })

  test("query", () => {
    expect(Arr.query({ name: "Taylor", order: { column: "created_at" } })).toBe(
      "name=Taylor&order%5Bcolumn%5D=created_at",
    )
  })

  test("toCssClasses / toCssStyles", () => {
    expect(Arr.toCssClasses(["p-4", { "font-bold": true, "text-red": false }])).toBe(
      "p-4 font-bold",
    )
    expect(Arr.toCssStyles(["background-color: blue", { "font-weight: bold": true }])).toBe(
      "background-color: blue; font-weight: bold;",
    )
  })

  test("sum / avg / min / max", () => {
    expect(Arr.sum([1, 2, 3])).toBe(6)
    expect(Arr.sum([{ n: 1 }, { n: 2 }], "n")).toBe(3)
    expect(Arr.avg([1, 2, 3])).toBe(2)
    expect(Arr.avg([])).toBeUndefined()
    expect(Arr.min([3, 1, 2])).toBe(1)
    expect(Arr.max([3, 1, 2])).toBe(3)
  })
})

describe("Arr misc", () => {
  test("clone is deep", () => {
    const original = { nested: { list: [1, 2] } }
    const copy = Arr.clone(original)

    copy.nested.list.push(3)
    expect(original.nested.list).toStrictEqual([1, 2])
  })

  test("random", () => {
    expect([1, 2, 3]).toContain(Arr.random([1, 2, 3]))
    expect(Arr.random([1, 2, 3], 2)).toHaveLength(2)
    expect(() => Arr.random([1], 5)).toThrow()
  })
})

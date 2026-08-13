/** @format */
import { describe, expect, test } from "vitest"
import Collection from "../../src/collection"
import { collect } from "../../src/helpers"

describe("Collection construction", () => {
  test("accepts arrays, objects, iterables and nullish values", () => {
    expect(collect([1, 2, 3]).all()).toStrictEqual([1, 2, 3])
    expect(collect({ a: 1, b: 2 }).all()).toStrictEqual([1, 2])
    expect(collect(new Set([1, 2])).all()).toStrictEqual([1, 2])
    expect(collect(null).all()).toStrictEqual([])
    expect(collect().all()).toStrictEqual([])
  })

  test("make / wrap / unwrap / times / range", () => {
    expect(Collection.make([1]).all()).toStrictEqual([1])
    expect(Collection.wrap("a").all()).toStrictEqual(["a"])
    expect(Collection.wrap(collect([1])).all()).toStrictEqual([1])
    expect(Collection.unwrap(collect([1]))).toStrictEqual([1])
    expect(Collection.times(3, (index) => index * 2).all()).toStrictEqual([2, 4, 6])
    expect(Collection.range(1, 5).all()).toStrictEqual([1, 2, 3, 4, 5])
    expect(Collection.range(5, 1).all()).toStrictEqual([5, 4, 3, 2, 1])
  })

  test("is iterable and spreadable", () => {
    expect([...collect([1, 2])]).toStrictEqual([1, 2])
    expect(Array.from(collect([1, 2]))).toStrictEqual([1, 2])
  })
})

describe("Collection access", () => {
  const items = collect([1, 2, 3, 4, 5])

  test("count / get / has", () => {
    expect(items.count()).toBe(5)
    expect(items.length).toBe(5)
    expect(items.get(0)).toBe(1)
    expect(items.get(-1)).toBe(5)
    expect(items.get(99, "fallback")).toBe("fallback")
    expect(items.has(2)).toBe(true)
    expect(items.has(99)).toBe(false)
  })

  test("first / last / firstWhere", () => {
    expect(items.first()).toBe(1)
    expect(items.first((item) => item > 3)).toBe(4)
    expect(items.last()).toBe(5)
    expect(items.last((item) => item < 3)).toBe(2)

    const rows = collect([
      { name: "Desk", price: 200 },
      { name: "Chair", price: 100 },
    ])

    expect(rows.firstWhere("name", "Chair")).toStrictEqual({ name: "Chair", price: 100 })
    expect(rows.firstWhere("price", "<", 150)).toStrictEqual({ name: "Chair", price: 100 })
  })

  test("search", () => {
    expect(items.search(3)).toBe(2)
    expect(items.search(99)).toBe(false)
    expect(items.search((item) => item > 3)).toBe(3)
  })

  test("sole", () => {
    expect(items.sole((item) => item === 3)).toBe(3)
    expect(() => items.sole()).toThrow()
  })
})

describe("Collection predicates", () => {
  test("isEmpty / contains / every / some", () => {
    expect(collect([]).isEmpty()).toBe(true)
    expect(collect([1]).isNotEmpty()).toBe(true)
    expect(collect([1, 2]).contains(2)).toBe(true)
    expect(collect([{ a: 1 }]).contains({ a: 1 })).toBe(true)
    expect(collect([{ name: "Desk" }]).contains("name", "=", "Desk")).toBe(true)
    expect(collect([1, 2]).doesntContain(3)).toBe(true)
    expect(collect([1, 2]).every((item) => item > 0)).toBe(true)
    expect(collect([1, 2]).some((item) => item > 1)).toBe(true)
  })
})

describe("Collection transformation", () => {
  const rows = collect([
    { name: "Desk", price: 200, category: "office" },
    { name: "Chair", price: 100, category: "office" },
    { name: "Door", price: 300, category: "home" },
  ])

  test("map / flatMap / mapWithKeys / mapToGroups", () => {
    expect(collect([1, 2]).map((item) => item * 2).all()).toStrictEqual([2, 4])
    expect(collect([[1, 2], [3]]).flatMap((item) => item).all()).toStrictEqual([1, 2, 3])
    expect(rows.mapWithKeys((row) => [row.name, row.price])).toStrictEqual({
      Desk: 200,
      Chair: 100,
      Door: 300,
    })
    expect(rows.mapToGroups((row) => [row.category, row.name])).toStrictEqual({
      office: ["Desk", "Chair"],
      home: ["Door"],
    })
  })

  test("mapSpread", () => {
    expect(
      collect([[1, 2], [3, 4]]).mapSpread((a: number, b: number) => a + b).all(),
    ).toStrictEqual([3, 7])
  })

  test("filter / reject", () => {
    expect(collect([1, 2, 3]).filter((item) => item > 1).all()).toStrictEqual([2, 3])
    expect(collect([1, null, 0, "", "a"]).filter().all()).toStrictEqual([1, 0, "a"])
    expect(collect([1, 2, 3]).reject((item) => item > 1).all()).toStrictEqual([1])
  })

  test("where family", () => {
    expect(rows.where("price", 100).count()).toBe(1)
    expect(rows.where("price", ">", 150).count()).toBe(2)
    expect(rows.whereIn("name", ["Desk", "Door"]).count()).toBe(2)
    expect(rows.whereNotIn("name", ["Desk"]).count()).toBe(2)
    expect(rows.whereBetween("price", [100, 200]).count()).toBe(2)
    expect(rows.whereNotBetween("price", [100, 200]).count()).toBe(1)
    expect(collect([1, null, 2]).whereNotNull().all()).toStrictEqual([1, 2])
    expect(collect([1, null, 2]).whereNull().all()).toStrictEqual([null])
  })

  test("transform mutates in place", () => {
    const items = collect([1, 2])

    items.transform((item) => item * 10)
    expect(items.all()).toStrictEqual([10, 20])
  })
})

describe("Collection shape", () => {
  test("collapse / flatten", () => {
    expect(collect([[1, 2], [3]]).collapse().all()).toStrictEqual([1, 2, 3])
    expect(collect([1, [2, [3]]]).flatten().all()).toStrictEqual([1, 2, 3])
    expect(collect([1, [2, [3]]]).flatten(1).all()).toStrictEqual([1, 2, [3]])
  })

  test("chunk / chunkWhile / sliding", () => {
    expect(collect([1, 2, 3, 4, 5]).chunk(2).toArray()).toStrictEqual([[1, 2], [3, 4], [5]])
    expect(
      collect([1, 2, 4, 9, 10]).chunkWhile((item, previous) => item - 1 === previous).toArray(),
    ).toStrictEqual([[1, 2], [4], [9, 10]])
    expect(collect([1, 2, 3, 4]).sliding(2).toArray()).toStrictEqual([[1, 2], [2, 3], [3, 4]])
  })

  test("split / splitIn / partition / pad", () => {
    expect(collect([1, 2, 3, 4, 5]).split(3).toArray()).toStrictEqual([[1, 2], [3, 4], [5]])
    expect(collect([1, 2, 3, 4, 5, 6]).splitIn(2).toArray()).toStrictEqual([[1, 2, 3], [4, 5, 6]])
    const [even, odd] = collect([1, 2, 3, 4]).partition((item) => item % 2 === 0)
    expect(even.all()).toStrictEqual([2, 4])
    expect(odd.all()).toStrictEqual([1, 3])
    expect(collect([1, 2]).pad(4, 0).all()).toStrictEqual([1, 2, 0, 0])
    expect(collect([1, 2]).pad(-4, 0).all()).toStrictEqual([0, 0, 1, 2])
  })
})

describe("Collection ordering and slicing", () => {
  test("sort / sortBy / reverse", () => {
    expect(collect([3, 1, 2]).sort().all()).toStrictEqual([1, 2, 3])
    expect(collect([3, 1, 2]).sortDesc().all()).toStrictEqual([3, 2, 1])
    expect(collect([{ n: 2 }, { n: 1 }]).sortBy("n").pluck("n")).toStrictEqual([1, 2])
    expect(collect([{ n: 1 }, { n: 2 }]).sortByDesc("n").pluck("n")).toStrictEqual([2, 1])
    expect(collect([1, 2]).reverse().all()).toStrictEqual([2, 1])
  })

  test("sorting does not mutate the source", () => {
    const source = collect([3, 1, 2])

    source.sort()
    expect(source.all()).toStrictEqual([3, 1, 2])
  })

  test("slice / take / skip / nth / forPage", () => {
    const items = collect([1, 2, 3, 4, 5, 6])

    expect(items.slice(2).all()).toStrictEqual([3, 4, 5, 6])
    expect(items.slice(2, 2).all()).toStrictEqual([3, 4])
    expect(items.take(2).all()).toStrictEqual([1, 2])
    expect(items.take(-2).all()).toStrictEqual([5, 6])
    expect(items.skip(4).all()).toStrictEqual([5, 6])
    expect(items.nth(2).all()).toStrictEqual([1, 3, 5])
    expect(items.nth(2, 1).all()).toStrictEqual([2, 4, 6])
    expect(items.forPage(2, 2).all()).toStrictEqual([3, 4])
  })

  test("takeWhile / takeUntil / skipWhile / skipUntil", () => {
    const items = collect([1, 2, 3, 4, 1])

    expect(items.takeWhile((item) => item < 3).all()).toStrictEqual([1, 2])
    expect(items.takeUntil((item) => item > 2).all()).toStrictEqual([1, 2])
    expect(items.skipWhile((item) => item < 3).all()).toStrictEqual([3, 4, 1])
    expect(items.skipUntil((item) => item > 2).all()).toStrictEqual([3, 4, 1])
  })
})

describe("Collection sets", () => {
  test("unique / duplicates / diff / intersect / merge / concat", () => {
    expect(collect([1, 1, 2]).unique().all()).toStrictEqual([1, 2])
    expect(collect([1, 1, 2, 2, 3]).duplicates().all()).toStrictEqual([1, 2])
    expect(collect([1, 2, 3]).diff([2]).all()).toStrictEqual([1, 3])
    expect(collect([1, 2, 3]).intersect([2, 3, 4]).all()).toStrictEqual([2, 3])
    expect(collect([1]).merge([2]).all()).toStrictEqual([1, 2])
    expect(collect([1]).concat([2]).all()).toStrictEqual([1, 2])
  })

  test("zip / combine / crossJoin", () => {
    expect(collect([1, 2]).zip(["a", "b"]).toArray()).toStrictEqual([[1, "a"], [2, "b"]])
    expect(collect(["name", "age"]).combine(["Taylor", 30])).toStrictEqual({
      name: "Taylor",
      age: 30,
    })
    expect(collect([1, 2]).crossJoin(["a"]).all()).toStrictEqual([[1, "a"], [2, "a"]])
  })
})

describe("Collection keys and aggregation", () => {
  const rows = collect([
    { id: 1, name: "Desk", price: 200 },
    { id: 2, name: "Chair", price: 100 },
    { id: 3, name: "Door", price: 100 },
  ])

  test("pluck / keyBy / groupBy / countBy / flip", () => {
    expect(rows.pluck("name")).toStrictEqual(["Desk", "Chair", "Door"])
    expect(rows.pluck("name", "id")).toStrictEqual({ 1: "Desk", 2: "Chair", 3: "Door" })
    expect(Object.keys(rows.keyBy("name"))).toStrictEqual(["Desk", "Chair", "Door"])
    expect(rows.groupBy("price")["100"]).toHaveLength(2)
    expect(rows.countBy("price")).toStrictEqual({ 100: 2, 200: 1 })
    expect(collect(["a", "b"]).flip()).toStrictEqual({ a: 0, b: 1 })
  })

  test("only / except / keys / values", () => {
    expect(collect([1, 2, 3]).only([0, 2]).all()).toStrictEqual([1, 3])
    expect(collect([1, 2, 3]).except([0]).all()).toStrictEqual([2, 3])
    expect(collect(["a", "b"]).keys().all()).toStrictEqual([0, 1])
    expect(collect(["a"]).values().all()).toStrictEqual(["a"])
  })

  test("sum / avg / min / max / median / mode", () => {
    expect(collect([1, 2, 3]).sum()).toBe(6)
    expect(rows.sum("price")).toBe(400)
    expect(collect([1, 2, 3]).avg()).toBe(2)
    expect(collect([1, 2, 3]).min()).toBe(1)
    expect(collect([1, 2, 3]).max()).toBe(3)
    expect(collect([1, 2, 3, 4]).median()).toBe(2.5)
    expect(collect([1, 2, 3]).median()).toBe(2)
    expect(collect([]).median()).toBeUndefined()
    expect(collect([1, 1, 2]).mode()).toStrictEqual([1])
    expect(collect([]).mode()).toBeUndefined()
  })

  test("reduce / implode / join", () => {
    expect(collect([1, 2, 3]).reduce((carry, item) => carry + item, 0)).toBe(6)
    expect(collect(["a", "b"]).implode("-")).toBe("a-b")
    expect(rows.implode("name", ", ")).toBe("Desk, Chair, Door")
    expect(collect(["a", "b", "c"]).join(", ", " and ")).toBe("a, b and c")
  })
})

describe("Collection mutation", () => {
  test("push / pop / prepend / shift", () => {
    const items = collect([1, 2, 3])

    items.push(4)
    expect(items.all()).toStrictEqual([1, 2, 3, 4])
    expect(items.pop()).toBe(4)

    items.prepend(0)
    expect(items.all()).toStrictEqual([0, 1, 2, 3])
    expect(items.shift()).toBe(0)
    expect(items.all()).toStrictEqual([1, 2, 3])
  })

  test("put / pull / forget / splice", () => {
    const items = collect([1, 2, 3])

    items.put(0, 99)
    expect(items.get(0)).toBe(99)
    expect(items.pull(0)).toBe(99)
    expect(items.all()).toStrictEqual([2, 3])

    items.forget(0)
    expect(items.all()).toStrictEqual([3])

    const spliced = collect([1, 2, 3]).splice(1, 1)
    expect(spliced.all()).toStrictEqual([2])
  })
})

describe("Collection control flow", () => {
  test("each stops on false", () => {
    const seen: number[] = []

    collect([1, 2, 3]).each((item) => {
      seen.push(item)

      return item < 2
    })

    expect(seen).toStrictEqual([1, 2])
  })

  test("tap / pipe", () => {
    let captured = 0

    const result = collect([1, 2, 3])
      .tap((items) => {
        captured = items.count()
      })
      .pipe((items) => items.sum())

    expect(captured).toBe(3)
    expect(result).toBe(6)
  })

  test("when / unless", () => {
    expect(collect([1, 2]).when(true, (items) => items.push(3)).all()).toStrictEqual([1, 2, 3])
    expect(collect([1, 2]).when(false, (items) => items.push(3)).all()).toStrictEqual([1, 2])
    expect(collect([1]).unless(false, (items) => items.push(2)).all()).toStrictEqual([1, 2])
    expect(collect<number>([]).whenEmpty((items) => items.push(1)).all()).toStrictEqual([1])
    expect(collect([1]).whenNotEmpty((items) => items.push(2)).all()).toStrictEqual([1, 2])
  })

  test("clone is deep", () => {
    const original = collect([{ nested: [1] }])
    const copy = original.clone()

    copy.get(0)!.nested.push(2)
    expect(original.get(0)!.nested).toStrictEqual([1])
  })

  test("toArray / toJson unwrap nested collections", () => {
    expect(collect([1, 2]).chunk(1).toArray()).toStrictEqual([[1], [2]])
    expect(collect([1, 2]).toJson()).toBe("[1,2]")
    expect(JSON.stringify({ items: collect([1]) })).toBe('{"items":[1]}')
  })
})

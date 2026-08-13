/** @format */
import { describe, expect, test } from "vitest"
import { str } from "../../src/helpers"

describe("Stringable chaining", () => {
  test("transforming methods compose", () => {
    expect(str(" Laravel Framework ").squish().slug().toString()).toBe("laravel-framework")
    expect(str("foo_bar").camel().toString()).toBe("fooBar")
    expect(str("Hello World").replace("World", "Laravel").upper().toString()).toBe("HELLO LARAVEL")
  })

  test("append / prepend", () => {
    expect(str("Hello").append(" ", "World").toString()).toBe("Hello World")
    expect(str("World").prepend("Hello ").toString()).toBe("Hello World")
  })

  test("terminal methods return plain values", () => {
    expect(str("This is my name").contains("my")).toBe(true)
    expect(str("abc").length()).toBe(3)
    expect(str("Hello, world").wordCount()).toBe(2)
    expect(str("FooBar").ucsplit()).toStrictEqual(["Foo", "Bar"])
    expect(str("a,b").explode(",")).toStrictEqual(["a", "b"])
  })

  test("original value is never mutated", () => {
    const original = str("laravel")

    original.upper()
    expect(original.toString()).toBe("laravel")
  })
})

describe("Stringable paths", () => {
  test("basename / dirname", () => {
    expect(str("/foo/bar/baz.jpg").basename().toString()).toBe("baz.jpg")
    expect(str("/foo/bar/baz.jpg").basename(".jpg").toString()).toBe("baz")
    expect(str("/foo/bar/baz.jpg").dirname().toString()).toBe("/foo/bar")
    expect(str("/foo/bar/baz.jpg").dirname(2).toString()).toBe("/foo")
  })
})

describe("Stringable conditionals", () => {
  test("when / unless", () => {
    expect(str("Taylor").when(true, (value) => value.append(" Otwell")).toString()).toBe(
      "Taylor Otwell",
    )
    expect(str("Taylor").when(false, (value) => value.append(" Otwell")).toString()).toBe("Taylor")
    expect(str("Taylor").unless(false, (value) => value.upper()).toString()).toBe("TAYLOR")
  })

  test("whenEmpty / whenNotEmpty / whenContains / whenStartsWith", () => {
    expect(str("").whenEmpty((value) => value.append("Laravel")).toString()).toBe("Laravel")
    expect(str("a").whenNotEmpty((value) => value.upper()).toString()).toBe("A")
    expect(str("tony stark").whenContains("tony", (value) => value.title()).toString()).toBe(
      "Tony Stark",
    )
    expect(str("disney world").whenStartsWith("disney", (value) => value.title()).toString()).toBe(
      "Disney World",
    )
  })

  test("callbacks may mutate without returning", () => {
    // A callback that returns nothing keeps the current value.
    expect(str("keep").when(true, () => {}).toString()).toBe("keep")
  })

  test("tap does not break the chain", () => {
    let seen = ""

    const result = str("laravel")
      .tap((value) => {
        seen = value.toString()
      })
      .upper()
      .toString()

    expect(seen).toBe("laravel")
    expect(result).toBe("LARAVEL")
  })

  test("pipe returns the callback's result", () => {
    expect(str("laravel").pipe((value) => value.length)).toBe(7)
  })
})

describe("Stringable conversion", () => {
  test("toInteger / toFloat / toBoolean / toDate", () => {
    expect(str("42").toInteger()).toBe(42)
    expect(str("nope").toInteger()).toBe(0)
    expect(str("3.14").toFloat()).toBe(3.14)
    expect(str("yes").toBoolean()).toBe(true)
    expect(str("0").toBoolean()).toBe(false)
    expect(str("2024-01-01").toDate().getUTCFullYear()).toBe(2024)
  })

  test("coerces to a string implicitly", () => {
    expect(`${str("laravel")}`).toBe("laravel")
    expect(String(str("laravel"))).toBe("laravel")
    expect(JSON.stringify({ name: str("laravel") })).toBe('{"name":"laravel"}')
  })

  test("exactly / isEmpty", () => {
    expect(str("laravel").exactly("laravel")).toBe(true)
    expect(str("laravel").exactly(str("laravel"))).toBe(true)
    expect(str("").isEmpty()).toBe(true)
    expect(str("a").isNotEmpty()).toBe(true)
  })
})

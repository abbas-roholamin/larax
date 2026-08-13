/** @format */
import { describe, expect, test } from "vitest"
import Str from "../../src/string"

describe("Str slicing", () => {
  test("after / afterLast", () => {
    expect(Str.after("This is my name", "This is")).toBe(" my name")
    expect(Str.after("This is my name", "")).toBe("This is my name")
    expect(Str.afterLast("app/Http/Controllers/Controller", "/")).toBe("Controller")
    expect(Str.afterLast("nope", "/")).toBe("nope")
  })

  test("before / beforeLast", () => {
    expect(Str.before("This is my name", "my name")).toBe("This is ")
    expect(Str.beforeLast("This is my name", "is")).toBe("This ")
    expect(Str.before("This is my name", "")).toBe("This is my name")
  })

  test("between / betweenFirst", () => {
    expect(Str.between("This is my name", "This", "name")).toBe(" is my ")
    expect(Str.betweenFirst("[a] bc [d]", "[", "]")).toBe("a")
    expect(Str.between("[a] bc [d]", "[", "]")).toBe("a] bc [d")
  })

  test("charAt", () => {
    expect(Str.charAt("This is my name.", 6)).toBe("s")
    expect(Str.charAt("abc", -1)).toBe("c")
    expect(Str.charAt("abc", 99)).toBe(false)
  })

  test("chopStart / chopEnd", () => {
    expect(Str.chopStart("https://laravel.com", "https://")).toBe("laravel.com")
    expect(Str.chopStart("http://laravel.com", ["https://", "http://"])).toBe("laravel.com")
    expect(Str.chopEnd("app/Models/Photograph.php", ".php")).toBe("app/Models/Photograph")
  })

  test("substr / substrReplace / substrCount", () => {
    expect(Str.substr("The Laravel Framework", 4, 7)).toBe("Laravel")
    expect(Str.substr("Laravel", -9)).toBe("Laravel")
    expect(Str.substrReplace("1300", ":", 2)).toBe("13:")
    expect(Str.substrReplace("1300", ":", 2, 0)).toBe("13:00")
    expect(Str.substrCount("If you like ice cream, you will like snow cones.", "like")).toBe(2)
  })

  test("take", () => {
    expect(Str.take("Build something great!", 5)).toBe("Build")
    expect(Str.take("Build something great!", -6)).toBe("great!")
  })

  test("handles astral characters as single units", () => {
    expect(Str.length("a👍b")).toBe(3)
    expect(Str.reverse("a👍b")).toBe("b👍a")
    expect(Str.take("👍👎🙂", 2)).toBe("👍👎")
  })
})

describe("Str searching", () => {
  test("contains uses substring semantics, like Laravel", () => {
    expect(Str.contains("This is my name", "my")).toBe(true)
    // "nam" is a substring but not a whole word.
    expect(Str.contains("This is my name", "nam")).toBe(true)
    expect(Str.contains("This is my name", ["my", "foo"])).toBe(true)
    expect(Str.contains("This is my name", "foo")).toBe(false)
    expect(Str.contains("This is my name", "MY", true)).toBe(true)
    expect(Str.contains("This is my name", "")).toBe(false)
  })

  test("containsAll / doesntContain", () => {
    expect(Str.containsAll("This is my name", ["my", "name"])).toBe(true)
    expect(Str.containsAll("This is my name", ["my", "foo"])).toBe(false)
    expect(Str.doesntContain("This is my name", "foo")).toBe(true)
  })

  test("startsWith / endsWith", () => {
    expect(Str.startsWith("This is my name", "This")).toBe(true)
    expect(Str.startsWith("This is my name", ["foo", "This"])).toBe(true)
    expect(Str.endsWith("This is my name", "name")).toBe(true)
    expect(Str.endsWith("This is my name", ["this", "foo"])).toBe(false)
  })

  test("position returns false rather than -1 when absent", () => {
    expect(Str.position("Hello, World!", "Hello")).toBe(0)
    expect(Str.position("Hello, World!", "W")).toBe(7)
    expect(Str.position("Hello, World!", "nope")).toBe(false)
  })

  test("is matches wildcard patterns", () => {
    expect(Str.is("foo*", "foobar")).toBe(true)
    expect(Str.is("baz*", "foobar")).toBe(false)
    expect(Str.is("*.example.com", "sub.example.com")).toBe(true)
    expect(Str.is(["a*", "b*"], "bcd")).toBe(true)
    // Dots are literal, not regex wildcards.
    expect(Str.is("a.c", "abc")).toBe(false)
  })

  test("match / matchAll / isMatch", () => {
    expect(Str.match(/bar(.*)/, "foo bar baz")).toBe(" baz")
    expect(Str.match(/foo (bar)/, "foo bar")).toBe("bar")
    expect(Str.match(/nope/, "foo bar")).toBe("")
    expect(Str.matchAll(/bar/, "bar foo bar")).toStrictEqual(["bar", "bar"])
    expect(Str.isMatch(/foo (.*)/, "foo bar")).toBe(true)
    expect(Str.isMatch([/nope/, /bar/], "foo bar")).toBe(true)
  })
})

describe("Str casing", () => {
  test("camel / studly / snake / kebab", () => {
    expect(Str.camel("foo_bar")).toBe("fooBar")
    expect(Str.camel("foo-bar")).toBe("fooBar")
    expect(Str.studly("foo_bar")).toBe("FooBar")
    expect(Str.snake("fooBar")).toBe("foo_bar")
    expect(Str.snake("fooBar", "-")).toBe("foo-bar")
    expect(Str.snake("foo bar")).toBe("foo_bar")
    expect(Str.kebab("fooBar")).toBe("foo-bar")
  })

  test("ucfirst / lcfirst / title", () => {
    expect(Str.ucfirst("foo bar")).toBe("Foo bar")
    expect(Str.lcfirst("Foo Bar")).toBe("foo Bar")
    expect(Str.title("a nice title uses the correct case")).toBe(
      "A Nice Title Uses The Correct Case",
    )
  })

  test("apa keeps minor words lowercase", () => {
    expect(Str.apa("Creating A Project")).toBe("Creating a Project")
    expect(Str.apa("tomorrow never dies")).toBe("Tomorrow Never Dies")
  })

  test("headline", () => {
    expect(Str.headline("steve_jobs")).toBe("Steve Jobs")
    expect(Str.headline("EmailNotificationSent")).toBe("Email Notification Sent")
  })

  test("ucsplit", () => {
    expect(Str.ucsplit("FooBar")).toStrictEqual(["Foo", "Bar"])
    expect(Str.ucsplit("Hello From Laravel")).toStrictEqual(["Hello ", "From ", "Laravel"])
  })
})

describe("Str replacement", () => {
  test("replace", () => {
    expect(Str.replace("9.x", "10.x", "Laravel 9.x")).toBe("Laravel 10.x")
    expect(Str.replace("LARAVEL", "Framework", "laravel", false)).toBe("Framework")
    expect(Str.replace(["a", "b"], ["1", "2"], "ab")).toBe("12")
  })

  test("replaceArray fills placeholders in order", () => {
    expect(
      Str.replaceArray("?", ["8:30", "9:00"], "The event will take place between ? and ?"),
    ).toBe("The event will take place between 8:30 and 9:00")
  })

  test("replaceFirst / replaceLast / replaceStart / replaceEnd", () => {
    expect(Str.replaceFirst("the", "a", "the quick brown fox jumps over the lazy dog")).toBe(
      "a quick brown fox jumps over the lazy dog",
    )
    expect(Str.replaceLast("the", "a", "the quick brown fox jumps over the lazy dog")).toBe(
      "the quick brown fox jumps over a lazy dog",
    )
    expect(Str.replaceStart("Hello", "Laravel", "Hello World")).toBe("Laravel World")
    expect(Str.replaceStart("World", "Laravel", "Hello World")).toBe("Hello World")
    expect(Str.replaceEnd("World", "Laravel", "Hello World")).toBe("Hello Laravel")
  })

  test("replaceMatches / remove / swap", () => {
    expect(Str.replaceMatches(/[^A-Za-z0-9]+/, "", "(+1) 501-555-1000")).toBe("15015551000")
    expect(Str.remove("e", "Peter Piper picked a peck of pickled peppers.")).toBe(
      "Ptr Pipr pickd a pck of pickld ppprs.",
    )
    expect(
      Str.swap({ Tacos: "Burritos", great: "fantastic" }, "Tacos are great!"),
    ).toBe("Burritos are fantastic!")
  })

  test("mask", () => {
    expect(Str.mask("taylor@example.com", "*", 3)).toBe("tay***************")
    expect(Str.mask("taylor@example.com", "*", -15, 3)).toBe("tay***@example.com")
  })
})

describe("Str padding, trimming and wrapping", () => {
  test("padBoth / padLeft / padRight", () => {
    expect(Str.padBoth("James", 10, "_")).toBe("__James___")
    expect(Str.padLeft("James", 10, "-=")).toBe("-=-=-James")
    expect(Str.padRight("James", 10, "-")).toBe("James-----")
    expect(Str.padRight("James", 2)).toBe("James")
  })

  test("trim family", () => {
    expect(Str.trim("  Laravel  ")).toBe("Laravel")
    expect(Str.trim("/Laravel/", "/")).toBe("Laravel")
    expect(Str.ltrim("  Laravel  ")).toBe("Laravel  ")
    expect(Str.rtrim("  Laravel  ")).toBe("  Laravel")
  })

  test("squish / deduplicate", () => {
    expect(Str.squish("    laravel    framework    ")).toBe("laravel framework")
    expect(Str.deduplicate("The   Laravel   Framework")).toBe("The Laravel Framework")
    expect(Str.deduplicate("The---Laravel---Framework", "-")).toBe("The-Laravel-Framework")
  })

  test("start / finish", () => {
    expect(Str.start("this/string", "/")).toBe("/this/string")
    expect(Str.start("/this/string", "/")).toBe("/this/string")
    expect(Str.finish("this/string", "/")).toBe("this/string/")
    expect(Str.finish("this/string//", "/")).toBe("this/string/")
  })

  test("wrap / unwrap", () => {
    expect(Str.wrap("Laravel", '"')).toBe('"Laravel"')
    expect(Str.wrap("is", "This ", " Laravel!")).toBe("This is Laravel!")
    expect(Str.unwrap('"Laravel"', '"')).toBe("Laravel")
    expect(Str.unwrap("{framework: 'Laravel'}", "{", "}")).toBe("framework: 'Laravel'")
  })

  test("wordWrap", () => {
    expect(Str.wordWrap("The quick brown fox jumped over the lazy dog", 20, "<br />\n")).toBe(
      "The quick brown fox<br />\njumped over the lazy<br />\ndog",
    )
  })
})

describe("Str truncation", () => {
  test("limit", () => {
    expect(Str.limit("The quick brown fox", 10)).toBe("The quick...")
    expect(Str.limit("The quick brown fox", 100)).toBe("The quick brown fox")
    expect(Str.limit("The quick brown fox", 12, "...", true)).toBe("The quick...")
    expect(Str.limit("The quick brown fox", 10, " (...)")).toBe("The quick (...)")
  })

  test("words / wordCount", () => {
    expect(Str.words("Perfectly balanced, as all things should be.", 3, " >>>")).toBe(
      "Perfectly balanced, as >>>",
    )
    expect(Str.words("Short text", 10)).toBe("Short text")
    expect(Str.wordCount("Hello, world!")).toBe(2)
    expect(Str.wordCount("")).toBe(0)
  })

  test("excerpt", () => {
    expect(Str.excerpt("This is my name", "my", { radius: 3 })).toBe("...is my na...")
    expect(Str.excerpt("This is my name", "name", { radius: 3, omission: "(...)" })).toBe(
      "(...)my name",
    )
    expect(Str.excerpt("This is my name", "nope")).toBeNull()
  })
})

describe("Str inflection", () => {
  test("plural", () => {
    expect(Str.plural("car")).toBe("cars")
    expect(Str.plural("child")).toBe("children")
    expect(Str.plural("box")).toBe("boxes")
    expect(Str.plural("category")).toBe("categories")
    expect(Str.plural("person")).toBe("people")
    expect(Str.plural("sheep")).toBe("sheep")
    expect(Str.plural("child", 1)).toBe("child")
    expect(Str.plural("child", 2)).toBe("children")
    expect(Str.plural("Child")).toBe("Children")
  })

  test("singular", () => {
    expect(Str.singular("cars")).toBe("car")
    expect(Str.singular("children")).toBe("child")
    expect(Str.singular("boxes")).toBe("box")
    expect(Str.singular("categories")).toBe("category")
    expect(Str.singular("people")).toBe("person")
  })

  test("pluralStudly", () => {
    expect(Str.pluralStudly("VerifiedHuman")).toBe("VerifiedHumans")
    expect(Str.pluralStudly("UserFeedback", 1)).toBe("UserFeedback")
  })
})

describe("Str transformation", () => {
  test("ascii / transliterate", () => {
    expect(Str.ascii("û")).toBe("u")
    expect(Str.ascii("Crème Brûlée")).toBe("Creme Brulee")
    expect(Str.ascii("Straße")).toBe("Strasse")
    expect(Str.transliterate("🎂", "?")).toBe("?")
  })

  test("slug", () => {
    expect(Str.slug("Laravel 5 Framework", "-")).toBe("laravel-5-framework")
    expect(Str.slug("Hello @ World")).toBe("hello-at-world")
    expect(Str.slug("Crème Brûlée")).toBe("creme-brulee")
    expect(Str.slug("Laravel Framework", "_")).toBe("laravel_framework")
  })

  test("numbers / repeat / reverse", () => {
    expect(Str.numbers("(555) 123-4567")).toBe("5551234567")
    expect(Str.repeat("a", 3)).toBe("aaa")
    expect(Str.repeat("a", 0)).toBe("")
    expect(Str.reverse("Hello World")).toBe("dlroW olleH")
  })

  test("base64 round-trips, including non-ASCII", () => {
    expect(Str.toBase64("Laravel")).toBe("TGFyYXZlbA==")
    expect(Str.fromBase64("TGFyYXZlbA==")).toBe("Laravel")
    expect(Str.fromBase64(Str.toBase64("héllo 👍"))).toBe("héllo 👍")
    expect(Str.fromBase64("not base64!", true)).toBe(false)
  })
})

describe("Str validation", () => {
  test("isAscii / isJson / isUrl", () => {
    expect(Str.isAscii("Taylor")).toBe(true)
    expect(Str.isAscii("ü")).toBe(false)
    expect(Str.isJson('[1,2,3]')).toBe(true)
    expect(Str.isJson("{first: 'John'}")).toBe(false)
    expect(Str.isUrl("http://example.com")).toBe(true)
    expect(Str.isUrl("laravel")).toBe(false)
    expect(Str.isUrl("ftp://example.com", ["http", "https"])).toBe(false)
  })

  test("isUuid / isUlid", () => {
    expect(Str.isUuid(Str.uuid())).toBe(true)
    expect(Str.isUuid("laravel")).toBe(false)
    expect(Str.isUuid(Str.uuid7(), 7)).toBe(true)
    expect(Str.isUuid(Str.uuid(), 7)).toBe(false)
    expect(Str.isUlid(Str.ulid())).toBe(true)
    expect(Str.isUlid("not-a-ulid")).toBe(false)
  })
})

describe("Str generation", () => {
  test("random / password produce the requested length", () => {
    expect(Str.random(40)).toHaveLength(40)
    expect(Str.random(40)).not.toBe(Str.random(40))
    expect(Str.password(12)).toHaveLength(12)
    expect(Str.password(12, true, false, false)).toMatch(/^[a-zA-Z]{12}$/)
  })

  test("uuid7 values sort chronologically", () => {
    const early = Str.uuid7(new Date(1000))
    const later = Str.uuid7(new Date(2_000_000))

    expect(early < later).toBe(true)
  })

  test("ulid is 26 Crockford characters", () => {
    expect(Str.ulid()).toHaveLength(26)
  })
})

describe("Str misc", () => {
  test("explode honours a positive limit", () => {
    expect(Str.explode("a,b,c", ",")).toStrictEqual(["a", "b", "c"])
    expect(Str.explode("a,b,c", ",", 2)).toStrictEqual(["a", "b,c"])
  })

  test("of returns a Stringable", () => {
    expect(Str.of("  laravel  ").trim().upper().toString()).toBe("LARAVEL")
  })
})

/** @format */
import { describe, expect, test } from "vitest"
import Stringable from "../../src/stringable"
import Str from "../../src/string"
import { str } from "../../src/helpers"

/**
 * `Stringable` is a thin forwarding layer over `Str`, so the failure mode worth
 * guarding is a delegate wired to the wrong `Str` method. Each case below
 * asserts the chained call against the static call it should forward to.
 */
const CASES: [string, (value: Stringable) => unknown, unknown][] = [
  ["after", (v) => v.after("Hello ").toString(), Str.after("Hello World", "Hello ")],
  ["afterLast", (v) => v.afterLast("o").toString(), Str.afterLast("Hello World", "o")],
  ["before", (v) => v.before(" World").toString(), Str.before("Hello World", " World")],
  ["beforeLast", (v) => v.beforeLast("o").toString(), Str.beforeLast("Hello World", "o")],
  ["between", (v) => v.between("H", "d").toString(), Str.between("Hello World", "H", "d")],
  [
    "betweenFirst",
    (v) => v.betweenFirst("H", "o").toString(),
    Str.betweenFirst("Hello World", "H", "o"),
  ],
  ["charAt", (v) => v.charAt(1), Str.charAt("Hello World", 1)],
  ["chopStart", (v) => v.chopStart("Hello ").toString(), Str.chopStart("Hello World", "Hello ")],
  ["chopEnd", (v) => v.chopEnd("World").toString(), Str.chopEnd("Hello World", "World")],
  ["substr", (v) => v.substr(0, 5).toString(), Str.substr("Hello World", 0, 5)],
  [
    "substrReplace",
    (v) => v.substrReplace("J", 0, 1).toString(),
    Str.substrReplace("Hello World", "J", 0, 1),
  ],
  ["substrCount", (v) => v.substrCount("o"), Str.substrCount("Hello World", "o")],
  ["take", (v) => v.take(5).toString(), Str.take("Hello World", 5)],
  ["contains", (v) => v.contains("World"), Str.contains("Hello World", "World")],
  ["containsAll", (v) => v.containsAll(["Hello", "World"]), true],
  ["doesntContain", (v) => v.doesntContain("nope"), true],
  ["startsWith", (v) => v.startsWith("Hello"), true],
  ["endsWith", (v) => v.endsWith("World"), true],
  ["position", (v) => v.position("World"), Str.position("Hello World", "World")],
  ["is", (v) => v.is("Hello*"), true],
  ["isMatch", (v) => v.isMatch(/World/), true],
  ["match", (v) => v.match(/W\w+/).toString(), Str.match(/W\w+/, "Hello World")],
  ["matchAll", (v) => v.matchAll(/o/), Str.matchAll(/o/, "Hello World")],
  ["lower", (v) => v.lower().toString(), Str.lower("Hello World")],
  ["upper", (v) => v.upper().toString(), Str.upper("Hello World")],
  ["ucfirst", (v) => v.ucfirst().toString(), Str.ucfirst("Hello World")],
  ["lcfirst", (v) => v.lcfirst().toString(), Str.lcfirst("Hello World")],
  ["title", (v) => v.title().toString(), Str.title("Hello World")],
  ["apa", (v) => v.apa().toString(), Str.apa("Hello World")],
  ["convertCase", (v) => v.convertCase().toString(), Str.convertCase("Hello World")],
  ["camel", (v) => v.camel().toString(), Str.camel("Hello World")],
  ["studly", (v) => v.studly().toString(), Str.studly("Hello World")],
  ["snake", (v) => v.snake().toString(), Str.snake("Hello World")],
  ["kebab", (v) => v.kebab().toString(), Str.kebab("Hello World")],
  ["headline", (v) => v.headline().toString(), Str.headline("Hello World")],
  ["ucsplit", (v) => v.ucsplit(), Str.ucsplit("Hello World")],
  ["replace", (v) => v.replace("World", "You").toString(), "Hello You"],
  ["replaceArray", (v) => v.replaceArray("o", ["0"]).toString(), "Hell0 World"],
  ["replaceFirst", (v) => v.replaceFirst("o", "0").toString(), "Hell0 World"],
  ["replaceLast", (v) => v.replaceLast("o", "0").toString(), "Hello W0rld"],
  ["replaceStart", (v) => v.replaceStart("Hello", "Hi").toString(), "Hi World"],
  ["replaceEnd", (v) => v.replaceEnd("World", "You").toString(), "Hello You"],
  ["replaceMatches", (v) => v.replaceMatches(/o/, "0").toString(), "Hell0 W0rld"],
  ["remove", (v) => v.remove("l").toString(), Str.remove("l", "Hello World")],
  ["swap", (v) => v.swap({ World: "You" }).toString(), "Hello You"],
  ["mask", (v) => v.mask("*", 2).toString(), Str.mask("Hello World", "*", 2)],
  ["padBoth", (v) => v.padBoth(15, "-").toString(), Str.padBoth("Hello World", 15, "-")],
  ["padLeft", (v) => v.padLeft(15, "-").toString(), Str.padLeft("Hello World", 15, "-")],
  ["padRight", (v) => v.padRight(15, "-").toString(), Str.padRight("Hello World", 15, "-")],
  ["trim", (v) => v.trim("Hd").toString(), Str.trim("Hello World", "Hd")],
  ["ltrim", (v) => v.ltrim("H").toString(), Str.ltrim("Hello World", "H")],
  ["rtrim", (v) => v.rtrim("d").toString(), Str.rtrim("Hello World", "d")],
  ["squish", (v) => v.squish().toString(), Str.squish("Hello World")],
  ["deduplicate", (v) => v.deduplicate("l").toString(), Str.deduplicate("Hello World", "l")],
  ["start", (v) => v.start("> ").toString(), Str.start("Hello World", "> ")],
  ["finish", (v) => v.finish("!").toString(), Str.finish("Hello World", "!")],
  ["wrap", (v) => v.wrap('"').toString(), Str.wrap("Hello World", '"')],
  ["unwrap", (v) => v.unwrap("Hello ").toString(), Str.unwrap("Hello World", "Hello ")],
  ["wordWrap", (v) => v.wordWrap(5).toString(), Str.wordWrap("Hello World", 5)],
  ["length", (v) => v.length(), Str.length("Hello World")],
  ["limit", (v) => v.limit(5).toString(), Str.limit("Hello World", 5)],
  ["words", (v) => v.words(1).toString(), Str.words("Hello World", 1)],
  ["wordCount", (v) => v.wordCount(), Str.wordCount("Hello World")],
  ["excerpt", (v) => v.excerpt("World"), Str.excerpt("Hello World", "World")],
  ["plural", (v) => v.plural().toString(), Str.plural("Hello World")],
  ["singular", (v) => v.singular().toString(), Str.singular("Hello World")],
  ["pluralStudly", (v) => v.pluralStudly().toString(), Str.pluralStudly("Hello World")],
  ["ascii", (v) => v.ascii().toString(), Str.ascii("Hello World")],
  ["transliterate", (v) => v.transliterate().toString(), Str.transliterate("Hello World")],
  ["slug", (v) => v.slug().toString(), Str.slug("Hello World")],
  ["reverse", (v) => v.reverse().toString(), Str.reverse("Hello World")],
  ["repeat", (v) => v.repeat(2).toString(), Str.repeat("Hello World", 2)],
  ["numbers", (v) => v.numbers().toString(), Str.numbers("Hello World")],
  ["toBase64", (v) => v.toBase64().toString(), Str.toBase64("Hello World")],
  ["isAscii", (v) => v.isAscii(), true],
  ["isJson", (v) => v.isJson(), false],
  ["isUrl", (v) => v.isUrl(), false],
  ["isUuid", (v) => v.isUuid(), false],
  ["isUlid", (v) => v.isUlid(), false],
  ["explode", (v) => v.explode(" "), ["Hello", "World"]],
  ["split", (v) => v.split(" "), ["Hello", "World"]],
]

describe("Stringable delegates to the matching Str method", () => {
  test.each(CASES)("%s", (_name, run, expected) => {
    expect(run(str("Hello World"))).toStrictEqual(expected)
  })

  test("fromBase64 round-trips through the chain", () => {
    expect(str("Hello World").toBase64().fromBase64().toString()).toBe("Hello World")
  })

  test("fromBase64 yields an empty string on invalid input", () => {
    expect(str("!!not base64!!").fromBase64(true).toString()).toBe("")
  })

  test("whenEndsWith", () => {
    expect(str("Hello World").whenEndsWith("World", (v) => v.upper()).toString()).toBe(
      "HELLO WORLD",
    )
  })

  test("value / toJSON mirror toString", () => {
    expect(str("Hello").value()).toBe("Hello")
    expect(str("Hello").toJSON()).toBe("Hello")
  })
})

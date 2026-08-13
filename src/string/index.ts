/** @format */

import Stringable from "../stringable"
import { toAscii } from "../support/ascii"
import { pluralizeFor, singularize } from "../support/pluralizer"
import { MB_CASE_LOWER, MB_CASE_TITLE, MB_CASE_UPPER } from "../support/types"
import type { Dict } from "../support/types"
import type { ExcerptOptions } from "./type"

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

/** Words that stay lowercase in APA title case unless they lead or trail. */
const APA_MINOR_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "en", "for", "if", "in", "nor",
  "of", "on", "or", "per", "so", "the", "to", "v", "v.", "via", "vs", "vs.",
  "from", "into", "like", "over", "with", "upon",
])

/** Escape a literal so it can be embedded in a `RegExp`. */
function quote(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Split into code points so astral characters (emoji) count as one. */
function chars(value: string): string[] {
  return Array.from(value)
}

/** Coerce a single-or-many argument into an array. */
function many<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

/** Cryptographically strong random bytes, in Node and the browser alike. */
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  const source = globalThis.crypto

  if (source && typeof source.getRandomValues === "function") {
    source.getRandomValues(bytes)

    return bytes
  }

  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }

  return bytes
}

/**
 * Laravel's `Str` helper, ported to TypeScript.
 *
 * Every method is static and works on plain strings; use {@link Str.of} to get
 * a chainable `Stringable` instead.
 */
class Str {
  /* ------------------------------------------------------------------ *
   * Slicing
   * ------------------------------------------------------------------ */

  /** Everything after the first occurrence of `search`. */
  static after(subject: string, search: string): string {
    if (search === "") {
      return subject
    }

    const index = subject.indexOf(search)

    return index === -1 ? subject : subject.slice(index + search.length)
  }

  /** Everything after the last occurrence of `search`. */
  static afterLast(subject: string, search: string): string {
    if (search === "") {
      return subject
    }

    const index = subject.lastIndexOf(search)

    return index === -1 ? subject : subject.slice(index + search.length)
  }

  /** Everything before the first occurrence of `search`. */
  static before(subject: string, search: string): string {
    if (search === "") {
      return subject
    }

    const index = subject.indexOf(search)

    return index === -1 ? subject : subject.slice(0, index)
  }

  /** Everything before the last occurrence of `search`. */
  static beforeLast(subject: string, search: string): string {
    if (search === "") {
      return subject
    }

    const index = subject.lastIndexOf(search)

    return index === -1 ? subject : subject.slice(0, index)
  }

  /** The substring between `from` and the *last* `to`. */
  static between(subject: string, from: string, to: string): string {
    if (from === "" || to === "") {
      return subject
    }

    return Str.beforeLast(Str.after(subject, from), to)
  }

  /** The substring between `from` and the *first* `to`. */
  static betweenFirst(subject: string, from: string, to: string): string {
    if (from === "" || to === "") {
      return subject
    }

    return Str.before(Str.after(subject, from), to)
  }

  /** The character at `index`, or `false` when out of range. */
  static charAt(subject: string, index: number): string | false {
    const list = chars(subject)
    const position = index < 0 ? list.length + index : index

    return list[position] ?? false
  }

  /** Remove `needle` from the start of the string, if present. */
  static chopStart(subject: string, needle: string | string[]): string {
    for (const item of many(needle)) {
      if (item !== "" && subject.startsWith(item)) {
        return subject.slice(item.length)
      }
    }

    return subject
  }

  /** Remove `needle` from the end of the string, if present. */
  static chopEnd(subject: string, needle: string | string[]): string {
    for (const item of many(needle)) {
      if (item !== "" && subject.endsWith(item)) {
        return subject.slice(0, -item.length)
      }
    }

    return subject
  }

  /** First `limit` characters; a negative `limit` takes from the end. */
  static take(subject: string, limit: number): string {
    const list = chars(subject)

    return limit < 0 ? list.slice(limit).join("") : list.slice(0, limit).join("")
  }

  /** Portion of the string, PHP `mb_substr` style. */
  static substr(subject: string, start: number, length?: number | null): string {
    const list = chars(subject)
    const from = start < 0 ? Math.max(list.length + start, 0) : start

    if (length === undefined || length === null) {
      return list.slice(from).join("")
    }

    if (length < 0) {
      return list.slice(from, list.length + length).join("")
    }

    return list.slice(from, from + length).join("")
  }

  /** Replace a portion of the string with `replace`. */
  static substrReplace(
    subject: string,
    replace: string,
    offset = 0,
    length?: number | null,
  ): string {
    const list = chars(subject)
    const start = offset < 0 ? Math.max(list.length + offset, 0) : Math.min(offset, list.length)

    let end: number

    if (length === undefined || length === null) {
      end = list.length
    } else if (length < 0) {
      end = Math.max(list.length + length, start)
    } else {
      end = Math.min(start + length, list.length)
    }

    return list.slice(0, start).join("") + replace + list.slice(end).join("")
  }

  /** How many times `needle` occurs in `haystack`. */
  static substrCount(
    haystack: string,
    needle: string,
    offset = 0,
    length?: number | null,
  ): number {
    if (needle === "") {
      return 0
    }

    const scope =
      length === undefined || length === null
        ? haystack.slice(offset)
        : haystack.slice(offset, offset + length)

    let count = 0
    let index = scope.indexOf(needle)

    while (index !== -1) {
      count++
      index = scope.indexOf(needle, index + needle.length)
    }

    return count
  }

  /* ------------------------------------------------------------------ *
   * Searching
   * ------------------------------------------------------------------ */

  /** True when `haystack` contains any of the given needles. */
  static contains(
    haystack: string,
    needles: string | string[],
    ignoreCase = false,
  ): boolean {
    const subject = ignoreCase ? haystack.toLowerCase() : haystack

    return many(needles).some((needle) => {
      if (needle === "") {
        return false
      }

      return subject.includes(ignoreCase ? needle.toLowerCase() : needle)
    })
  }

  /** True when `haystack` contains every one of the given needles. */
  static containsAll(
    haystack: string,
    needles: string | string[],
    ignoreCase = false,
  ): boolean {
    const list = many(needles)

    return list.length > 0 && list.every((needle) => Str.contains(haystack, needle, ignoreCase))
  }

  /** True when `haystack` contains none of the given needles. */
  static doesntContain(
    haystack: string,
    needles: string | string[],
    ignoreCase = false,
  ): boolean {
    return !Str.contains(haystack, needles, ignoreCase)
  }

  /** True when the string starts with any of the given needles. */
  static startsWith(haystack: string, needles: string | string[]): boolean {
    return many(needles).some((needle) => needle !== "" && haystack.startsWith(needle))
  }

  /** True when the string ends with any of the given needles. */
  static endsWith(haystack: string, needles: string | string[]): boolean {
    return many(needles).some((needle) => needle !== "" && haystack.endsWith(needle))
  }

  /**
   * Index of `needle`, or `false` when absent.
   *
   * Returns `false` rather than `-1` to stay faithful to Laravel; guard with
   * `!== false` rather than a truthiness check, since `0` is a valid result.
   */
  static position(haystack: string, needle: string, offset = 0): number | false {
    const index = haystack.indexOf(needle, offset)

    return index === -1 ? false : index
  }

  /** Match a string against a `*`-wildcard pattern. */
  static is(
    pattern: string | string[],
    value: string,
    ignoreCase = false,
  ): boolean {
    return many(pattern).some((item) => {
      if (item === value) {
        return true
      }

      const expression = new RegExp(
        `^${quote(item).replace(/\\\*/g, ".*")}$`,
        ignoreCase ? "us" : "s",
      )

      return expression.test(value)
    })
  }

  /** Test the value against one or more regular expressions. */
  static isMatch(patterns: RegExp | RegExp[], value: string): boolean {
    return many(patterns).some((pattern) => new RegExp(pattern.source, pattern.flags.replace("g", "")).test(value))
  }

  /** The first regex match (or first capture group), or `""`. */
  static match(pattern: RegExp, subject: string): string {
    const result = new RegExp(pattern.source, pattern.flags.replace("g", "")).exec(subject)

    if (result === null) {
      return ""
    }

    return result[1] ?? result[0]
  }

  /** Every regex match (or every first capture group). */
  static matchAll(pattern: RegExp, subject: string): string[] {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
    const results = [...subject.matchAll(new RegExp(pattern.source, flags))]

    return results.map((result) => result[1] ?? result[0])
  }

  /* ------------------------------------------------------------------ *
   * Casing
   * ------------------------------------------------------------------ */

  /** Lowercase the whole string. */
  static lower(value: string): string {
    return value.toLowerCase()
  }

  /** Uppercase the whole string. */
  static upper(value: string): string {
    return value.toUpperCase()
  }

  /** Uppercase the first character. */
  static ucfirst(value: string): string {
    return Str.upper(Str.substr(value, 0, 1)) + Str.substr(value, 1)
  }

  /** Lowercase the first character. */
  static lcfirst(value: string): string {
    return Str.lower(Str.substr(value, 0, 1)) + Str.substr(value, 1)
  }

  /** Title Case Every Word. */
  static title(value: string): string {
    return value
      .toLowerCase()
      .replace(/(^|[^\p{L}\p{N}'])(\p{L})/gu, (_, boundary: string, letter: string) => boundary + letter.toUpperCase())
  }

  /** Title case following APA style, where minor words stay lowercase. */
  static apa(value: string): string {
    if (value.trim() === "") {
      return value
    }

    return value
      .split(/(\s+)/)
      .map((word, index, all) => {
        if (/^\s+$/.test(word)) {
          return word
        }

        const isEdge = index === 0 || index === all.length - 1
        const lower = word.toLowerCase()

        // Hyphenated compounds capitalise each part.
        if (word.includes("-")) {
          return word
            .split("-")
            .map((part) => (part.length > 3 || isEdge ? Str.ucfirst(part.toLowerCase()) : part.toLowerCase()))
            .join("-")
        }

        if (!isEdge && APA_MINOR_WORDS.has(lower) && lower.length <= 3) {
          return lower
        }

        if (!isEdge && APA_MINOR_WORDS.has(lower)) {
          return lower
        }

        // Preserve deliberate acronyms such as "NASA".
        if (word.length > 1 && word === word.toUpperCase() && /\p{L}/u.test(word)) {
          return word
        }

        return Str.ucfirst(lower)
      })
      .join("")
  }

  /** Convert case using one of the `MB_CASE_*` modes. */
  static convertCase(value: string, mode: number = MB_CASE_UPPER): string {
    switch (mode) {
      case MB_CASE_LOWER:
        return Str.lower(value)
      case MB_CASE_TITLE:
        return Str.title(value)
      case MB_CASE_UPPER:
      default:
        return Str.upper(value)
    }
  }

  /** `foo_bar` / `foo-bar` / `foo bar` → `fooBar`. */
  static camel(value: string): string {
    return Str.lcfirst(Str.studly(value))
  }

  /** `foo_bar` / `foo-bar` / `foo bar` → `FooBar`. */
  static studly(value: string): string {
    return value
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((word) => Str.ucfirst(word))
      .join("")
  }

  /** `fooBar` → `foo_bar` (or any other delimiter). */
  static snake(value: string, delimiter = "_"): string {
    if (value === value.toLowerCase()) {
      return value.replace(/\s+/gu, delimiter)
    }

    const collapsed = value.replace(/\s+/gu, "")

    return Str.lower(collapsed.replace(/(.)(?=\p{Lu})/gu, `$1${delimiter}`))
  }

  /** `fooBar` → `foo-bar`. */
  static kebab(value: string): string {
    return Str.snake(value, "-")
  }

  /** `steve_jobs` → `Steve Jobs`. */
  static headline(value: string): string {
    const parts = value.split(" ")

    const words =
      parts.length > 1
        ? parts.map((part) => Str.title(part))
        : Str.ucsplit(parts.join("_")).map((part) => Str.title(part))

    const collapsed = words.join("_").replace(/[-_ ]/g, "_")

    return collapsed.split("_").filter(Boolean).join(" ")
  }

  /** Split a string on uppercase boundaries: `FooBar` → `["Foo", "Bar"]`. */
  static ucsplit(value: string): string[] {
    return value.split(/(?=\p{Lu})/u).filter((part) => part !== "")
  }

  /* ------------------------------------------------------------------ *
   * Replacement
   * ------------------------------------------------------------------ */

  /** Replace every occurrence of `search` (string or list) with `replace`. */
  static replace(
    search: string | string[],
    replace: string | string[],
    subject: string,
    caseSensitive = true,
  ): string {
    const searches = many(search)
    const replacements = many(replace)

    return searches.reduce((carry, needle, index) => {
      const value = Array.isArray(replace)
        ? (replacements[index] ?? "")
        : (replacements[0] ?? "")

      if (needle === "") {
        return carry
      }

      if (caseSensitive) {
        return carry.split(needle).join(value)
      }

      return carry.replace(new RegExp(quote(needle), "giu"), () => value)
    }, subject)
  }

  /** Sequentially replace each `?` placeholder with the next replacement. */
  static replaceArray(search: string, replace: string[], subject: string): string {
    let index = 0

    return subject.split(search).reduce((carry, segment, position) => {
      if (position === 0) {
        return segment
      }

      const value = replace[index] !== undefined ? replace[index] : search
      index++

      return carry + value + segment
    }, "")
  }

  /** Replace only the first occurrence. */
  static replaceFirst(search: string, replace: string, subject: string): string {
    if (search === "") {
      return subject
    }

    const index = subject.indexOf(search)

    if (index === -1) {
      return subject
    }

    return subject.slice(0, index) + replace + subject.slice(index + search.length)
  }

  /** Replace only the last occurrence. */
  static replaceLast(search: string, replace: string, subject: string): string {
    if (search === "") {
      return subject
    }

    const index = subject.lastIndexOf(search)

    if (index === -1) {
      return subject
    }

    return subject.slice(0, index) + replace + subject.slice(index + search.length)
  }

  /** Replace `search` only when the subject starts with it. */
  static replaceStart(search: string, replace: string, subject: string): string {
    if (search !== "" && subject.startsWith(search)) {
      return replace + subject.slice(search.length)
    }

    return subject
  }

  /** Replace `search` only when the subject ends with it. */
  static replaceEnd(search: string, replace: string, subject: string): string {
    if (search !== "" && subject.endsWith(search)) {
      return subject.slice(0, subject.length - search.length) + replace
    }

    return subject
  }

  /** Replace every regex match. */
  static replaceMatches(
    pattern: RegExp,
    replace: string | ((match: string, ...groups: any[]) => string),
    subject: string,
  ): string {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
    const expression = new RegExp(pattern.source, flags)

    return typeof replace === "function"
      ? subject.replace(expression, replace as (...args: any[]) => string)
      : subject.replace(expression, replace)
  }

  /** Remove every occurrence of the given value(s). */
  static remove(
    search: string | string[],
    subject: string,
    caseSensitive = true,
  ): string {
    return Str.replace(search, "", subject, caseSensitive)
  }

  /** Swap multiple keys for their mapped values in a single pass. */
  static swap(map: Dict<string>, subject: string): string {
    const keys = Object.keys(map).filter((key) => key !== "")

    if (keys.length === 0) {
      return subject
    }

    keys.sort((a, b) => b.length - a.length)

    const expression = new RegExp(keys.map(quote).join("|"), "gu")

    return subject.replace(expression, (matched) => map[matched] ?? matched)
  }

  /** Mask a portion of the string with a repeated character. */
  static mask(
    subject: string,
    character: string,
    index: number,
    length?: number | null,
  ): string {
    if (character === "") {
      return subject
    }

    const list = chars(subject)
    const start = index < 0 ? (index < -list.length ? 0 : list.length + index) : index
    const segment = Str.substr(subject, index, length)

    if (segment === "") {
      return subject
    }

    const size = chars(segment).length

    return (
      list.slice(0, start).join("") +
      (chars(character)[0] ?? "").repeat(size) +
      list.slice(start + size).join("")
    )
  }

  /* ------------------------------------------------------------------ *
   * Padding, trimming and wrapping
   * ------------------------------------------------------------------ */

  /** Pad both sides to `length`. */
  static padBoth(value: string, length: number, pad = " "): string {
    const short = Math.max(0, length - chars(value).length)
    const left = Math.floor(short / 2)
    const right = short - left

    return Str.buildPad(pad, left) + value + Str.buildPad(pad, right)
  }

  /** Pad the left side to `length`. */
  static padLeft(value: string, length: number, pad = " "): string {
    const short = Math.max(0, length - chars(value).length)

    return Str.buildPad(pad, short) + value
  }

  /** Pad the right side to `length`. */
  static padRight(value: string, length: number, pad = " "): string {
    const short = Math.max(0, length - chars(value).length)

    return value + Str.buildPad(pad, short)
  }

  private static buildPad(pad: string, length: number): string {
    if (length <= 0 || pad === "") {
      return ""
    }

    return Str.substr(pad.repeat(Math.ceil(length / chars(pad).length)), 0, length)
  }

  /** Trim whitespace, or any of the given characters, from both ends. */
  static trim(value: string, charlist?: string): string {
    return Str.rtrim(Str.ltrim(value, charlist), charlist)
  }

  /** Trim from the left. */
  static ltrim(value: string, charlist?: string): string {
    if (charlist === undefined) {
      return value.replace(/^[\s﻿\xA0]+/u, "")
    }

    return value.replace(new RegExp(`^[${quote(charlist)}]+`, "u"), "")
  }

  /** Trim from the right. */
  static rtrim(value: string, charlist?: string): string {
    if (charlist === undefined) {
      return value.replace(/[\s﻿\xA0]+$/u, "")
    }

    return value.replace(new RegExp(`[${quote(charlist)}]+$`, "u"), "")
  }

  /** Collapse runs of whitespace and trim the result. */
  static squish(value: string): string {
    return value.replace(/\s+/gu, " ").trim()
  }

  /** Collapse repeated occurrences of a character into one. */
  static deduplicate(value: string, character: string | string[] = " "): string {
    return many(character).reduce(
      (carry, item) => carry.replace(new RegExp(`${quote(item)}+`, "gu"), item),
      value,
    )
  }

  /** Prefix the string with `prefix` unless it already starts with it. */
  static start(value: string, prefix: string): string {
    if (prefix === "") {
      return value
    }

    return prefix + value.replace(new RegExp(`^(?:${quote(prefix)})+`, "u"), "")
  }

  /** Suffix the string with `cap` unless it already ends with it. */
  static finish(value: string, cap: string): string {
    if (cap === "") {
      return value
    }

    return value.replace(new RegExp(`(?:${quote(cap)})+$`, "u"), "") + cap
  }

  /** Wrap the string with the given delimiters. */
  static wrap(value: string, before: string, after?: string): string {
    return before + value + (after ?? before)
  }

  /** Remove the given delimiters when both are present. */
  static unwrap(value: string, before: string, after?: string): string {
    const suffix = after ?? before
    let result = value

    if (before !== "" && result.startsWith(before)) {
      result = result.slice(before.length)
    }

    if (suffix !== "" && result.endsWith(suffix)) {
      result = result.slice(0, result.length - suffix.length)
    }

    return result
  }

  /** Hard-wrap the string at `characters` columns. */
  static wordWrap(
    value: string,
    characters = 75,
    breakWith = "\n",
    cutLongWords = false,
  ): string {
    return value
      .split("\n")
      .map((line) => {
        const words = line.split(" ")
        const lines: string[] = []
        let current = ""

        for (let word of words) {
          while (cutLongWords && word.length > characters) {
            if (current !== "") {
              lines.push(current)
              current = ""
            }

            lines.push(word.slice(0, characters))
            word = word.slice(characters)
          }

          if (current === "") {
            current = word
          } else if (current.length + 1 + word.length <= characters) {
            current += ` ${word}`
          } else {
            lines.push(current)
            current = word
          }
        }

        lines.push(current)

        return lines.join(breakWith)
      })
      .join("\n")
  }

  /* ------------------------------------------------------------------ *
   * Truncation
   * ------------------------------------------------------------------ */

  /** The string's length in code points. */
  static length(value: string): number {
    return chars(value).length
  }

  /** Truncate to `limit` characters. */
  static limit(
    value: string,
    limit = 100,
    end = "...",
    preserveWords = false,
  ): string {
    const list = chars(value)

    if (list.length <= limit) {
      return value
    }

    const trimmed = Str.rtrim(list.slice(0, limit).join(""))

    if (!preserveWords) {
      return trimmed + end
    }

    if (list[limit] === " ") {
      return trimmed + end
    }

    const lastSpace = trimmed.lastIndexOf(" ")

    return (lastSpace === -1 ? trimmed : trimmed.slice(0, lastSpace)) + end
  }

  /** Truncate to a whole number of words. */
  static words(value: string, words = 100, end = "..."): string {
    const matched = new RegExp(`^\\s*(?:\\S+\\s*){1,${words}}`, "u").exec(value)

    if (matched === null || Str.length(value) === Str.length(matched[0])) {
      return value
    }

    return Str.rtrim(matched[0]) + end
  }

  /** Number of words in the string. */
  static wordCount(value: string): number {
    const matched = value.match(/[\p{L}\p{N}'-]+/gu)

    return matched === null ? 0 : matched.length
  }

  /** An excerpt of `text` around the first occurrence of `phrase`. */
  static excerpt(
    text: string,
    phrase = "",
    options: ExcerptOptions = {},
  ): string | null {
    const radius = options.radius ?? 100
    const omission = options.omission ?? "..."
    const index = phrase === "" ? 0 : text.toLowerCase().indexOf(phrase.toLowerCase())

    if (index === -1) {
      return null
    }

    const list = chars(text)
    const start = Math.max(index - radius, 0)
    const end = Math.min(index + chars(phrase).length + radius, list.length)

    const prefix = start > 0 ? omission : ""
    const suffix = end < list.length ? omission : ""

    return prefix + Str.trim(list.slice(start, end).join("")) + suffix
  }

  /* ------------------------------------------------------------------ *
   * Inflection
   * ------------------------------------------------------------------ */

  /** Pluralize a word, optionally only when `count !== 1`. */
  static plural(value: string, count: number | any[] = 2): string {
    const size = Array.isArray(count) ? count.length : count

    return pluralizeFor(value, size)
  }

  /** Singularize a word. */
  static singular(value: string): string {
    return singularize(value)
  }

  /** Pluralize the last word of a studly-cased string. */
  static pluralStudly(value: string, count: number | any[] = 2): string {
    const parts = Str.ucsplit(value)
    const last = parts.pop() ?? ""

    return parts.join("") + Str.plural(last, count)
  }

  /** Alias of {@link Str.pluralStudly}. */
  static pluralPascal(value: string, count: number | any[] = 2): string {
    return Str.pluralStudly(value, count)
  }

  /* ------------------------------------------------------------------ *
   * Transformation
   * ------------------------------------------------------------------ */

  /** Transliterate the string to ASCII. */
  static ascii(value: string): string {
    return toAscii(value, "")
  }

  /** Transliterate, substituting `unknown` for untranslatable characters. */
  static transliterate(value: string, unknown = "?"): string {
    return toAscii(value, unknown)
  }

  /** Generate a URL-friendly slug. */
  static slug(
    title: string,
    separator = "-",
    dictionary: Dict<string> = { "@": "at" },
  ): string {
    let value = Str.ascii(title)

    const flip = separator === "-" ? "_" : "-"
    value = value.replace(new RegExp(`[${quote(flip)}]+`, "gu"), separator)

    for (const [key, replacement] of Object.entries(dictionary)) {
      value = value.split(key).join(`${separator}${replacement}${separator}`)
    }

    value = Str.lower(value).replace(
      new RegExp(`[^${quote(separator)}\\p{L}\\p{N}\\s]+`, "gu"),
      "",
    )

    value = value.replace(new RegExp(`[${quote(separator)}\\s]+`, "gu"), separator)

    return Str.trim(value, separator)
  }

  /** Reverse the string, keeping astral characters intact. */
  static reverse(value: string): string {
    return chars(value).reverse().join("")
  }

  /** Repeat the string `times` times. */
  static repeat(value: string, times: number): string {
    return times <= 0 ? "" : value.repeat(times)
  }

  /** Keep only the digits in the string. */
  static numbers(value: string): string {
    return value.replace(/\D/g, "")
  }

  /** Base64-encode the string (UTF-8 safe). */
  static toBase64(value: string): string {
    const bytes = new TextEncoder().encode(value)

    let binary = ""

    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }

    return btoa(binary)
  }

  /** Base64-decode the string, or `false` when the input is not valid. */
  static fromBase64(value: string, strict = false): string | false {
    try {
      if (strict && !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
        return false
      }

      const binary = atob(value)
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

      return new TextDecoder().decode(bytes)
    } catch {
      return false
    }
  }

  /* ------------------------------------------------------------------ *
   * Validation
   * ------------------------------------------------------------------ */

  /** True when every character is 7-bit ASCII. */
  static isAscii(value: string): boolean {
    // eslint-disable-next-line no-control-regex
    return /^[\x00-\x7F]*$/.test(value)
  }

  /** True when the string parses as JSON. */
  static isJson(value: string): boolean {
    if (typeof value !== "string" || value.trim() === "") {
      return false
    }

    try {
      JSON.parse(value)

      return true
    } catch {
      return false
    }
  }

  /** True when the string is a well-formed URL. */
  static isUrl(value: string, protocols: string[] = []): boolean {
    try {
      const url = new URL(value)

      if (protocols.length === 0) {
        return true
      }

      return protocols.includes(url.protocol.replace(":", ""))
    } catch {
      return false
    }
  }

  /** True when the string is a valid UUID (any version). */
  static isUuid(value: string, version?: number): boolean {
    if (version === undefined) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    }

    return new RegExp(
      `^[0-9a-f]{8}-[0-9a-f]{4}-${version}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
      "i",
    ).test(value)
  }

  /** True when the string is a valid ULID. */
  static isUlid(value: string): boolean {
    return /^[0-7][0-9ABCDEFGHJKMNPQRSTVWXYZ]{25}$/i.test(value)
  }

  /* ------------------------------------------------------------------ *
   * Generation
   * ------------------------------------------------------------------ */

  /** A random alphanumeric string. */
  static random(length = 16): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    const bytes = randomBytes(length)

    let out = ""

    for (let i = 0; i < length; i++) {
      out += alphabet[(bytes[i] ?? 0) % alphabet.length]
    }

    return out
  }

  /** A random password built from the requested character classes. */
  static password(
    length = 32,
    letters = true,
    numbers = true,
    symbols = true,
    spaces = false,
  ): string {
    let pool = ""

    if (letters) {
      pool += "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    }

    if (numbers) {
      pool += "0123456789"
    }

    if (symbols) {
      pool += "~!#$%^&*()-_.,<>?/\\{}[]|:;"
    }

    if (spaces) {
      pool += " "
    }

    if (pool === "") {
      return ""
    }

    const bytes = randomBytes(length)

    let out = ""

    for (let i = 0; i < length; i++) {
      out += pool[(bytes[i] ?? 0) % pool.length]
    }

    return out
  }

  /** A random UUID v4. */
  static uuid(): string {
    const source = globalThis.crypto

    if (source && typeof source.randomUUID === "function") {
      return source.randomUUID()
    }

    const bytes = randomBytes(16)
    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join("-")
  }

  /** A time-ordered UUID v7. */
  static uuid7(time?: Date): string {
    const timestamp = (time ?? new Date()).getTime()
    const bytes = randomBytes(16)

    const hexTime = timestamp.toString(16).padStart(12, "0")

    for (let i = 0; i < 6; i++) {
      bytes[i] = Number.parseInt(hexTime.slice(i * 2, i * 2 + 2), 16)
    }

    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join("-")
  }

  /** Alias of {@link Str.uuid7} — a time-ordered identifier. */
  static orderedUuid(time?: Date): string {
    return Str.uuid7(time)
  }

  /** A ULID: 48-bit timestamp plus 80 bits of randomness, Crockford base32. */
  static ulid(time?: Date): string {
    let timestamp = (time ?? new Date()).getTime()

    let head = ""

    for (let i = 0; i < 10; i++) {
      head = (CROCKFORD[timestamp % 32] ?? "0") + head
      timestamp = Math.floor(timestamp / 32)
    }

    const bytes = randomBytes(16)

    let tail = ""

    for (let i = 0; i < 16; i++) {
      tail += CROCKFORD[(bytes[i] ?? 0) % 32]
    }

    return head + tail
  }

  /* ------------------------------------------------------------------ *
   * Misc
   * ------------------------------------------------------------------ */

  /** Begin a fluent {@link Stringable} chain. */
  static of(value: string): Stringable {
    return new Stringable(value)
  }

  /** Split the string, dropping empty segments when `limit` is omitted. */
  static explode(value: string, delimiter: string, limit?: number): string[] {
    const parts = value.split(delimiter)

    if (limit === undefined) {
      return parts
    }

    if (limit > 0) {
      return parts.length <= limit
        ? parts
        : [...parts.slice(0, limit - 1), parts.slice(limit - 1).join(delimiter)]
    }

    return parts.slice(0, limit)
  }
}

export default Str

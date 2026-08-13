/** @format */

import Str from "../string"
import type { ExcerptOptions } from "../string/type"
import type { Dict } from "../support/types"

/**
 * A fluent, chainable wrapper around {@link Str}.
 *
 * Every transforming method returns a new `Stringable`, so calls compose:
 *
 * ```ts
 * str(" Laravel Framework ").squish().slug().toString() // "laravel-framework"
 * ```
 */
class Stringable {
  constructor(protected readonly raw: string = "") {}

  /** Wrap a fresh value in a `Stringable`. */
  protected next(value: string): Stringable {
    return new Stringable(value)
  }

  /* ------------------------------------------------------------------ *
   * Slicing
   * ------------------------------------------------------------------ */

  after(search: string): Stringable {
    return this.next(Str.after(this.raw, search))
  }

  afterLast(search: string): Stringable {
    return this.next(Str.afterLast(this.raw, search))
  }

  before(search: string): Stringable {
    return this.next(Str.before(this.raw, search))
  }

  beforeLast(search: string): Stringable {
    return this.next(Str.beforeLast(this.raw, search))
  }

  between(from: string, to: string): Stringable {
    return this.next(Str.between(this.raw, from, to))
  }

  betweenFirst(from: string, to: string): Stringable {
    return this.next(Str.betweenFirst(this.raw, from, to))
  }

  charAt(index: number): string | false {
    return Str.charAt(this.raw, index)
  }

  chopStart(needle: string | string[]): Stringable {
    return this.next(Str.chopStart(this.raw, needle))
  }

  chopEnd(needle: string | string[]): Stringable {
    return this.next(Str.chopEnd(this.raw, needle))
  }

  substr(start: number, length?: number | null): Stringable {
    return this.next(Str.substr(this.raw, start, length))
  }

  substrReplace(replace: string, offset = 0, length?: number | null): Stringable {
    return this.next(Str.substrReplace(this.raw, replace, offset, length))
  }

  substrCount(needle: string, offset = 0, length?: number | null): number {
    return Str.substrCount(this.raw, needle, offset, length)
  }

  take(limit: number): Stringable {
    return this.next(Str.take(this.raw, limit))
  }

  /* ------------------------------------------------------------------ *
   * Searching
   * ------------------------------------------------------------------ */

  contains(needles: string | string[], ignoreCase = false): boolean {
    return Str.contains(this.raw, needles, ignoreCase)
  }

  containsAll(needles: string | string[], ignoreCase = false): boolean {
    return Str.containsAll(this.raw, needles, ignoreCase)
  }

  doesntContain(needles: string | string[], ignoreCase = false): boolean {
    return Str.doesntContain(this.raw, needles, ignoreCase)
  }

  startsWith(needles: string | string[]): boolean {
    return Str.startsWith(this.raw, needles)
  }

  endsWith(needles: string | string[]): boolean {
    return Str.endsWith(this.raw, needles)
  }

  position(needle: string, offset = 0): number | false {
    return Str.position(this.raw, needle, offset)
  }

  is(pattern: string | string[], ignoreCase = false): boolean {
    return Str.is(pattern, this.raw, ignoreCase)
  }

  isMatch(patterns: RegExp | RegExp[]): boolean {
    return Str.isMatch(patterns, this.raw)
  }

  match(pattern: RegExp): Stringable {
    return this.next(Str.match(pattern, this.raw))
  }

  matchAll(pattern: RegExp): string[] {
    return Str.matchAll(pattern, this.raw)
  }

  /** Exact comparison against another value. */
  exactly(value: string | Stringable): boolean {
    return this.raw === value.toString()
  }

  /* ------------------------------------------------------------------ *
   * Casing
   * ------------------------------------------------------------------ */

  lower(): Stringable {
    return this.next(Str.lower(this.raw))
  }

  upper(): Stringable {
    return this.next(Str.upper(this.raw))
  }

  ucfirst(): Stringable {
    return this.next(Str.ucfirst(this.raw))
  }

  lcfirst(): Stringable {
    return this.next(Str.lcfirst(this.raw))
  }

  title(): Stringable {
    return this.next(Str.title(this.raw))
  }

  apa(): Stringable {
    return this.next(Str.apa(this.raw))
  }

  convertCase(mode?: number): Stringable {
    return this.next(Str.convertCase(this.raw, mode))
  }

  camel(): Stringable {
    return this.next(Str.camel(this.raw))
  }

  studly(): Stringable {
    return this.next(Str.studly(this.raw))
  }

  snake(delimiter = "_"): Stringable {
    return this.next(Str.snake(this.raw, delimiter))
  }

  kebab(): Stringable {
    return this.next(Str.kebab(this.raw))
  }

  headline(): Stringable {
    return this.next(Str.headline(this.raw))
  }

  ucsplit(): string[] {
    return Str.ucsplit(this.raw)
  }

  /* ------------------------------------------------------------------ *
   * Replacement
   * ------------------------------------------------------------------ */

  replace(
    search: string | string[],
    replace: string | string[],
    caseSensitive = true,
  ): Stringable {
    return this.next(Str.replace(search, replace, this.raw, caseSensitive))
  }

  replaceArray(search: string, replace: string[]): Stringable {
    return this.next(Str.replaceArray(search, replace, this.raw))
  }

  replaceFirst(search: string, replace: string): Stringable {
    return this.next(Str.replaceFirst(search, replace, this.raw))
  }

  replaceLast(search: string, replace: string): Stringable {
    return this.next(Str.replaceLast(search, replace, this.raw))
  }

  replaceStart(search: string, replace: string): Stringable {
    return this.next(Str.replaceStart(search, replace, this.raw))
  }

  replaceEnd(search: string, replace: string): Stringable {
    return this.next(Str.replaceEnd(search, replace, this.raw))
  }

  replaceMatches(
    pattern: RegExp,
    replace: string | ((match: string, ...groups: any[]) => string),
  ): Stringable {
    return this.next(Str.replaceMatches(pattern, replace, this.raw))
  }

  remove(search: string | string[], caseSensitive = true): Stringable {
    return this.next(Str.remove(search, this.raw, caseSensitive))
  }

  swap(map: Dict<string>): Stringable {
    return this.next(Str.swap(map, this.raw))
  }

  mask(character: string, index: number, length?: number | null): Stringable {
    return this.next(Str.mask(this.raw, character, index, length))
  }

  /* ------------------------------------------------------------------ *
   * Padding, trimming and wrapping
   * ------------------------------------------------------------------ */

  padBoth(length: number, pad = " "): Stringable {
    return this.next(Str.padBoth(this.raw, length, pad))
  }

  padLeft(length: number, pad = " "): Stringable {
    return this.next(Str.padLeft(this.raw, length, pad))
  }

  padRight(length: number, pad = " "): Stringable {
    return this.next(Str.padRight(this.raw, length, pad))
  }

  trim(charlist?: string): Stringable {
    return this.next(Str.trim(this.raw, charlist))
  }

  ltrim(charlist?: string): Stringable {
    return this.next(Str.ltrim(this.raw, charlist))
  }

  rtrim(charlist?: string): Stringable {
    return this.next(Str.rtrim(this.raw, charlist))
  }

  squish(): Stringable {
    return this.next(Str.squish(this.raw))
  }

  deduplicate(character: string | string[] = " "): Stringable {
    return this.next(Str.deduplicate(this.raw, character))
  }

  start(prefix: string): Stringable {
    return this.next(Str.start(this.raw, prefix))
  }

  finish(cap: string): Stringable {
    return this.next(Str.finish(this.raw, cap))
  }

  wrap(before: string, after?: string): Stringable {
    return this.next(Str.wrap(this.raw, before, after))
  }

  unwrap(before: string, after?: string): Stringable {
    return this.next(Str.unwrap(this.raw, before, after))
  }

  wordWrap(characters = 75, breakWith = "\n", cutLongWords = false): Stringable {
    return this.next(Str.wordWrap(this.raw, characters, breakWith, cutLongWords))
  }

  /** Append the given values. */
  append(...values: string[]): Stringable {
    return this.next(this.raw + values.join(""))
  }

  /** Prepend the given values. */
  prepend(...values: string[]): Stringable {
    return this.next(values.join("") + this.raw)
  }

  /* ------------------------------------------------------------------ *
   * Truncation
   * ------------------------------------------------------------------ */

  length(): number {
    return Str.length(this.raw)
  }

  limit(limit = 100, end = "...", preserveWords = false): Stringable {
    return this.next(Str.limit(this.raw, limit, end, preserveWords))
  }

  words(words = 100, end = "..."): Stringable {
    return this.next(Str.words(this.raw, words, end))
  }

  wordCount(): number {
    return Str.wordCount(this.raw)
  }

  excerpt(phrase = "", options: ExcerptOptions = {}): string | null {
    return Str.excerpt(this.raw, phrase, options)
  }

  /* ------------------------------------------------------------------ *
   * Inflection and transformation
   * ------------------------------------------------------------------ */

  plural(count: number | any[] = 2): Stringable {
    return this.next(Str.plural(this.raw, count))
  }

  singular(): Stringable {
    return this.next(Str.singular(this.raw))
  }

  pluralStudly(count: number | any[] = 2): Stringable {
    return this.next(Str.pluralStudly(this.raw, count))
  }

  ascii(): Stringable {
    return this.next(Str.ascii(this.raw))
  }

  transliterate(unknown = "?"): Stringable {
    return this.next(Str.transliterate(this.raw, unknown))
  }

  slug(separator = "-", dictionary: Dict<string> = { "@": "at" }): Stringable {
    return this.next(Str.slug(this.raw, separator, dictionary))
  }

  reverse(): Stringable {
    return this.next(Str.reverse(this.raw))
  }

  repeat(times: number): Stringable {
    return this.next(Str.repeat(this.raw, times))
  }

  numbers(): Stringable {
    return this.next(Str.numbers(this.raw))
  }

  toBase64(): Stringable {
    return this.next(Str.toBase64(this.raw))
  }

  fromBase64(strict = false): Stringable {
    return this.next(Str.fromBase64(this.raw, strict) || "")
  }

  /** The path component after the last slash, minus an optional suffix. */
  basename(suffix = ""): Stringable {
    const base = this.raw.replace(/[\\/]+$/, "").split(/[\\/]/).pop() ?? ""

    return this.next(suffix !== "" && base.endsWith(suffix) ? base.slice(0, -suffix.length) : base)
  }

  /** The directory portion of a path. */
  dirname(levels = 1): Stringable {
    let path = this.raw.replace(/[\\/]+$/, "")

    for (let i = 0; i < levels; i++) {
      const index = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"))
      path = index <= 0 ? (path.startsWith("/") ? "/" : ".") : path.slice(0, index)
    }

    return this.next(path)
  }

  /* ------------------------------------------------------------------ *
   * Validation
   * ------------------------------------------------------------------ */

  isAscii(): boolean {
    return Str.isAscii(this.raw)
  }

  isJson(): boolean {
    return Str.isJson(this.raw)
  }

  isUrl(protocols: string[] = []): boolean {
    return Str.isUrl(this.raw, protocols)
  }

  isUuid(version?: number): boolean {
    return Str.isUuid(this.raw, version)
  }

  isUlid(): boolean {
    return Str.isUlid(this.raw)
  }

  isEmpty(): boolean {
    return this.raw === ""
  }

  isNotEmpty(): boolean {
    return this.raw !== ""
  }

  /* ------------------------------------------------------------------ *
   * Conditionals and escape hatches
   * ------------------------------------------------------------------ */

  /** Split into an array on a delimiter or pattern. */
  explode(delimiter: string, limit?: number): string[] {
    return Str.explode(this.raw, delimiter, limit)
  }

  /** Split into `limit` chunks, or on a delimiter. */
  split(pattern: string | RegExp, limit?: number): string[] {
    return this.raw.split(pattern as any, limit)
  }

  /** Pass the string through a callback and return its result. */
  pipe<T>(callback: (value: string) => T): T {
    return callback(this.raw)
  }

  /** Run a side effect without breaking the chain. */
  tap(callback: (value: Stringable) => void): Stringable {
    callback(this)

    return this
  }

  /** Apply `callback` only when `condition` is truthy. */
  when(
    condition: unknown,
    callback: (value: Stringable) => Stringable | void,
    fallback?: (value: Stringable) => Stringable | void,
  ): Stringable {
    const resolved = typeof condition === "function" ? condition(this) : condition

    if (resolved) {
      return callback(this) ?? this
    }

    if (fallback) {
      return fallback(this) ?? this
    }

    return this
  }

  /** Apply `callback` only when `condition` is falsy. */
  unless(
    condition: unknown,
    callback: (value: Stringable) => Stringable | void,
    fallback?: (value: Stringable) => Stringable | void,
  ): Stringable {
    return this.when(!condition, callback, fallback)
  }

  whenEmpty(callback: (value: Stringable) => Stringable | void): Stringable {
    return this.when(this.isEmpty(), callback)
  }

  whenNotEmpty(callback: (value: Stringable) => Stringable | void): Stringable {
    return this.when(this.isNotEmpty(), callback)
  }

  whenContains(
    needles: string | string[],
    callback: (value: Stringable) => Stringable | void,
  ): Stringable {
    return this.when(this.contains(needles), callback)
  }

  whenStartsWith(
    needles: string | string[],
    callback: (value: Stringable) => Stringable | void,
  ): Stringable {
    return this.when(this.startsWith(needles), callback)
  }

  whenEndsWith(
    needles: string | string[],
    callback: (value: Stringable) => Stringable | void,
  ): Stringable {
    return this.when(this.endsWith(needles), callback)
  }

  /* ------------------------------------------------------------------ *
   * Output
   * ------------------------------------------------------------------ */

  /** The underlying string. */
  toString(): string {
    return this.raw
  }

  /** Alias of {@link Stringable.toString}. */
  value(): string {
    return this.raw
  }

  /** Alias of {@link Stringable.toString}. */
  toJSON(): string {
    return this.raw
  }

  toInteger(radix = 10): number {
    const parsed = Number.parseInt(this.raw, radix)

    return Number.isNaN(parsed) ? 0 : parsed
  }

  toFloat(): number {
    const parsed = Number.parseFloat(this.raw)

    return Number.isNaN(parsed) ? 0 : parsed
  }

  toBoolean(): boolean {
    return ["1", "true", "on", "yes"].includes(this.raw.trim().toLowerCase())
  }

  toDate(): Date {
    return new Date(this.raw)
  }

  /** Allow implicit string coercion (`` `${str("a")}` ``). */
  [Symbol.toPrimitive](): string {
    return this.raw
  }
}

export default Stringable

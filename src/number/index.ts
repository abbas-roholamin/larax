/** @format */

import type { ClampProps, FileSizeOptions, FormatOptions } from "./type"

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
]

const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty",
  "ninety",
]

const SCALES: [number, string][] = [
  [1e12, "trillion"],
  [1e9, "billion"],
  [1e6, "million"],
  [1e3, "thousand"],
  [100, "hundred"],
]

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
const ABBREVIATIONS = ["", "K", "M", "B", "T", "Q"]

const HUMAN_UNITS: [number, string][] = [
  [1e15, "quadrillion"],
  [1e12, "trillion"],
  [1e9, "billion"],
  [1e6, "million"],
  [1e3, "thousand"],
]

/** Detect the legacy single-object call style: `Num.clamp({num, min, max})`. */
function isClampProps(value: unknown): value is ClampProps {
  return (
    typeof value === "object" &&
    value !== null &&
    "num" in value &&
    "min" in value &&
    "max" in value
  )
}

/** Spell out an integer below one thousand. */
function spellSmall(number: number): string {
  if (number < 20) {
    return ONES[number] as string
  }

  if (number < 100) {
    const tens = TENS[Math.floor(number / 10)] as string
    const rest = number % 10

    return rest === 0 ? tens : `${tens}-${ONES[rest]}`
  }

  const hundreds = `${ONES[Math.floor(number / 100)]} hundred`
  const rest = number % 100

  return rest === 0 ? hundreds : `${hundreds} ${spellSmall(rest)}`
}

/**
 * Laravel's `Number` helper, ported to TypeScript on top of `Intl`.
 *
 * The default locale and currency are configurable process-wide via
 * {@link Num.useLocale} and {@link Num.useCurrency}.
 */
class Num {
  private static locale = "en-US"

  private static currencyCode = "USD"

  /* ------------------------------------------------------------------ *
   * Configuration
   * ------------------------------------------------------------------ */

  /** Set the default locale used by every formatting method. */
  static useLocale(locale: string): void {
    Num.locale = locale
  }

  /** Set the default currency used by {@link Num.currency}. */
  static useCurrency(currency: string): void {
    Num.currencyCode = currency
  }

  /** The current default locale. */
  static defaultLocale(): string {
    return Num.locale
  }

  /** The current default currency. */
  static defaultCurrency(): string {
    return Num.currencyCode
  }

  /** Run a callback with a temporary default locale. */
  static withLocale<T>(locale: string, callback: () => T): T {
    const previous = Num.locale
    Num.locale = locale

    try {
      return callback()
    } finally {
      Num.locale = previous
    }
  }

  /** Run a callback with a temporary default currency. */
  static withCurrency<T>(currency: string, callback: () => T): T {
    const previous = Num.currencyCode
    Num.currencyCode = currency

    try {
      return callback()
    } finally {
      Num.currencyCode = previous
    }
  }

  /* ------------------------------------------------------------------ *
   * Formatting
   * ------------------------------------------------------------------ */

  /**
   * Locale-aware number formatting.
   *
   * Follows Laravel's precision rules: `maxPrecision` caps the fraction
   * digits, `precision` alone fixes them exactly, and neither leaves the
   * locale default of up to three digits.
   */
  static format(number: number, options: FormatOptions = {}): string {
    const { precision, maxPrecision, locale } = options

    const digits =
      maxPrecision !== undefined
        ? { minimumFractionDigits: precision ?? 0, maximumFractionDigits: maxPrecision }
        : precision !== undefined
          ? { minimumFractionDigits: precision, maximumFractionDigits: precision }
          : { maximumFractionDigits: 3 }

    return new Intl.NumberFormat(locale ?? Num.locale, digits).format(number)
  }

  /** Format as a percentage: `Num.percentage(17.5)` → `"18%"`. */
  static percentage(number: number, options: FormatOptions = {}): string {
    const { precision = 0, maxPrecision, locale } = options

    return new Intl.NumberFormat(locale ?? Num.locale, {
      style: "percent",
      minimumFractionDigits: precision,
      maximumFractionDigits: maxPrecision ?? precision,
    }).format(number / 100)
  }

  /** Format as currency: `Num.currency(1000)` → `"$1,000.00"`. */
  static currency(
    number: number,
    options: FormatOptions & { currency?: string } = {},
  ): string {
    const { currency, precision, locale } = options

    return new Intl.NumberFormat(locale ?? Num.locale, {
      style: "currency",
      currency: currency ?? Num.currencyCode,
      ...(precision === undefined
        ? {}
        : { minimumFractionDigits: precision, maximumFractionDigits: precision }),
    }).format(number)
  }

  /** Human-readable byte size: `Num.fileSize(1024)` → `"1 KB"`. */
  static fileSize(bytes: number, options: FileSizeOptions = {}): string {
    const { precision = 0, maxPrecision, locale } = options

    let value = Math.abs(bytes)
    let unit = 0

    while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
      value /= 1024
      unit++
    }

    const sign = bytes < 0 ? "-" : ""

    return `${sign}${Num.format(value, { precision, maxPrecision, locale })} ${BYTE_UNITS[unit]}`
  }

  /** Compact notation: `Num.abbreviate(1200)` → `"1.2K"`. */
  static abbreviate(number: number, options: FormatOptions = {}): string {
    const { precision = 0, maxPrecision, locale } = options

    let value = Math.abs(number)
    let unit = 0

    while (value >= 1000 && unit < ABBREVIATIONS.length - 1) {
      value /= 1000
      unit++
    }

    const sign = number < 0 ? "-" : ""

    return `${sign}${Num.format(value, { precision, maxPrecision, locale })}${ABBREVIATIONS[unit]}`
  }

  /** Long-form magnitude: `Num.forHumans(1200)` → `"1.2 thousand"`. */
  static forHumans(number: number, options: FormatOptions = {}): string {
    const magnitude = Math.abs(number)
    const sign = number < 0 ? "-" : ""

    for (const [size, label] of HUMAN_UNITS) {
      if (magnitude >= size) {
        const formatted = Num.format(magnitude / size, {
          precision: options.precision ?? 0,
          maxPrecision: options.maxPrecision,
          locale: options.locale,
        })

        return `${sign}${formatted} ${label}`
      }
    }

    return Num.format(number, options)
  }

  /* ------------------------------------------------------------------ *
   * Words
   * ------------------------------------------------------------------ */

  /** Spell a number out in English words. */
  static spell(number: number, options: { after?: number; until?: number } = {}): string {
    const { after, until } = options

    if ((after !== undefined && number <= after) || (until !== undefined && number >= until)) {
      return Num.format(number)
    }

    if (!Number.isFinite(number)) {
      return String(number)
    }

    if (number < 0) {
      return `negative ${Num.spell(Math.abs(number))}`
    }

    if (!Number.isInteger(number)) {
      const [whole = "0", fraction = ""] = String(number).split(".")
      const digits = [...fraction].map((digit) => ONES[Number(digit)]).join(" ")

      return `${Num.spell(Number(whole))} point ${digits}`
    }

    if (number < 100) {
      return spellSmall(number)
    }

    for (const [size, label] of SCALES) {
      if (number >= size) {
        const count = Math.floor(number / size)
        const rest = number % size
        const head = `${Num.spell(count)} ${label}`

        return rest === 0 ? head : `${head} ${Num.spell(rest)}`
      }
    }

    return spellSmall(number)
  }

  /** Ordinal form: `Num.ordinal(3)` → `"3rd"`. */
  static ordinal(number: number): string {
    const rules = new Intl.PluralRules(Num.locale, { type: "ordinal" })
    const suffixes: Record<string, string> = {
      one: "st",
      two: "nd",
      few: "rd",
      other: "th",
    }

    return `${number}${suffixes[rules.select(number)] ?? "th"}`
  }

  /** Spelled-out ordinal: `Num.spellOrdinal(3)` → `"third"`. */
  static spellOrdinal(number: number): string {
    const irregular: Record<string, string> = {
      one: "first", two: "second", three: "third", five: "fifth",
      eight: "eighth", nine: "ninth", twelve: "twelfth",
    }

    const words = Num.spell(number)
    const match = /([a-z]+)$/.exec(words)
    const last = match?.[1] ?? ""

    if (irregular[last]) {
      return words.slice(0, words.length - last.length) + irregular[last]
    }

    if (last.endsWith("y")) {
      return `${words.slice(0, -1)}ieth`
    }

    return `${words}th`
  }

  /* ------------------------------------------------------------------ *
   * Maths
   * ------------------------------------------------------------------ */

  /**
   * Constrain a number between a minimum and maximum.
   *
   * @remarks
   * The legacy `Num.clamp({ num, min, max })` form is still supported.
   */
  static clamp(number: number | ClampProps, min?: number, max?: number): number {
    if (isClampProps(number)) {
      return Math.min(Math.max(number.num, number.min), number.max)
    }

    return Math.min(Math.max(number, min ?? Number.NEGATIVE_INFINITY), max ?? Number.POSITIVE_INFINITY)
  }

  /** All `[start, end]` pairs stepping from `from` to `to`. */
  static pairs(to: number, by: number, offset = 1): [number, number][] {
    const out: [number, number][] = []

    for (let start = 0; start < to; start += by) {
      const end = Math.min(start + by, to)

      out.push([start === 0 ? start : start + offset, end])
    }

    return out
  }

  /** Drop trailing zeros from a float. */
  static trim(number: number): number {
    return Number.parseFloat(String(number))
  }

  /** Parse an integer, returning `fallback` when the input is not numeric. */
  static parseInt(value: string | number, fallback = 0, radix = 10): number {
    const parsed = Number.parseInt(String(value), radix)

    return Number.isNaN(parsed) ? fallback : parsed
  }

  /** Parse a float, returning `fallback` when the input is not numeric. */
  static parseFloat(value: string | number, fallback = 0): number {
    const parsed = Number.parseFloat(String(value))

    return Number.isNaN(parsed) ? fallback : parsed
  }

  /** True when the value is a finite number (or numeric string). */
  static isNumeric(value: unknown): boolean {
    if (typeof value === "number") {
      return Number.isFinite(value)
    }

    if (typeof value !== "string" || value.trim() === "") {
      return false
    }

    return Number.isFinite(Number(value))
  }

  /** Round to `precision` decimal places, avoiding float drift. */
  static round(number: number, precision = 0): number {
    const factor = 10 ** precision

    return Math.round((number + Number.EPSILON) * factor) / factor
  }

  /** A random integer in `[min, max]`, inclusive. */
  static random(min = 0, max = Number.MAX_SAFE_INTEGER): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /** Sum the given numbers. */
  static sum(numbers: number[]): number {
    return numbers.reduce((carry, item) => carry + item, 0)
  }

  /** Average the given numbers, or `undefined` when the list is empty. */
  static average(numbers: number[]): number | undefined {
    return numbers.length === 0 ? undefined : Num.sum(numbers) / numbers.length
  }

  /** Linearly interpolate between two numbers. */
  static lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount
  }

  /** Percentage difference of `number` relative to `total`. */
  static percentOf(number: number, total: number): number {
    return total === 0 ? 0 : (number / total) * 100
  }
}

export default Num

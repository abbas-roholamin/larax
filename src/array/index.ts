/** @format */

import {
  accessible,
  blank,
  compare,
  dataGet,
  deepClone,
  hasKey,
  identity,
  isPlainObject,
  looseEquals,
  readKey,
  toCallback,
  value as resolve,
} from "../support/value"
import type { Dict, Key, Operator, Predicate, Selector, Valuable } from "../support/types"

/** Sort comparator that mirrors PHP's loose ordering of mixed values. */
function defaultCompare(a: any, b: any): number {
  if (a === b) {
    return 0
  }

  if (a === null || a === undefined) {
    return -1
  }

  if (b === null || b === undefined) {
    return 1
  }

  if (typeof a === "number" && typeof b === "number") {
    return a - b
  }

  return String(a) < String(b) ? -1 : 1
}

/**
 * Laravel's `Arr` helper, ported to TypeScript.
 *
 * Methods that Laravel defines over associative arrays (`dot`, `except`,
 * `only`, `pluck`, ...) accept both JS arrays and plain objects here, since
 * PHP's single array type maps onto two JS types.
 */
class Arr {
  /* ------------------------------------------------------------------ *
   * Type checks
   * ------------------------------------------------------------------ */

  /** True when the value is a JS array. */
  static isArray(target: unknown): target is any[] {
    return Array.isArray(target)
  }

  /** True when the value can be accessed with array/dot syntax. */
  static accessible(target: unknown): boolean {
    return accessible(target)
  }

  /** True when the array has non-sequential (string) keys. */
  static isAssoc(target: unknown): boolean {
    if (Array.isArray(target)) {
      return false
    }

    return isPlainObject(target)
  }

  /** True when the value is a sequential, zero-indexed list. */
  static isList(target: unknown): boolean {
    return Array.isArray(target)
  }

  /* ------------------------------------------------------------------ *
   * Reading
   * ------------------------------------------------------------------ */

  /** True when the key (dot notation supported) exists. */
  static exists(target: any, key: Key): boolean {
    return hasKey(target, key)
  }

  /** Read a value using dot notation, falling back to `fallback`. */
  static get(target: any, key?: Key | null, fallback?: any): any {
    if (!accessible(target)) {
      return resolve(fallback)
    }

    if (key === null || key === undefined) {
      return target
    }

    if (hasKey(target, key)) {
      const found = readKey(target, key)

      return found === undefined ? resolve(fallback) : found
    }

    return dataGet(target, key, fallback)
  }

  /** True when *every* given dot-notation key is present. */
  static has(target: any, keys: Key | Key[]): boolean {
    const list = Array.isArray(keys) ? keys : [keys]

    if (list.length === 0 || !accessible(target)) {
      return false
    }

    return list.every((key) => {
      if (hasKey(target, key)) {
        return true
      }

      let subject = target

      for (const segment of String(key).split(".")) {
        if (!accessible(subject) || !hasKey(subject, segment)) {
          return false
        }

        subject = readKey(subject, segment)
      }

      return true
    })
  }

  /** True when *any* of the given dot-notation keys is present. */
  static hasAny(target: any, keys: Key | Key[]): boolean {
    const list = Array.isArray(keys) ? keys : [keys]

    return list.some((key) => Arr.has(target, key))
  }

  /** Alias of {@link Arr.has}. */
  static hasAll(target: any, keys: Key | Key[]): boolean {
    return Arr.has(target, keys)
  }

  /** First element passing `callback`, or `fallback`. */
  static first<T>(
    target: T[] | Dict<T>,
    callback?: Predicate<T> | null,
    fallback?: Valuable<any>,
  ): T | undefined {
    const entries = Arr.entries(target)

    if (!callback) {
      return entries.length === 0 ? resolve(fallback) : entries[0]?.[1]
    }

    for (const [key, item] of entries) {
      if (callback(item, key)) {
        return item
      }
    }

    return resolve(fallback)
  }

  /** Last element passing `callback`, or `fallback`. */
  static last<T>(
    target: T[] | Dict<T>,
    callback?: Predicate<T> | null,
    fallback?: Valuable<any>,
  ): T | undefined {
    const entries = Arr.entries(target)

    if (!callback) {
      return entries.length === 0 ? resolve(fallback) : entries[entries.length - 1]?.[1]
    }

    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i]

      if (entry && callback(entry[1], entry[0])) {
        return entry[1]
      }
    }

    return resolve(fallback)
  }

  /** The single matching element; throws when there is not exactly one. */
  static sole<T>(target: T[] | Dict<T>, callback?: Predicate<T>): T {
    const matches = Arr.values(target).filter((item, index) => !callback || callback(item, index))

    if (matches.length === 0) {
      throw new Error("Arr.sole(): no matching items.")
    }

    if (matches.length > 1) {
      throw new Error(`Arr.sole(): ${matches.length} items matched, expected exactly 1.`)
    }

    return matches[0] as T
  }

  /** A random element, or `amount` random elements. */
  static random<T>(target: T[] | Dict<T>, amount?: number, preserveKeys = false): T | T[] | Dict<T> {
    const entries = Arr.entries(target)

    if (amount === undefined) {
      const picked = entries[Math.floor(Math.random() * entries.length)]

      return picked?.[1] as T
    }

    if (amount > entries.length) {
      throw new Error(`Arr.random(): cannot take ${amount} items from ${entries.length}.`)
    }

    const shuffled = Arr.shuffleEntries(entries).slice(0, amount)

    if (!preserveKeys) {
      return shuffled.map(([, item]) => item)
    }

    return Object.fromEntries(shuffled) as Dict<T>
  }

  /* ------------------------------------------------------------------ *
   * Writing
   * ------------------------------------------------------------------ */

  /** Set a value using dot notation, mutating and returning the target. */
  static set<T extends Dict | any[]>(target: T, key: Key | null, value: any): T {
    if (key === null) {
      return value
    }

    const segments = String(key).split(".")
    let cursor: any = target

    while (segments.length > 1) {
      const segment = segments.shift() as string

      if (!accessible(cursor[segment])) {
        cursor[segment] = {}
      }

      cursor = cursor[segment]
    }

    cursor[segments[0] as string] = value

    return target
  }

  /** Set a value only when the key is not already present. */
  static add<T extends Dict | any[]>(target: T, key: Key, value: any): T {
    if (Arr.get(target, key) === undefined) {
      Arr.set(target, key, value)
    }

    return target
  }

  /** Remove one or more dot-notation keys, mutating the target. */
  static forget<T extends Dict | any[]>(target: T, keys: Key | Key[]): T {
    const list = Array.isArray(keys) ? keys : [keys]

    for (const key of list) {
      if (hasKey(target, key)) {
        if (Array.isArray(target)) {
          target.splice(Number(key), 1)
        } else {
          delete (target as Dict)[key]
        }

        continue
      }

      const segments = String(key).split(".")
      let cursor: any = target

      while (segments.length > 1) {
        const segment = segments.shift() as string

        if (!accessible(cursor?.[segment])) {
          cursor = null
          break
        }

        cursor = cursor[segment]
      }

      if (cursor !== null && cursor !== undefined) {
        const last = segments[0] as string

        if (Array.isArray(cursor)) {
          cursor.splice(Number(last), 1)
        } else {
          delete cursor[last]
        }
      }
    }

    return target
  }

  /** Read a key and remove it from the target. */
  static pull<T>(target: Dict<T> | T[], key: Key, fallback?: Valuable<any>): T | undefined {
    const found = Arr.get(target, key, fallback)

    Arr.forget(target, key)

    return found
  }

  /** Push a value onto the front of an array. */
  static prepend<T>(target: T[], value: T): T[]
  static prepend<T>(target: Dict<T>, value: T, key: Key): Dict<T>
  static prepend<T>(target: T[] | Dict<T>, value: T, key?: Key): T[] | Dict<T> {
    if (Array.isArray(target)) {
      return [value, ...target]
    }

    if (key === undefined) {
      throw new Error("Arr.prepend(): a key is required when prepending to an object.")
    }

    return { [key]: value, ...target }
  }

  /* ------------------------------------------------------------------ *
   * Shape
   * ------------------------------------------------------------------ */

  /** Key/value pairs, for arrays and objects alike. */
  static entries<T>(target: T[] | Dict<T> | null | undefined): [Key, T][] {
    if (target === null || target === undefined) {
      return []
    }

    if (Array.isArray(target)) {
      return target.map((item, index) => [index, item])
    }

    return Object.entries(target)
  }

  /** The values, for arrays and objects alike. */
  static values<T>(target: T[] | Dict<T> | null | undefined): T[] {
    if (target === null || target === undefined) {
      return []
    }

    return Array.isArray(target) ? [...target] : Object.values(target)
  }

  /** The keys, for arrays and objects alike. */
  static keys(target: any[] | Dict | null | undefined): Key[] {
    if (target === null || target === undefined) {
      return []
    }

    return Array.isArray(target) ? target.map((_, index) => index) : Object.keys(target)
  }

  /** Split into a `[keys, values]` pair. */
  static divide<T>(target: T[] | Dict<T>): [Key[], T[]] {
    return [Arr.keys(target), Arr.values(target)]
  }

  /** Wrap a value in an array unless it already is one. */
  static wrap<T>(value: T | T[] | null | undefined): T[] {
    if (value === null || value === undefined) {
      return []
    }

    return Array.isArray(value) ? value : [value]
  }

  /** Build an array from any iterable or object. */
  static from<T>(target: Iterable<T> | Dict<T> | null | undefined): T[] {
    if (target === null || target === undefined) {
      return []
    }

    if (typeof (target as any)[Symbol.iterator] === "function") {
      return [...(target as Iterable<T>)]
    }

    return Object.values(target as Dict<T>)
  }

  /** Flatten a nested structure by one level. */
  static collapse<T>(target: (T | T[])[] | Dict<T | T[]>): T[] {
    const out: T[] = []

    for (const item of Arr.values(target)) {
      if (Array.isArray(item)) {
        out.push(...item)
      } else if (isPlainObject(item)) {
        out.push(...(Object.values(item) as T[]))
      }
    }

    return out
  }

  /** Flatten a nested structure to the given `depth`. */
  static flatten(target: any[] | Dict, depth = Number.POSITIVE_INFINITY): any[] {
    const out: any[] = []

    for (const item of Arr.values(target)) {
      if (!Array.isArray(item) && !isPlainObject(item)) {
        out.push(item)
      } else if (depth === 1) {
        out.push(...Arr.values(item))
      } else {
        out.push(...Arr.flatten(item, depth - 1))
      }
    }

    return out
  }

  /** Flatten to a single level, joining nested keys with dots. */
  static dot(target: any[] | Dict, prepend = ""): Dict {
    const out: Dict = {}

    for (const [key, item] of Arr.entries(target)) {
      if ((Array.isArray(item) || isPlainObject(item)) && Arr.entries(item).length > 0) {
        Object.assign(out, Arr.dot(item, `${prepend}${key}.`))
      } else {
        out[`${prepend}${key}`] = item
      }
    }

    return out
  }

  /** Expand a dot-keyed object back into a nested one. */
  static undot(target: Dict): Dict {
    const out: Dict = {}

    for (const [key, item] of Object.entries(target)) {
      Arr.set(out, key, item)
    }

    return out
  }

  /** The cartesian product of the given arrays. */
  static crossJoin(...arrays: any[][]): any[][] {
    return arrays.reduce<any[][]>(
      (carry, array) => carry.flatMap((combination) => array.map((item) => [...combination, item])),
      [[]],
    )
  }

  /** Split into `numberOfGroups` chunks. */
  static split<T>(target: T[], numberOfGroups: number): T[][] {
    if (target.length === 0 || numberOfGroups <= 0) {
      return []
    }

    const out: T[][] = []
    const size = Math.floor(target.length / numberOfGroups)
    let remainder = target.length % numberOfGroups
    let offset = 0

    for (let i = 0; i < numberOfGroups; i++) {
      let take = size

      if (remainder > 0) {
        take++
        remainder--
      }

      if (take > 0) {
        out.push(target.slice(offset, offset + take))
        offset += take
      }
    }

    return out
  }

  /** Break the array into chunks of `size`. */
  static chunk<T>(target: T[], size: number): T[][] {
    if (size <= 0) {
      return []
    }

    const out: T[][] = []

    for (let i = 0; i < target.length; i += size) {
      out.push(target.slice(i, i + size))
    }

    return out
  }

  /** Take the first (or, when negative, last) `limit` items. */
  static take<T>(target: T[], limit: number): T[] {
    return limit < 0 ? target.slice(limit) : target.slice(0, limit)
  }

  /** Split into `[passing, failing]` groups. */
  static partition<T>(target: T[], callback: Predicate<T, number>): [T[], T[]] {
    const passed: T[] = []
    const failed: T[] = []

    target.forEach((item, index) => {
      if (callback(item, index)) {
        passed.push(item)
      } else {
        failed.push(item)
      }
    })

    return [passed, failed]
  }

  /* ------------------------------------------------------------------ *
   * Selection
   * ------------------------------------------------------------------ */

  /** Keep only the given keys. */
  static only<T>(target: Dict<T> | T[], keys: Key | Key[]): Dict<T> {
    const list = Arr.wrap(keys).map(String)
    const out: Dict<T> = {}

    for (const [key, item] of Arr.entries(target)) {
      if (list.includes(String(key))) {
        out[String(key)] = item
      }
    }

    return out
  }

  /** Drop the given keys. */
  static except<T>(target: Dict<T> | T[], keys: Key | Key[]): Dict<T> {
    const out: Dict<T> = Object.fromEntries(
      Arr.entries(target).map(([key, item]) => [String(key), item]),
    )

    Arr.forget(out, Arr.wrap(keys))

    return out
  }

  /** Pick the given keys out of every row (like a SQL `SELECT`). */
  static select<T extends Dict>(target: T[], keys: Key | Key[]): Dict[] {
    const list = Arr.wrap(keys)

    return target.map((row) => {
      const out: Dict = {}

      for (const key of list) {
        if (hasKey(row, key)) {
          out[String(key)] = dataGet(row, key)
        }
      }

      return out
    })
  }

  /** Extract a column, optionally keyed by another column. */
  static pluck<T>(target: T[] | Dict<T>, value: Selector<T>, key?: Selector<T> | null): any {
    const rows = Arr.values(target)
    const readValue = toCallback<T, any>(value)

    if (key === undefined || key === null) {
      return rows.map((row, index) => readValue(row, index))
    }

    const readKeyed = toCallback<T, any>(key)
    const out: Dict = {}

    rows.forEach((row, index) => {
      out[String(readKeyed(row, index))] = readValue(row, index)
    })

    return out
  }

  /** Re-key the collection by the given column or callback. */
  static keyBy<T>(target: T[] | Dict<T>, key: Selector<T>): Dict<T> {
    const readKeyed = toCallback<T, any>(key)
    const out: Dict<T> = {}

    Arr.entries(target).forEach(([index, item]) => {
      out[String(readKeyed(item, index))] = item
    })

    return out
  }

  /** Prefix every key with the given string. */
  static prependKeysWith(target: Dict, prefix: string): Dict {
    return Object.fromEntries(
      Object.entries(target).map(([key, item]) => [`${prefix}${key}`, item]),
    )
  }

  /* ------------------------------------------------------------------ *
   * Filtering
   * ------------------------------------------------------------------ */

  /** Keep entries passing the callback, preserving keys for objects. */
  static where<T>(target: T[], callback: Predicate<T>): T[]
  static where<T>(target: Dict<T>, callback: Predicate<T>): Dict<T>
  static where<T>(target: T[] | Dict<T>, callback: Predicate<T>): T[] | Dict<T> {
    if (Array.isArray(target)) {
      return target.filter((item, index) => callback(item, index))
    }

    return Object.fromEntries(
      Object.entries(target).filter(([key, item]) => callback(item, key)),
    ) as Dict<T>
  }

  /** Drop entries passing the callback. */
  static reject<T>(target: T[], callback: Predicate<T>): T[]
  static reject<T>(target: Dict<T>, callback: Predicate<T>): Dict<T>
  static reject<T>(target: T[] | Dict<T>, callback: Predicate<T>): T[] | Dict<T> {
    return Arr.where(target as any, (item: T, key: Key) => !callback(item, key))
  }

  /** Drop `null` and `undefined` entries. */
  static whereNotNull<T>(target: (T | null | undefined)[]): T[]
  static whereNotNull<T>(target: Dict<T | null | undefined>): Dict<T>
  static whereNotNull(target: any): any {
    return Arr.where(target, (item: any) => item !== null && item !== undefined)
  }

  /** Keep only entries whose value is a string. */
  static string(target: any[] | Dict): any {
    return Arr.where(target as any, (item: any) => typeof item === "string")
  }

  /** Filter rows by `key operator value`. */
  static whereColumn<T extends Dict>(
    target: T[],
    key: string,
    operator: Operator,
    value: any,
  ): T[] {
    return target.filter((row) => compare(dataGet(row, key), operator, value))
  }

  /* ------------------------------------------------------------------ *
   * Mapping
   * ------------------------------------------------------------------ */

  /** Map over the entries, preserving object keys. */
  static map<T, R>(target: T[], callback: (value: T, key: number) => R): R[]
  static map<T, R>(target: Dict<T>, callback: (value: T, key: string) => R): Dict<R>
  static map(target: any, callback: (value: any, key: any) => any): any {
    if (Array.isArray(target)) {
      return target.map((item, index) => callback(item, index))
    }

    return Object.fromEntries(
      Object.entries(target).map(([key, item]) => [key, callback(item, key)]),
    )
  }

  /** Map each entry to a `[key, value]` pair and rebuild an object. */
  static mapWithKeys<T>(
    target: T[] | Dict<T>,
    callback: (value: T, key: Key) => [Key, any] | Dict,
  ): Dict {
    const out: Dict = {}

    for (const [key, item] of Arr.entries(target)) {
      const produced = callback(item, key)

      if (Array.isArray(produced)) {
        out[String(produced[0])] = produced[1]
      } else {
        Object.assign(out, produced)
      }
    }

    return out
  }

  /** Map over an array of tuples, spreading each into the callback. */
  static mapSpread<R>(target: any[][], callback: (...args: any[]) => R): R[] {
    return target.map((item, index) => callback(...item, index))
  }

  /* ------------------------------------------------------------------ *
   * Ordering
   * ------------------------------------------------------------------ */

  /** Sort ascending, optionally by a selector. */
  static sort<T>(target: T[], selector?: Selector<T>): T[] {
    const read = selector ? toCallback<T, any>(selector) : (item: T) => item

    return [...target].sort((a, b) => defaultCompare(read(a, 0), read(b, 0)))
  }

  /** Sort descending, optionally by a selector. */
  static sortDesc<T>(target: T[], selector?: Selector<T>): T[] {
    return Arr.sort(target, selector).reverse()
  }

  /** Recursively sort an array/object and all of its children. */
  static sortRecursive(target: any, descending = false): any {
    if (Array.isArray(target)) {
      const sorted = target.map((item) => Arr.sortRecursive(item, descending))

      return descending ? Arr.sortDesc(sorted) : Arr.sort(sorted)
    }

    if (isPlainObject(target)) {
      const keys = Object.keys(target).sort()

      if (descending) {
        keys.reverse()
      }

      return Object.fromEntries(
        keys.map((key) => [key, Arr.sortRecursive(target[key], descending)]),
      )
    }

    return target
  }

  /** Recursively sort in descending order. */
  static sortRecursiveDesc(target: any): any {
    return Arr.sortRecursive(target, true)
  }

  /** Randomise the order of the values. */
  static shuffle<T>(target: T[]): T[] {
    return Arr.shuffleEntries(Arr.entries(target)).map(([, item]) => item as T)
  }

  private static shuffleEntries<T>(entries: [Key, T][]): [Key, T][] {
    const out = [...entries]

    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const swap = out[i] as [Key, T]
      out[i] = out[j] as [Key, T]
      out[j] = swap
    }

    return out
  }

  /* ------------------------------------------------------------------ *
   * Set operations
   * ------------------------------------------------------------------ */

  /** Unique values, optionally by a selector. */
  static unique<T>(target: T[], selector?: Selector<T>): T[] {
    const read = selector ? toCallback<T, any>(selector) : (item: T) => item
    const seen = new Set<string>()

    return target.filter((item, index) => {
      const hash = identity(read(item, index))

      if (seen.has(hash)) {
        return false
      }

      seen.add(hash)

      return true
    })
  }

  /** Values present in the first array but not the others. */
  static diff<T>(target: T[], ...others: T[][]): T[] {
    const excluded = new Set(others.flat().map(identity))

    return target.filter((item) => !excluded.has(identity(item)))
  }

  /** Values present in every array. */
  static intersect<T>(target: T[], ...others: T[][]): T[] {
    return others.reduce((carry, other) => {
      const allowed = new Set(other.map(identity))

      return carry.filter((item) => allowed.has(identity(item)))
    }, [...target])
  }

  /** True when the array contains the value (structural comparison). */
  static contains<T>(target: T[], needle: T | Predicate<T>): boolean {
    if (typeof needle === "function") {
      return target.some((item, index) => (needle as Predicate<T>)(item, index))
    }

    return target.some((item) => looseEquals(item, needle))
  }

  /* ------------------------------------------------------------------ *
   * Output
   * ------------------------------------------------------------------ */

  /** Join with a delimiter, using `finalGlue` before the last item. */
  static join(target: any[], glue: string, finalGlue = ""): string {
    if (finalGlue === "") {
      return target.join(glue)
    }

    if (target.length === 0) {
      return ""
    }

    if (target.length === 1) {
      return String(target[0])
    }

    const rest = [...target]
    const last = rest.pop()

    return rest.join(glue) + finalGlue + String(last)
  }

  /** Build a URL query string from an object. */
  static query(target: Dict): string {
    const params = new URLSearchParams()

    const append = (key: string, item: any): void => {
      if (item === null || item === undefined) {
        return
      }

      if (Array.isArray(item)) {
        item.forEach((child, index) => append(`${key}[${index}]`, child))
      } else if (isPlainObject(item)) {
        for (const [childKey, child] of Object.entries(item)) {
          append(`${key}[${childKey}]`, child)
        }
      } else if (typeof item === "boolean") {
        params.append(key, item ? "1" : "0")
      } else {
        params.append(key, String(item))
      }
    }

    for (const [key, item] of Object.entries(target)) {
      append(key, item)
    }

    return params.toString()
  }

  /** Build a `class="..."` string from an object of conditionals. */
  static toCssClasses(classes: (string | Dict<unknown>)[] | Dict<unknown>): string {
    const out: string[] = []

    for (const [key, item] of Arr.entries(classes as any)) {
      if (typeof item === "string" && typeof key === "number") {
        out.push(item)
      } else if (isPlainObject(item)) {
        out.push(Arr.toCssClasses(item))
      } else if (item) {
        out.push(String(key))
      }
    }

    return out.filter(Boolean).join(" ")
  }

  /** Build a `style="..."` string from an object of conditionals. */
  static toCssStyles(styles: (string | Dict<unknown>)[] | Dict<unknown>): string {
    const out: string[] = []

    for (const [key, item] of Arr.entries(styles as any)) {
      if (typeof item === "string" && typeof key === "number") {
        out.push(item.endsWith(";") ? item : `${item};`)
      } else if (isPlainObject(item)) {
        out.push(Arr.toCssStyles(item))
      } else if (item) {
        const rule = String(key)
        out.push(rule.endsWith(";") ? rule : `${rule};`)
      }
    }

    return out.join(" ")
  }

  /* ------------------------------------------------------------------ *
   * Aggregation
   * ------------------------------------------------------------------ */

  /** Sum the values, optionally by a selector. */
  static sum<T>(target: T[], selector?: Selector<T>): number {
    const read = selector ? toCallback<T, any>(selector) : (item: T) => item

    return target.reduce<number>((carry, item, index) => carry + Number(read(item, index) ?? 0), 0)
  }

  /** Average the values, or `undefined` for an empty array. */
  static avg<T>(target: T[], selector?: Selector<T>): number | undefined {
    return target.length === 0 ? undefined : Arr.sum(target, selector) / target.length
  }

  /** The smallest value, optionally by a selector. */
  static min<T>(target: T[], selector?: Selector<T>): any {
    const read = selector ? toCallback<T, any>(selector) : (item: T) => item

    return target.reduce<any>((carry, item, index) => {
      const current = read(item, index)

      return carry === undefined || defaultCompare(current, carry) < 0 ? current : carry
    }, undefined)
  }

  /** The largest value, optionally by a selector. */
  static max<T>(target: T[], selector?: Selector<T>): any {
    const read = selector ? toCallback<T, any>(selector) : (item: T) => item

    return target.reduce<any>((carry, item, index) => {
      const current = read(item, index)

      return carry === undefined || defaultCompare(current, carry) > 0 ? current : carry
    }, undefined)
  }

  /** Group rows by the given column or callback. */
  static groupBy<T>(target: T[] | Dict<T>, key: Selector<T>): Dict<T[]> {
    const read = toCallback<T, any>(key)
    const out: Dict<T[]> = {}

    for (const [index, item] of Arr.entries(target)) {
      const group = String(read(item, index))

      ;(out[group] ??= []).push(item)
    }

    return out
  }

  /** Count occurrences, optionally by a selector. */
  static countBy<T>(target: T[], selector?: Selector<T>): Dict<number> {
    const read = selector ? toCallback<T, any>(selector) : (item: T) => item
    const out: Dict<number> = {}

    target.forEach((item, index) => {
      const group = String(read(item, index))
      out[group] = (out[group] ?? 0) + 1
    })

    return out
  }

  /* ------------------------------------------------------------------ *
   * Misc
   * ------------------------------------------------------------------ */

  /** Deep clone the array or object. */
  static clone<T>(target: T): T {
    return deepClone(target)
  }

  /** Drop entries that are `blank()`. */
  static filter<T>(target: T[]): T[]
  static filter<T>(target: Dict<T>): Dict<T>
  static filter(target: any): any {
    return Arr.where(target, (item: any) => !blank(item))
  }
}

export default Arr

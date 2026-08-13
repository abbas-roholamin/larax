/** @format */

import Arr from "../array"
import {
  blank,
  compare,
  dataGet,
  deepClone,
  identity,
  looseEquals,
  toCallback,
  value as resolve,
} from "../support/value"
import type { Dict, Key, Operator, Predicate, Selector } from "../support/types"

/**
 * Laravel's `Collection`, ported to TypeScript over a JavaScript array.
 *
 * Collections are immutable by default: every transforming method returns a
 * new `Collection`. The handful of Laravel methods that mutate in PHP
 * (`push`, `pop`, `shift`, `splice`, ...) mutate here too, and are documented
 * as such.
 */
class Collection<T = any> implements Iterable<T> {
  protected items: T[]

  constructor(items: Iterable<T> | Dict<T> | T[] | null | undefined = []) {
    this.items = Arr.from(items as any) as T[]
  }

  /** Build a collection from any iterable or object. */
  static make<T>(items?: Iterable<T> | Dict<T> | T[] | null): Collection<T> {
    return new Collection<T>(items)
  }

  /** Wrap a value in a collection unless it already is one. */
  static wrap<T>(value: T | T[] | Collection<T> | null | undefined): Collection<T> {
    if (value instanceof Collection) {
      return value
    }

    return new Collection<T>(Arr.wrap(value as T))
  }

  /** Unwrap a collection back to a plain array. */
  static unwrap<T>(value: T[] | Collection<T>): T[] {
    return value instanceof Collection ? value.all() : value
  }

  /** A collection of `count` items produced by `callback` (1-indexed). */
  static times<T>(count: number, callback: (index: number) => T): Collection<T> {
    const out: T[] = []

    for (let i = 1; i <= count; i++) {
      out.push(callback(i))
    }

    return new Collection(out)
  }

  /** A collection of integers from `start` to `end`, inclusive. */
  static range(start: number, end: number, step = 1): Collection<number> {
    const out: number[] = []
    const size = Math.abs(step) || 1

    if (start <= end) {
      for (let i = start; i <= end; i += size) {
        out.push(i)
      }
    } else {
      for (let i = start; i >= end; i -= size) {
        out.push(i)
      }
    }

    return new Collection(out)
  }

  /** A new collection of the same concrete type. */
  protected next<R>(items: R[]): Collection<R> {
    return new Collection<R>(items)
  }

  /* ------------------------------------------------------------------ *
   * Access
   * ------------------------------------------------------------------ */

  /** The underlying array. */
  all(): T[] {
    return [...this.items]
  }

  /** Alias of {@link Collection.all}. */
  toArray(): T[] {
    return this.all().map((item) => (item instanceof Collection ? item.toArray() : item)) as T[]
  }

  /** Serialize to JSON. */
  toJson(space?: number): string {
    return JSON.stringify(this.toArray(), null, space)
  }

  toJSON(): T[] {
    return this.toArray()
  }

  /** Number of items. */
  count(): number {
    return this.items.length
  }

  get length(): number {
    return this.items.length
  }

  /** The item at `index`, or `fallback`. */
  get(index: number, fallback?: any): T | undefined {
    const found = index < 0 ? this.items[this.items.length + index] : this.items[index]

    return found === undefined ? resolve(fallback) : found
  }

  /** True when the index exists. */
  has(index: number): boolean {
    return index >= 0 && index < this.items.length
  }

  /** The first item (optionally matching a predicate). */
  first(callback?: Predicate<T, number>, fallback?: any): T | undefined {
    return Arr.first(this.items, callback as Predicate<T>, fallback)
  }

  /** The last item (optionally matching a predicate). */
  last(callback?: Predicate<T, number>, fallback?: any): T | undefined {
    return Arr.last(this.items, callback as Predicate<T>, fallback)
  }

  /** The first item where `key` matches `value`. */
  firstWhere(key: string, operator: Operator | any = "=", value?: any): T | undefined {
    const [op, expected] = arguments.length === 2 ? ["=" as Operator, operator] : [operator, value]

    return this.items.find((item) => compare(dataGet(item, key), op, expected))
  }

  /** The single matching item; throws unless exactly one matches. */
  sole(callback?: Predicate<T, number>): T {
    return Arr.sole(this.items, callback as Predicate<T>)
  }

  /** A random item, or a collection of `amount` random items. */
  random(amount?: number): T | Collection<T> {
    if (amount === undefined) {
      return Arr.random(this.items) as T
    }

    return this.next(Arr.random(this.items, amount) as T[])
  }

  /** Index of the first matching item, or `false`. */
  search(needle: T | Predicate<T, number>): number | false {
    const index =
      typeof needle === "function"
        ? this.items.findIndex((item, position) => (needle as Predicate<T, number>)(item, position))
        : this.items.findIndex((item) => looseEquals(item, needle))

    return index === -1 ? false : index
  }

  /* ------------------------------------------------------------------ *
   * Predicates
   * ------------------------------------------------------------------ */

  isEmpty(): boolean {
    return this.items.length === 0
  }

  isNotEmpty(): boolean {
    return this.items.length > 0
  }

  /** True when the collection contains the value or a match. */
  contains(needle: T | Predicate<T, number> | string, operator?: Operator, value?: any): boolean {
    if (operator !== undefined) {
      return this.items.some((item) => compare(dataGet(item, needle as string), operator, value))
    }

    return Arr.contains(this.items, needle as any)
  }

  /** True when the collection does not contain the value. */
  doesntContain(needle: T | Predicate<T, number>): boolean {
    return !this.contains(needle as any)
  }

  /** True when every item passes the predicate. */
  every(callback: Predicate<T, number>): boolean {
    return this.items.every((item, index) => callback(item, index))
  }

  /** True when at least one item passes the predicate. */
  some(callback: Predicate<T, number>): boolean {
    return this.items.some((item, index) => callback(item, index))
  }

  /* ------------------------------------------------------------------ *
   * Transformation
   * ------------------------------------------------------------------ */

  map<R>(callback: (value: T, key: number) => R): Collection<R> {
    return this.next(this.items.map((item, index) => callback(item, index)))
  }

  /** Map then flatten one level. */
  flatMap<R>(callback: (value: T, key: number) => R | R[]): Collection<R> {
    return this.next(this.items.flatMap((item, index) => callback(item, index) as R))
  }

  /** Map over tuples, spreading each into the callback. */
  mapSpread<R>(callback: (...args: any[]) => R): Collection<R> {
    return this.next(Arr.mapSpread(this.items as any[], callback))
  }

  /** Map each item to a `[key, value]` pair, producing a plain object. */
  mapWithKeys(callback: (value: T, key: number) => [Key, any] | Dict): Dict {
    return Arr.mapWithKeys(this.items, callback as any)
  }

  /** Map each item into a group keyed by the returned key. */
  mapToGroups(callback: (value: T, key: number) => [Key, any]): Dict<any[]> {
    const out: Dict<any[]> = {}

    this.items.forEach((item, index) => {
      const [key, mapped] = callback(item, index)

      ;(out[String(key)] ??= []).push(mapped)
    })

    return out
  }

  /** Mutate the collection in place with the callback's results. */
  transform(callback: (value: T, key: number) => T): this {
    this.items = this.items.map((item, index) => callback(item, index))

    return this
  }

  filter(callback?: Predicate<T, number>): Collection<T> {
    return this.next(
      this.items.filter((item, index) => (callback ? callback(item, index) : !blank(item))),
    )
  }

  reject(callback: Predicate<T, number>): Collection<T> {
    return this.next(this.items.filter((item, index) => !callback(item, index)))
  }

  /** Filter by `key operator value`. */
  where(key: string, operator: Operator | any = "=", value?: any): Collection<T> {
    const [op, expected] = arguments.length === 2 ? ["=" as Operator, operator] : [operator, value]

    return this.next(this.items.filter((item) => compare(dataGet(item, key), op, expected)))
  }

  whereIn(key: string, values: any[]): Collection<T> {
    const allowed = new Set(values.map(identity))

    return this.next(this.items.filter((item) => allowed.has(identity(dataGet(item, key)))))
  }

  whereNotIn(key: string, values: any[]): Collection<T> {
    const excluded = new Set(values.map(identity))

    return this.next(this.items.filter((item) => !excluded.has(identity(dataGet(item, key)))))
  }

  whereBetween(key: string, [from, to]: [any, any]): Collection<T> {
    return this.next(
      this.items.filter((item) => {
        const found = dataGet(item, key)

        return found >= from && found <= to
      }),
    )
  }

  whereNotBetween(key: string, [from, to]: [any, any]): Collection<T> {
    return this.next(
      this.items.filter((item) => {
        const found = dataGet(item, key)

        return found < from || found > to
      }),
    )
  }

  whereNull(key?: string): Collection<T> {
    return this.next(
      this.items.filter((item) => {
        const found = key === undefined ? item : dataGet(item, key)

        return found === null || found === undefined
      }),
    )
  }

  whereNotNull(key?: string): Collection<T> {
    return this.next(
      this.items.filter((item) => {
        const found = key === undefined ? item : dataGet(item, key)

        return found !== null && found !== undefined
      }),
    )
  }

  /* ------------------------------------------------------------------ *
   * Shape
   * ------------------------------------------------------------------ */

  /** Flatten one level. */
  collapse(): Collection<any> {
    return this.next(Arr.collapse(this.items as any))
  }

  /** Flatten to the given depth. */
  flatten(depth = Number.POSITIVE_INFINITY): Collection<any> {
    return this.next(Arr.flatten(this.items as any, depth))
  }

  chunk(size: number): Collection<Collection<T>> {
    return this.next(Arr.chunk(this.items, size).map((chunk) => this.next(chunk)))
  }

  /** Chunk while the callback returns true for consecutive items. */
  chunkWhile(callback: (value: T, previous: T, chunk: T[]) => boolean): Collection<Collection<T>> {
    const out: T[][] = []
    let current: T[] = []

    this.items.forEach((item, index) => {
      if (index === 0 || callback(item, this.items[index - 1] as T, current)) {
        current.push(item)
      } else {
        out.push(current)
        current = [item]
      }
    })

    if (current.length > 0) {
      out.push(current)
    }

    return this.next(out.map((chunk) => this.next(chunk)))
  }

  /** Overlapping windows of `size` items. */
  sliding(size = 2, step = 1): Collection<Collection<T>> {
    const out: T[][] = []

    for (let i = 0; i + size <= this.items.length; i += step) {
      out.push(this.items.slice(i, i + size))
    }

    return this.next(out.map((chunk) => this.next(chunk)))
  }

  /** Split into `numberOfGroups` roughly equal groups. */
  split(numberOfGroups: number): Collection<Collection<T>> {
    return this.next(Arr.split(this.items, numberOfGroups).map((chunk) => this.next(chunk)))
  }

  /** Split into groups of at most `size`. */
  splitIn(size: number): Collection<Collection<T>> {
    return this.chunk(Math.ceil(this.items.length / size))
  }

  /** Split into `[passing, failing]` collections. */
  partition(callback: Predicate<T, number>): [Collection<T>, Collection<T>] {
    const [passed, failed] = Arr.partition(this.items, callback)

    return [this.next(passed), this.next(failed)]
  }

  /** Pad to `size` with `value`; a negative size pads on the left. */
  pad(size: number, value: T): Collection<T> {
    const short = Math.abs(size) - this.items.length

    if (short <= 0) {
      return this.next(this.all())
    }

    const filler = Array.from({ length: short }, () => value)

    return this.next(size < 0 ? [...filler, ...this.items] : [...this.items, ...filler])
  }

  /* ------------------------------------------------------------------ *
   * Ordering
   * ------------------------------------------------------------------ */

  sort(comparator?: (a: T, b: T) => number): Collection<T> {
    return this.next(comparator ? [...this.items].sort(comparator) : Arr.sort(this.items))
  }

  sortDesc(): Collection<T> {
    return this.next(Arr.sortDesc(this.items))
  }

  sortBy(selector: Selector<T>, descending = false): Collection<T> {
    const sorted = Arr.sort(this.items, selector)

    return this.next(descending ? sorted.reverse() : sorted)
  }

  sortByDesc(selector: Selector<T>): Collection<T> {
    return this.sortBy(selector, true)
  }

  reverse(): Collection<T> {
    return this.next([...this.items].reverse())
  }

  shuffle(): Collection<T> {
    return this.next(Arr.shuffle(this.items))
  }

  /* ------------------------------------------------------------------ *
   * Slicing
   * ------------------------------------------------------------------ */

  slice(start: number, length?: number): Collection<T> {
    return this.next(
      length === undefined ? this.items.slice(start) : this.items.slice(start, start + length),
    )
  }

  take(limit: number): Collection<T> {
    return this.next(Arr.take(this.items, limit))
  }

  takeWhile(callback: Predicate<T, number>): Collection<T> {
    const out: T[] = []

    for (const [index, item] of this.items.entries()) {
      if (!callback(item, index)) {
        break
      }

      out.push(item)
    }

    return this.next(out)
  }

  takeUntil(callback: Predicate<T, number>): Collection<T> {
    return this.takeWhile((item, index) => !callback(item, index))
  }

  skip(count: number): Collection<T> {
    return this.next(this.items.slice(count))
  }

  skipWhile(callback: Predicate<T, number>): Collection<T> {
    let index = 0

    while (index < this.items.length && callback(this.items[index] as T, index)) {
      index++
    }

    return this.next(this.items.slice(index))
  }

  skipUntil(callback: Predicate<T, number>): Collection<T> {
    return this.skipWhile((item, index) => !callback(item, index))
  }

  /** Every `step`-th item, starting at `offset`. */
  nth(step: number, offset = 0): Collection<T> {
    return this.next(this.items.filter((_, index) => index >= offset && (index - offset) % step === 0))
  }

  /** The items on the given 1-indexed page. */
  forPage(page: number, perPage: number): Collection<T> {
    return this.slice(Math.max(0, (page - 1) * perPage), perPage)
  }

  /* ------------------------------------------------------------------ *
   * Set operations
   * ------------------------------------------------------------------ */

  unique(selector?: Selector<T>): Collection<T> {
    return this.next(Arr.unique(this.items, selector))
  }

  /** Values that appear more than once. */
  duplicates(selector?: Selector<T>): Collection<T> {
    const read = selector ? toCallback<T, any>(selector) : (item: T) => item
    const seen = new Set<string>()
    const out: T[] = []

    this.items.forEach((item, index) => {
      const hash = identity(read(item, index))

      if (seen.has(hash)) {
        out.push(item)
      } else {
        seen.add(hash)
      }
    })

    return this.next(out)
  }

  diff(other: T[] | Collection<T>): Collection<T> {
    return this.next(Arr.diff(this.items, Collection.unwrap(other)))
  }

  intersect(other: T[] | Collection<T>): Collection<T> {
    return this.next(Arr.intersect(this.items, Collection.unwrap(other)))
  }

  merge(other: T[] | Collection<T>): Collection<T> {
    return this.next([...this.items, ...Collection.unwrap(other)])
  }

  concat(other: Iterable<T>): Collection<T> {
    return this.next([...this.items, ...other])
  }

  /** Pair each item with the corresponding item in the other arrays. */
  zip(...others: (any[] | Collection<any>)[]): Collection<Collection<any>> {
    const lists = others.map((other) => Collection.unwrap(other as any))

    return this.next(
      this.items.map((item, index) => this.next([item, ...lists.map((list) => list[index])])),
    )
  }

  /** Use this collection's values as keys and `values` as values. */
  combine(values: any[] | Collection<any>): Dict {
    const list = Collection.unwrap(values as any)

    return Object.fromEntries(this.items.map((key, index) => [String(key), list[index]]))
  }

  /** The cartesian product with the given lists. */
  crossJoin(...others: (any[] | Collection<any>)[]): Collection<any[]> {
    return this.next(
      Arr.crossJoin(this.items, ...others.map((other) => Collection.unwrap(other as any))),
    )
  }

  /* ------------------------------------------------------------------ *
   * Keys and columns
   * ------------------------------------------------------------------ */

  pluck(value: Selector<T>, key?: Selector<T> | null): any {
    return Arr.pluck(this.items, value, key)
  }

  keyBy(key: Selector<T>): Dict<T> {
    return Arr.keyBy(this.items, key)
  }

  groupBy(key: Selector<T>): Dict<T[]> {
    return Arr.groupBy(this.items, key)
  }

  countBy(selector?: Selector<T>): Dict<number> {
    return Arr.countBy(this.items, selector)
  }

  /** Keep only the given indexes. */
  only(indexes: number[]): Collection<T> {
    return this.next(this.items.filter((_, index) => indexes.includes(index)))
  }

  /** Drop the given indexes. */
  except(indexes: number[]): Collection<T> {
    return this.next(this.items.filter((_, index) => !indexes.includes(index)))
  }

  /** The indexes, as a collection. */
  keys(): Collection<number> {
    return this.next(this.items.map((_, index) => index))
  }

  /** A re-indexed copy. */
  values(): Collection<T> {
    return this.next(this.all())
  }

  /** Swap values and indexes. */
  flip(): Dict<number> {
    return Object.fromEntries(this.items.map((item, index) => [String(item), index]))
  }

  /* ------------------------------------------------------------------ *
   * Aggregation
   * ------------------------------------------------------------------ */

  sum(selector?: Selector<T>): number {
    return Arr.sum(this.items, selector)
  }

  avg(selector?: Selector<T>): number | undefined {
    return Arr.avg(this.items, selector)
  }

  /** Alias of {@link Collection.avg}. */
  average(selector?: Selector<T>): number | undefined {
    return this.avg(selector)
  }

  min(selector?: Selector<T>): any {
    return Arr.min(this.items, selector)
  }

  max(selector?: Selector<T>): any {
    return Arr.max(this.items, selector)
  }

  median(selector?: Selector<T>): number | undefined {
    const read = selector ? toCallback<T, any>(selector) : (item: T) => item
    const values = this.items
      .map((item, index) => Number(read(item, index)))
      .filter((item) => !Number.isNaN(item))
      .sort((a, b) => a - b)

    if (values.length === 0) {
      return undefined
    }

    const middle = Math.floor(values.length / 2)

    return values.length % 2 === 0
      ? ((values[middle - 1] as number) + (values[middle] as number)) / 2
      : (values[middle] as number)
  }

  mode(selector?: Selector<T>): any[] | undefined {
    if (this.items.length === 0) {
      return undefined
    }

    const read = selector ? toCallback<T, any>(selector) : (item: T) => item
    const counts = new Map<string, { value: any; count: number }>()

    this.items.forEach((item, index) => {
      const found = read(item, index)
      const hash = identity(found)
      const entry = counts.get(hash)

      if (entry) {
        entry.count++
      } else {
        counts.set(hash, { value: found, count: 1 })
      }
    })

    const highest = Math.max(...[...counts.values()].map((entry) => entry.count))

    return [...counts.values()].filter((entry) => entry.count === highest).map((entry) => entry.value)
  }

  reduce<R>(callback: (carry: R, value: T, key: number) => R, initial: R): R {
    return this.items.reduce(callback, initial)
  }

  /**
   * Join the items into a string.
   *
   * With one argument the value is used as the glue; with two, the first
   * selects a column (or maps each item) and the second is the glue — the
   * same overload Laravel uses.
   */
  implode(selector: Selector<T>, glue?: string): string {
    if (typeof selector === "function") {
      return this.map(selector as (value: T, key: number) => any)
        .all()
        .join(glue ?? "")
    }

    const first = this.first()

    if (first !== null && typeof first === "object") {
      return (this.pluck(selector) as any[]).join(glue ?? "")
    }

    return this.items.join(selector)
  }

  /** Alias of {@link Collection.implode}. */
  join(glue: string, finalGlue = ""): string {
    return Arr.join(this.items, glue, finalGlue)
  }

  /* ------------------------------------------------------------------ *
   * Mutation (mirrors Laravel's mutating methods)
   * ------------------------------------------------------------------ */

  /** Append items. Mutates. */
  push(...values: T[]): this {
    this.items.push(...values)

    return this
  }

  /** Remove and return the last item(s). Mutates. */
  pop(count = 1): T | Collection<T> | undefined {
    if (count === 1) {
      return this.items.pop()
    }

    return this.next(this.items.splice(-count, count).reverse())
  }

  /** Prepend an item. Mutates. */
  prepend(value: T): this {
    this.items.unshift(value)

    return this
  }

  /** Remove and return the first item(s). Mutates. */
  shift(count = 1): T | Collection<T> | undefined {
    if (count === 1) {
      return this.items.shift()
    }

    return this.next(this.items.splice(0, count))
  }

  /** Overwrite the item at `index`. Mutates. */
  put(index: number, value: T): this {
    this.items[index] = value

    return this
  }

  /** Read and remove the item at `index`. Mutates. */
  pull(index: number, fallback?: any): T | undefined {
    if (!this.has(index)) {
      return resolve(fallback)
    }

    return this.items.splice(index, 1)[0]
  }

  /** Remove the item at `index`. Mutates. */
  forget(index: number): this {
    if (this.has(index)) {
      this.items.splice(index, 1)
    }

    return this
  }

  /** Remove and return a slice, optionally inserting replacements. Mutates. */
  splice(index: number, count?: number, replacement: T[] = []): Collection<T> {
    const removed =
      count === undefined
        ? this.items.splice(index)
        : this.items.splice(index, count, ...replacement)

    return this.next(removed)
  }

  /* ------------------------------------------------------------------ *
   * Control flow
   * ------------------------------------------------------------------ */

  /** Run a side effect on every item. Return `false` to stop early. */
  each(callback: (value: T, key: number) => unknown): this {
    for (const [index, item] of this.items.entries()) {
      if (callback(item, index) === false) {
        break
      }
    }

    return this
  }

  /** `each`, spreading tuple items into the callback. */
  eachSpread(callback: (...args: any[]) => unknown): this {
    return this.each((item, index) => callback(...(item as any), index))
  }

  /** Run a side effect on the whole collection without breaking the chain. */
  tap(callback: (collection: this) => void): this {
    callback(this)

    return this
  }

  /** Pass the collection to a callback and return its result. */
  pipe<R>(callback: (collection: this) => R): R {
    return callback(this)
  }

  /** Apply the callback when `condition` is truthy. */
  when(
    condition: unknown,
    callback: (collection: this) => Collection<T> | void,
    fallback?: (collection: this) => Collection<T> | void,
  ): Collection<T> {
    const resolved = typeof condition === "function" ? condition(this) : condition

    if (resolved) {
      return callback(this) ?? this
    }

    return fallback ? (fallback(this) ?? this) : this
  }

  /** Apply the callback when `condition` is falsy. */
  unless(
    condition: unknown,
    callback: (collection: this) => Collection<T> | void,
    fallback?: (collection: this) => Collection<T> | void,
  ): Collection<T> {
    return this.when(!condition, callback, fallback)
  }

  whenEmpty(callback: (collection: this) => Collection<T> | void): Collection<T> {
    return this.when(this.isEmpty(), callback)
  }

  whenNotEmpty(callback: (collection: this) => Collection<T> | void): Collection<T> {
    return this.when(this.isNotEmpty(), callback)
  }

  unlessEmpty(callback: (collection: this) => Collection<T> | void): Collection<T> {
    return this.whenNotEmpty(callback)
  }

  unlessNotEmpty(callback: (collection: this) => Collection<T> | void): Collection<T> {
    return this.whenEmpty(callback)
  }

  /** Log the collection to the console without breaking the chain. */
  dump(): this {
    // eslint-disable-next-line no-console
    console.log(this.toArray())

    return this
  }

  /** A deep copy of the collection. */
  clone(): Collection<T> {
    return this.next(deepClone(this.items))
  }

  /** Iterate with `for...of` and spread with `[...collection]`. */
  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]()
  }
}

export default Collection

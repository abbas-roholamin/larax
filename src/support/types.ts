/** @format */

/** Any plain-object shape keyed by string. */
export type Dict<T = any> = Record<string, T>

/** Anything usable as an array/object key. */
export type Key = string | number

/** A value, or a zero-argument factory that produces it (Laravel's `value()`). */
export type Valuable<T> = T | ((...args: any[]) => T)

/** Predicate used by the `where`-family of helpers. */
export type Predicate<T, K = Key> = (value: T, key: K) => boolean

/** Selector used by `pluck`, `sortBy`, `groupBy`, ... */
export type Selector<T, R = any> = string | ((value: T, key: Key) => R)

/** Comparison operators accepted by `Collection.where`. */
export type Operator =
  | "="
  | "=="
  | "==="
  | "!="
  | "!=="
  | "<>"
  | "<"
  | "<="
  | ">"
  | ">="

/** Case modes accepted by `Str.convertCase`. */
export const MB_CASE_UPPER = 0
export const MB_CASE_LOWER = 1
export const MB_CASE_TITLE = 2

/** @format */

import type { Dict, Key, Operator, Selector, Valuable } from "./types"

/** Resolve a value that may be wrapped in a closure (Laravel's `value()`). */
export function value<T>(target: Valuable<T>, ...args: any[]): T {
  return typeof target === "function" ? (target as (...a: any[]) => T)(...args) : target
}

/** True for plain objects — not arrays, dates, maps, class instances, ... */
export function isPlainObject(target: unknown): target is Dict {
  if (Object.prototype.toString.call(target) !== "[object Object]") {
    return false
  }

  const proto = Object.getPrototypeOf(target)

  return proto === null || proto === Object.prototype
}

/** True when the value can be traversed with array/dot access. */
export function accessible(target: unknown): target is Dict | any[] | Map<any, any> {
  return Array.isArray(target) || isPlainObject(target) || target instanceof Map
}

/** Laravel's `blank()` — null, empty string/array/object, or whitespace-only. */
export function blank(target: unknown): boolean {
  if (target === null || target === undefined) {
    return true
  }

  if (typeof target === "string") {
    return target.trim() === ""
  }

  if (typeof target === "number") {
    return Number.isNaN(target)
  }

  if (typeof target === "boolean") {
    return false
  }

  if (Array.isArray(target)) {
    return target.length === 0
  }

  if (target instanceof Map || target instanceof Set) {
    return target.size === 0
  }

  if (isPlainObject(target)) {
    return Object.keys(target).length === 0
  }

  return false
}

/** Laravel's `filled()` — the inverse of {@link blank}. */
export function filled(target: unknown): boolean {
  return !blank(target)
}

/** Read a single, non-nested key off an array, object or Map. */
export function readKey(target: any, key: Key): any {
  if (target === null || target === undefined) {
    return undefined
  }

  if (target instanceof Map) {
    return target.get(key)
  }

  return target[key]
}

/** True when the key exists on the target (even holding `undefined`). */
export function hasKey(target: any, key: Key): boolean {
  if (target === null || target === undefined) {
    return false
  }

  if (target instanceof Map) {
    return target.has(key)
  }

  if (Array.isArray(target)) {
    const index = Number(key)

    return Number.isInteger(index) && index >= 0 && index < target.length
  }

  if (typeof target === "object") {
    return Object.prototype.hasOwnProperty.call(target, key)
  }

  return false
}

/** Turn a selector (dot-path string or callback) into a callback. */
export function toCallback<T, R>(selector: Selector<T, R>): (value: T, key: Key) => R {
  if (typeof selector === "function") {
    return selector
  }

  return (item: T) => dataGet(item, selector) as R
}

/**
 * Read a nested value using "dot" notation, with `*` wildcard support.
 *
 * Mirrors Laravel's `data_get()`, including the way a wildcard flattens one
 * level of results into an array.
 */
export function dataGet(target: any, path: Key | Key[] | null | undefined, fallback?: any): any {
  if (path === null || path === undefined) {
    return target
  }

  const segments = Array.isArray(path) ? [...path] : String(path).split(".")

  for (let i = 0; i < segments.length; i++) {
    const segment = String(segments[i])

    if (segment === "*") {
      if (!accessible(target)) {
        return value(fallback)
      }

      const rest = segments.slice(i + 1)
      const items = target instanceof Map ? [...target.values()] : Object.values(target)

      if (rest.length === 0) {
        return items
      }

      const collected = items.map((item) => dataGet(item, rest, fallback))

      // A trailing wildcard in the remainder means "flatten one level".
      return rest.includes("*") ? collected.flat() : collected
    }

    if (!accessible(target) || !hasKey(target, segment)) {
      return value(fallback)
    }

    target = readKey(target, segment)
  }

  return target === undefined ? value(fallback) : target
}

/** Compare two values with a Laravel-style operator string. */
export function compare(left: any, operator: Operator, right: any): boolean {
  switch (operator) {
    case "=":
    case "==":
      // eslint-disable-next-line eqeqeq
      return left == right
    case "===":
      return left === right
    case "!=":
    case "<>":
      // eslint-disable-next-line eqeqeq
      return left != right
    case "!==":
      return left !== right
    case "<":
      return left < right
    case "<=":
      return left <= right
    case ">":
      return left > right
    case ">=":
      return left >= right
    default:
      return false
  }
}

/** Structural equality used by `unique()`, `diff()`, `contains()`, ... */
export function looseEquals(left: any, right: any): boolean {
  if (left === right) {
    return true
  }

  if (typeof left !== typeof right || left === null || right === null) {
    return false
  }

  if (typeof left !== "object") {
    return false
  }

  if (Array.isArray(left) !== Array.isArray(right)) {
    return false
  }

  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(right, key) &&
      looseEquals(left[key], right[key]),
  )
}

/** Stable identity string used for hashing values into Sets/Maps. */
export function identity(target: any): string {
  if (target === null) {
    return "null"
  }

  if (target === undefined) {
    return "undefined"
  }

  if (typeof target !== "object") {
    return `${typeof target}:${String(target)}`
  }

  if (Array.isArray(target)) {
    return `[${target.map(identity).join(",")}]`
  }

  const keys = Object.keys(target).sort()

  return `{${keys.map((key) => `${key}:${identity(target[key])}`).join(",")}}`
}

/** Deep clone plain data (objects, arrays, dates, maps, sets). */
export function deepClone<T>(target: T): T {
  if (target === null || typeof target !== "object") {
    return target
  }

  if (target instanceof Date) {
    return new Date(target.getTime()) as unknown as T
  }

  if (target instanceof RegExp) {
    return new RegExp(target.source, target.flags) as unknown as T
  }

  if (Array.isArray(target)) {
    return target.map(deepClone) as unknown as T
  }

  if (target instanceof Map) {
    return new Map([...target].map(([k, v]) => [deepClone(k), deepClone(v)])) as unknown as T
  }

  if (target instanceof Set) {
    return new Set([...target].map(deepClone)) as unknown as T
  }

  if (isPlainObject(target)) {
    const out: Dict = {}

    for (const [key, item] of Object.entries(target)) {
      out[key] = deepClone(item)
    }

    return out as T
  }

  return target
}

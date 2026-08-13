/** @format */

import Arr from "../array"
import {
  accessible,
  blank,
  dataGet,
  deepClone,
  hasKey,
  isPlainObject,
  looseEquals,
  value as resolve,
} from "../support/value"
import type { Dict, Key, Predicate, Valuable } from "../support/types"
import type { LegacyGetProps } from "./type"

/** Detect the legacy single-object call style: `Obj.get({obj, path, daf})`. */
function isLegacyGet(target: unknown, argumentCount: number): target is LegacyGetProps {
  return (
    argumentCount === 1 &&
    isPlainObject(target) &&
    "obj" in target &&
    "path" in target &&
    typeof (target as Dict)["path"] === "string"
  )
}

/**
 * Laravel's `data_*` helpers plus general object utilities.
 *
 * Where Laravel operates on one array type, `Obj` handles keyed structures and
 * {@link Arr} handles lists — most methods happily accept either.
 */
class Obj {
  /* ------------------------------------------------------------------ *
   * Reading
   * ------------------------------------------------------------------ */

  /**
   * Read a nested value using dot notation, with `*` wildcard support.
   *
   * ```ts
   * Obj.get({ foo: { bar: "baz" } }, "foo.bar")        // "baz"
   * Obj.get({ users: [{ name: "a" }] }, "users.*.name") // ["a"]
   * ```
   *
   * The fallback is returned only when the path is missing — a stored `0`,
   * `""` or `false` is returned as-is.
   *
   * @remarks
   * The legacy `Obj.get({ obj, path, daf })` form is still supported.
   */
  static get(target: Dict | any[] | LegacyGetProps, path?: Key | Key[] | null, fallback?: any): any {
    if (isLegacyGet(target, arguments.length)) {
      return dataGet(target.obj, target.path, target.daf)
    }

    return dataGet(target, path, fallback)
  }

  /** True when every dot-notation path exists. */
  static has(target: any, paths: Key | Key[]): boolean {
    return Arr.has(target, paths)
  }

  /** True when any dot-notation path exists. */
  static hasAny(target: any, paths: Key | Key[]): boolean {
    return Arr.hasAny(target, paths)
  }

  /** True when the own (non-nested) key exists. */
  static exists(target: any, key: Key): boolean {
    return hasKey(target, key)
  }

  /* ------------------------------------------------------------------ *
   * Writing
   * ------------------------------------------------------------------ */

  /**
   * Set a nested value using dot notation, with `*` wildcard support.
   *
   * Mutates and returns `target`. Pass `overwrite = false` to keep any value
   * that is already present (Laravel's `data_fill()`).
   */
  static set<T extends Dict | any[]>(
    target: T,
    path: Key | Key[],
    value: any,
    overwrite = true,
  ): T {
    const segments = Array.isArray(path) ? [...path] : String(path).split(".")
    const segment = String(segments.shift())

    if (segment === "*") {
      if (!accessible(target)) {
        return target
      }

      for (const key of Arr.keys(target as any)) {
        if (segments.length > 0) {
          Obj.set((target as Dict)[key], segments, value, overwrite)
        } else if (overwrite || (target as Dict)[key] === undefined) {
          ;(target as Dict)[key] = resolve(value)
        }
      }

      return target
    }

    if (segments.length > 0) {
      if (!accessible((target as Dict)[segment])) {
        ;(target as Dict)[segment] = /^\d+$/.test(String(segments[0])) ? [] : {}
      }

      Obj.set((target as Dict)[segment], segments, value, overwrite)

      return target
    }

    if (overwrite || (target as Dict)[segment] === undefined) {
      ;(target as Dict)[segment] = resolve(value)
    }

    return target
  }

  /** Set a nested value only where nothing is present yet. */
  static fill<T extends Dict | any[]>(target: T, path: Key | Key[], value: any): T {
    return Obj.set(target, path, value, false)
  }

  /** Add a key only when it is missing. */
  static add<T extends Dict>(target: T, key: Key, value: any): T {
    return Arr.add(target, key, value)
  }

  /** Remove one or more dot-notation paths, mutating the target. */
  static forget<T extends Dict | any[]>(target: T, paths: Key | Key[]): T {
    for (const path of Arr.wrap(paths)) {
      const segments = String(path).split(".")
      const segment = String(segments[0])

      if (segment === "*" && accessible(target)) {
        for (const key of Arr.keys(target as any)) {
          if (segments.length > 1) {
            Obj.forget((target as Dict)[key], segments.slice(1).join("."))
          }
        }

        continue
      }

      Arr.forget(target, path)
    }

    return target
  }

  /** Read a key and remove it from the object. */
  static pull<T>(target: Dict<T>, key: Key, fallback?: Valuable<any>): T | undefined {
    return Arr.pull(target, key, fallback)
  }

  /* ------------------------------------------------------------------ *
   * Shape
   * ------------------------------------------------------------------ */

  /** Keep only the given keys. */
  static only<T>(target: Dict<T>, keys: Key | Key[]): Dict<T> {
    return Arr.only(target, keys)
  }

  /** Alias of {@link Obj.only}. */
  static pick<T>(target: Dict<T>, keys: Key | Key[]): Dict<T> {
    return Arr.only(target, keys)
  }

  /** Drop the given keys. */
  static except<T>(target: Dict<T>, keys: Key | Key[]): Dict<T> {
    return Arr.except(target, keys)
  }

  /** Alias of {@link Obj.except}. */
  static omit<T>(target: Dict<T>, keys: Key | Key[]): Dict<T> {
    return Arr.except(target, keys)
  }

  /** The object's keys. */
  static keys(target: Dict): string[] {
    return Object.keys(target ?? {})
  }

  /** The object's values. */
  static values<T>(target: Dict<T>): T[] {
    return Object.values(target ?? {})
  }

  /** The object's `[key, value]` pairs. */
  static entries<T>(target: Dict<T>): [string, T][] {
    return Object.entries(target ?? {})
  }

  /** Build an object from `[key, value]` pairs. */
  static fromEntries<T>(entries: Iterable<readonly [Key, T]>): Dict<T> {
    return Object.fromEntries(entries) as Dict<T>
  }

  /** Number of own enumerable keys. */
  static count(target: Dict): number {
    return Object.keys(target ?? {}).length
  }

  /** Swap keys and values. */
  static invert(target: Dict): Dict<string> {
    return Object.fromEntries(Object.entries(target).map(([key, item]) => [String(item), key]))
  }

  /** Flatten to dot-keyed pairs. */
  static dot(target: Dict | any[], prepend = ""): Dict {
    return Arr.dot(target, prepend)
  }

  /** Expand dot-keyed pairs back into a nested object. */
  static undot(target: Dict): Dict {
    return Arr.undot(target)
  }

  /* ------------------------------------------------------------------ *
   * Transformation
   * ------------------------------------------------------------------ */

  /** Map over the values, keeping the keys. */
  static map<T, R>(target: Dict<T>, callback: (value: T, key: string) => R): Dict<R> {
    return Arr.map(target, callback)
  }

  /** Alias of {@link Obj.map}. */
  static mapValues<T, R>(target: Dict<T>, callback: (value: T, key: string) => R): Dict<R> {
    return Arr.map(target, callback)
  }

  /** Map over the keys, keeping the values. */
  static mapKeys<T>(target: Dict<T>, callback: (key: string, value: T) => Key): Dict<T> {
    return Object.fromEntries(
      Object.entries(target).map(([key, item]) => [String(callback(key, item)), item]),
    )
  }

  /** Map each entry to a new `[key, value]` pair. */
  static mapWithKeys<T>(
    target: Dict<T>,
    callback: (value: T, key: Key) => [Key, any] | Dict,
  ): Dict {
    return Arr.mapWithKeys(target, callback)
  }

  /** Keep entries passing the callback (defaults to dropping blanks). */
  static filter<T>(target: Dict<T>, callback?: Predicate<T, string>): Dict<T> {
    return Arr.where(target, (item, key) =>
      callback ? callback(item, String(key)) : !blank(item),
    )
  }

  /** Drop entries passing the callback. */
  static reject<T>(target: Dict<T>, callback: Predicate<T, string>): Dict<T> {
    return Arr.reject(target, (item, key) => callback(item, String(key)))
  }

  /** Recursively merge objects; later sources win. */
  static merge(...sources: (Dict | null | undefined)[]): Dict {
    const out: Dict = {}

    for (const source of sources) {
      if (!isPlainObject(source)) {
        continue
      }

      for (const [key, item] of Object.entries(source)) {
        const current = out[key]

        out[key] =
          isPlainObject(current) && isPlainObject(item) ? Obj.merge(current, item) : deepClone(item)
      }
    }

    return out
  }

  /** Fill in missing keys from the given defaults. */
  static defaults(target: Dict, ...sources: Dict[]): Dict {
    return Obj.merge(...sources, target)
  }

  /** Deep clone the object. */
  static clone<T>(target: T): T {
    return deepClone(target)
  }

  /** Recursively freeze the object. */
  static freeze<T>(target: T): Readonly<T> {
    if (target !== null && typeof target === "object" && !Object.isFrozen(target)) {
      Object.freeze(target)

      for (const item of Object.values(target)) {
        Obj.freeze(item)
      }
    }

    return target
  }

  /* ------------------------------------------------------------------ *
   * Comparison
   * ------------------------------------------------------------------ */

  /** Structural equality. */
  static equals(left: any, right: any): boolean {
    return looseEquals(left, right)
  }

  /** True when the object has no own enumerable keys. */
  static isEmpty(target: Dict): boolean {
    return Obj.count(target) === 0
  }

  /** True when the object has at least one own enumerable key. */
  static isNotEmpty(target: Dict): boolean {
    return !Obj.isEmpty(target)
  }

  /** True when the value is a plain object. */
  static isObject(target: unknown): target is Dict {
    return isPlainObject(target)
  }
}

export default Obj

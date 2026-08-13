/** @format */

import Collection from "../collection"
import Stringable from "../stringable"
import Obj from "../object"
import {
  blank as isBlank,
  dataGet as readData,
  filled as isFilled,
  value as resolveValue,
} from "../support/value"
import type { Dict, Key, Valuable } from "../support/types"

/** Resolve a value that may be wrapped in a closure. */
export const value = resolveValue

/** True for `null`, `undefined`, `NaN`, or an empty string/array/object. */
export const blank = isBlank

/** The inverse of {@link blank}. */
export const filled = isFilled

/** Read a nested value with dot notation and `*` wildcards. */
export const dataGet = readData

/** Set a nested value with dot notation and `*` wildcards. Mutates. */
export function dataSet<T extends Dict | any[]>(
  target: T,
  path: Key | Key[],
  newValue: any,
  overwrite = true,
): T {
  return Obj.set(target, path, newValue, overwrite)
}

/** Set a nested value only where nothing is present yet. Mutates. */
export function dataFill<T extends Dict | any[]>(target: T, path: Key | Key[], newValue: any): T {
  return Obj.set(target, path, newValue, false)
}

/** Remove a nested value with dot notation. Mutates. */
export function dataForget<T extends Dict | any[]>(target: T, path: Key | Key[]): T {
  return Obj.forget(target, path)
}

/** Start a fluent string chain. */
export function str(subject = ""): Stringable {
  return new Stringable(subject)
}

/** Start a fluent collection chain. */
export function collect<T>(items?: Iterable<T> | Dict<T> | T[] | null): Collection<T> {
  return new Collection<T>(items)
}

/** The first element of an array. */
export function head<T>(items: T[]): T | undefined {
  return items[0]
}

/** The last element of an array. */
export function last<T>(items: T[]): T | undefined {
  return items[items.length - 1]
}

/** Run a side effect on a value and return the value unchanged. */
export function tap<T>(target: T, callback?: (value: T) => void): T {
  callback?.(target)

  return target
}

/** Apply a callback to a value unless it is blank. */
export function transform<T, R>(
  target: T,
  callback: (value: NonNullable<T>) => R,
  fallback?: Valuable<R>,
): R | undefined {
  if (isFilled(target)) {
    return callback(target as NonNullable<T>)
  }

  return fallback === undefined ? undefined : resolveValue(fallback)
}

/** Pass a value into a callback and return the result. */
export function withValue<T, R>(target: T, callback?: (value: T) => R): T | R {
  return callback ? callback(target) : target
}

/** Throw when the condition is truthy. */
export function throwIf<T>(
  condition: T,
  error: string | Error | (new (...args: any[]) => Error) = Error,
  ...args: any[]
): T {
  if (condition) {
    throw buildError(error, args)
  }

  return condition
}

/** Throw when the condition is falsy. */
export function throwUnless<T>(
  condition: T,
  error: string | Error | (new (...args: any[]) => Error) = Error,
  ...args: any[]
): T {
  if (!condition) {
    throw buildError(error, args)
  }

  return condition
}

function buildError(
  error: string | Error | (new (...args: any[]) => Error),
  args: any[],
): Error {
  if (typeof error === "string") {
    return new Error(error)
  }

  if (error instanceof Error) {
    return error
  }

  return new error(...args)
}

/**
 * Retry a callback up to `times`, sleeping `sleepMilliseconds` between
 * attempts. Rethrows the final error when every attempt fails.
 */
export async function retry<T>(
  times: number,
  callback: (attempt: number) => T | Promise<T>,
  sleepMilliseconds: number | ((attempt: number) => number) = 0,
  when?: (error: unknown) => boolean,
): Promise<T> {
  let attempt = 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await callback(attempt)
    } catch (error) {
      if (attempt >= times || (when && !when(error))) {
        throw error
      }

      const delay =
        typeof sleepMilliseconds === "function" ? sleepMilliseconds(attempt) : sleepMilliseconds

      if (delay > 0) {
        await new Promise((done) => setTimeout(done, delay))
      }

      attempt++
    }
  }
}

/** Memoize a zero-argument callback so it only ever runs once. */
export function once<T>(callback: () => T): () => T {
  let called = false
  let result: T

  return () => {
    if (!called) {
      result = callback()
      called = true
    }

    return result
  }
}

/**
 * Wrap a possibly-null value so property access is always safe.
 *
 * ```ts
 * optional(user).name          // undefined rather than a TypeError
 * optional(user, (u) => u.name)
 * ```
 */
export function optional<T, R>(target: T, callback?: (value: NonNullable<T>) => R): any {
  if (callback) {
    return target === null || target === undefined ? undefined : callback(target as NonNullable<T>)
  }

  if (target !== null && target !== undefined) {
    return target
  }

  return new Proxy(
    {},
    {
      get: () => undefined,
      has: () => false,
    },
  )
}

/** Sleep for the given number of milliseconds. */
export function sleep(milliseconds: number): Promise<void> {
  return new Promise((done) => setTimeout(done, milliseconds))
}

/** The class name of a value, without any namespace. */
export function classBasename(target: any): string {
  if (typeof target === "function") {
    return target.name
  }

  return target?.constructor?.name ?? ""
}

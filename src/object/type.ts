/** @format */

import type { Dict } from "../support/types"

/**
 * The original `Obj.get({ obj, path, daf })` call style.
 *
 * @deprecated Prefer the positional form, `Obj.get(obj, path, fallback)`.
 */
export type LegacyGetProps = {
  obj: Dict
  path: string
  daf?: any
}

/** @deprecated Kept as an alias of {@link LegacyGetProps}. */
export type getProps = LegacyGetProps

export type { Dict, Key } from "../support/types"

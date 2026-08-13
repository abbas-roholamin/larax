/** @format */

/**
 * The original `Num.clamp({ num, min, max })` call style.
 *
 * @deprecated Prefer the positional form, `Num.clamp(num, min, max)`.
 */
export type ClampProps = {
  num: number
  min: number
  max: number
}

/** @deprecated Kept as an alias of {@link ClampProps}. */
export type clampProps = ClampProps

/** Shared options for the locale-aware formatting methods. */
export type FormatOptions = {
  /** Minimum number of fraction digits. */
  precision?: number
  /** Maximum number of fraction digits. */
  maxPrecision?: number
  /** BCP 47 locale tag; falls back to the configured default. */
  locale?: string
}

/** Options accepted by `Num.fileSize()`. */
export type FileSizeOptions = FormatOptions

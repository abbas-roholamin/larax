/** @format */

/** Options accepted by `Str.excerpt()`. */
export type ExcerptOptions = {
  /** How many characters of context to keep either side of the phrase. */
  radius?: number
  /** Marker appended/prepended when the text was cut. */
  omission?: string
}

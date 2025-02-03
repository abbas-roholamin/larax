/** @format */
class Str {
  static contains(
    str: string,
    keys: string[] | string,
    ignoreCase = false,
  ): boolean {
    if (typeof keys === "string") {
      keys = [keys]
    }

    const strSet = new Set(
      ignoreCase ? str.toLowerCase().split(" ") : str.split(" "),
    )

    return keys.some((key) => {
      if (key === "") {
        return false
      }

      key = ignoreCase ? key.toLowerCase() : key

      return strSet.has(key)
    })
  }
}

export default Str

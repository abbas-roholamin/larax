/** @format */

/**
 * English inflector modelled on the Doctrine Inflector rules that Laravel
 * uses behind `Str::plural()` / `Str::singular()`.
 */

type Rule = [RegExp, string]

const UNCOUNTABLE = new Set([
  "advice", "aircraft", "audio", "bison", "bream", "breeches", "britches",
  "butter", "carp", "cattle", "chassis", "cod", "coal", "compensation",
  "coreopsis", "clothing", "cotton", "data", "deer", "education",
  "electricity", "elk", "energy", "equipment", "evidence", "feedback",
  "firmware", "fish", "flounder", "food", "furniture", "gas", "gold",
  "graffiti", "greenfly", "hardware", "headquarters", "health", "herpes",
  "highjinks", "homework", "housework", "information", "jeans", "justice",
  "kudos", "labour", "literature", "love", "machinery", "mackerel", "mail",
  "media", "mews", "money", "moose", "monkeys", "music", "manga", "mud",
  "news", "news", "nutrition", "offspring", "oil", "only", "personnel",
  "pike", "plankton", "pliers", "police", "pollution", "premises", "rain",
  "research", "rice", "salmon", "sand", "scissors", "series", "sewage",
  "shambles", "sheep", "shrimp", "silk", "sms", "software", "soap", "spam",
  "species", "staff", "swine", "sugar", "tennis", "traffic", "transportation",
  "trout", "tuna", "understanding", "water", "weather", "wheat", "whiting",
  "wildebeest", "wood", "wool", "you",
])

const IRREGULAR: Record<string, string> = {
  atlas: "atlases", axe: "axes", beef: "beefs", brother: "brothers",
  cafe: "cafes", chateau: "chateaux", niveau: "niveaux", child: "children",
  cookie: "cookies", corpus: "corpuses", cow: "cows", criterion: "criteria",
  curriculum: "curricula", demo: "demos", domino: "dominoes", echo: "echoes",
  epoch: "epochs", foot: "feet", fungus: "fungi", ganglion: "ganglions",
  genie: "genies", genus: "genera", goose: "geese", graffito: "graffiti",
  hippopotamus: "hippopotami", hoof: "hoofs", human: "humans",
  iris: "irises", larva: "larvae", leaf: "leaves", loaf: "loaves",
  man: "men", medium: "media", memorandum: "memoranda", money: "monies",
  mongoose: "mongooses", motto: "mottoes", move: "moves", mouse: "mice",
  mythos: "mythoi", nebula: "nebulae", neurosis: "neuroses", nucleus: "nuclei",
  numen: "numina", oaf: "oaves", occiput: "occiputs", octopus: "octopuses",
  opus: "opuses", ox: "oxen", penis: "penises", person: "people",
  plateau: "plateaux", runner_up: "runners-up", sex: "sexes",
  soliloquy: "soliloquies", son_in_law: "sons-in-law", syllabus: "syllabi",
  testis: "testes", thief: "thieves", tooth: "teeth", tornado: "tornadoes",
  trilby: "trilbys", turf: "turfs", valve: "valves", volcano: "volcanoes",
  zombie: "zombies",
}

const IRREGULAR_INVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(IRREGULAR).map(([singular, plural]) => [plural, singular]),
)

const PLURAL_RULES: Rule[] = [
  [/(s)tatus$/i, "$1tatuses"],
  [/(quiz)$/i, "$1zes"],
  [/^(ox)$/i, "$1en"],
  [/([m|l])ouse$/i, "$1ice"],
  [/(matr|vert|ind)(ix|ex)$/i, "$1ices"],
  [/(x|ch|ss|sh)$/i, "$1es"],
  [/([^aeiouy]|qu)y$/i, "$1ies"],
  [/(hive)$/i, "$1s"],
  [/(?:([^f])fe|([lr])f)$/i, "$1$2ves"],
  [/sis$/i, "ses"],
  [/([ti])um$/i, "$1a"],
  [/(alias|status)$/i, "$1es"],
  [/(bu)s$/i, "$1ses"],
  [/(octop|vir)us$/i, "$1i"],
  [/(ax|test)is$/i, "$1es"],
  [/(us)$/i, "$1es"],
  [/s$/i, "s"],
  [/$/, "s"],
]

const SINGULAR_RULES: Rule[] = [
  [/(s)tatuses$/i, "$1tatus"],
  [/^(.*)(menu)s$/i, "$1$2"],
  [/(quiz)zes$/i, "$1"],
  [/(matr)ices$/i, "$1ix"],
  [/(vert|ind)ices$/i, "$1ex"],
  [/^(ox)en/i, "$1"],
  [/(alias|status)(es)?$/i, "$1"],
  [/(octop|vir)(us|i)$/i, "$1us"],
  [/^(a)x[ie]s$/i, "$1xis"],
  [/(cris|test)(is|es)$/i, "$1is"],
  [/(shoe)s$/i, "$1"],
  [/(o)es$/i, "$1"],
  [/(bus)(es)?$/i, "$1"],
  [/([m|l])ice$/i, "$1ouse"],
  [/(x|ch|ss|sh)es$/i, "$1"],
  [/(m)ovies$/i, "$1ovie"],
  [/(s)eries$/i, "$1eries"],
  [/([^aeiouy]|qu)ies$/i, "$1y"],
  [/([lr])ves$/i, "$1f"],
  [/(tive)s$/i, "$1"],
  [/(hive)s$/i, "$1"],
  [/([^f])ves$/i, "$1fe"],
  [/(^analy)(sis|ses)$/i, "$1sis"],
  [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)(sis|ses)$/i, "$1sis"],
  [/([ti])(um|a)$/i, "$1um"],
  [/(n)ews$/i, "$1ews"],
  [/(ss)$/i, "$1"],
  [/s$/i, ""],
]

/** Reapply the casing of `original` (all-caps / capitalised) onto `value`. */
function matchCase(value: string, original: string): string {
  if (original === original.toUpperCase()) {
    return value.toUpperCase()
  }

  if (original[0] === original[0]?.toUpperCase()) {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  return value
}

function inflect(value: string, rules: Rule[], irregular: Record<string, string>): string {
  if (value === "") {
    return value
  }

  // Only the final word of a compound ("user_profile") is inflected.
  const match = /^(.*?)([a-zA-Z]+)$/.exec(value)

  if (!match) {
    return value
  }

  const prefix = match[1] ?? ""
  const word = match[2] ?? ""
  const lower = word.toLowerCase()

  if (UNCOUNTABLE.has(lower)) {
    return value
  }

  const known = irregular[lower]

  if (known !== undefined) {
    return prefix + matchCase(known, word)
  }

  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) {
      return prefix + word.replace(pattern, replacement)
    }
  }

  return value
}

/** Pluralize an English word. */
export function pluralize(value: string): string {
  return inflect(value, PLURAL_RULES, IRREGULAR)
}

/** Singularize an English word. */
export function singularize(value: string): string {
  return inflect(value, SINGULAR_RULES, IRREGULAR_INVERSE)
}

/** Return the plural form only when `count` is not exactly one. */
export function pluralizeFor(value: string, count: number): string {
  return Math.abs(count) === 1 ? singularize(value) : pluralize(value)
}

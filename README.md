# Larax

![Larax Logo](https://i.postimg.cc/258hYsbR/larax-logo.jpg)

<p>
  <a href="https://github.com/abbas-roholamin/larax/actions/workflows/ci.yml"><img src="https://github.com/abbas-roholamin/larax/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://www.npmjs.com/package/larax"><img src="https://img.shields.io/npm/v/larax.svg" alt="npm version"></a>
  <a href="https://bundlephobia.com/package/larax"><img src="https://img.shields.io/bundlephobia/minzip/larax.svg" alt="gzipped size"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/larax.svg" alt="MIT license"></a>
</p>

**Larax** brings Laravel's helper API to JavaScript and TypeScript. If you know
`Str::slug()`, `Arr::pluck()`, `Number::fileSize()` or `collect()->groupBy()`,
you already know Larax.

## Features

- 🔥 **Laravel-inspired helpers** – `Str`, `Arr`, `Obj`, `Num`, `Collection` and the fluent `Stringable`
- 📦 **Zero runtime dependencies** – ships ESM + CJS builds with full type declarations
- 🌍 **Runs anywhere** – Node.js 18+, Deno, Bun and the browser
- 🧪 **Tested** – every helper is covered by the test suite

## Installation

```sh
npm install larax
```

## Usage

```ts
import { Str, Arr, Obj, Num, collect, str } from "larax"

Str.slug("Crème Brûlée @ Home")        // "creme-brulee-at-home"
Arr.pluck(users, "profile.name")        // ["Taylor", "Abigail"]
Obj.get(config, "mail.from.address")    // dot notation with a fallback
Num.fileSize(1_048_576)                 // "1 MB"

collect([1, 2, 3, 4])
  .filter((n) => n % 2 === 0)
  .sum()                                // 6

str(" Laravel Framework ").squish().slug().toString() // "laravel-framework"
```

CommonJS works too:

```js
const { Str } = require("larax")
```

---

## `Str`

Static string helpers. Every method takes the subject as its first argument.

**Slicing** — `after` · `afterLast` · `before` · `beforeLast` · `between` ·
`betweenFirst` · `charAt` · `chopStart` · `chopEnd` · `substr` ·
`substrReplace` · `substrCount` · `take` · `length`

**Searching** — `contains` · `containsAll` · `doesntContain` · `startsWith` ·
`endsWith` · `position` · `is` · `isMatch` · `match` · `matchAll`

**Casing** — `lower` · `upper` · `ucfirst` · `lcfirst` · `title` · `apa` ·
`convertCase` · `camel` · `studly` · `snake` · `kebab` · `headline` · `ucsplit`

**Replacement** — `replace` · `replaceArray` · `replaceFirst` · `replaceLast` ·
`replaceStart` · `replaceEnd` · `replaceMatches` · `remove` · `swap` · `mask`

**Padding & trimming** — `padBoth` · `padLeft` · `padRight` · `trim` · `ltrim` ·
`rtrim` · `squish` · `deduplicate` · `start` · `finish` · `wrap` · `unwrap` ·
`wordWrap`

**Truncation** — `limit` · `words` · `wordCount` · `excerpt`

**Inflection** — `plural` · `singular` · `pluralStudly` · `pluralPascal`

**Transformation** — `ascii` · `transliterate` · `slug` · `reverse` · `repeat` ·
`numbers` · `toBase64` · `fromBase64` · `explode`

**Validation** — `isAscii` · `isJson` · `isUrl` · `isUuid` · `isUlid`

**Generation** — `random` · `password` · `uuid` · `uuid7` · `orderedUuid` · `ulid`

```ts
Str.limit("The quick brown fox", 10)              // "The quick..."
Str.mask("taylor@example.com", "*", 3)            // "tay***************"
Str.plural("child")                               // "children"
Str.headline("EmailNotificationSent")             // "Email Notification Sent"
Str.excerpt("This is my name", "my", { radius: 3 }) // "...is my na..."
```

Multi-byte and astral characters (emoji, accents) count as single units, so
`Str.length("a👍b")` is `3`.

## `Stringable` / `str()`

`str(value)` — or `Str.of(value)` — returns a chainable wrapper exposing the
same API, plus `append`, `prepend`, `basename`, `dirname`, `pipe`, `tap`,
`when`, `unless`, `whenEmpty`, `whenContains`, `toInteger`, `toFloat`,
`toBoolean` and `toDate`.

```ts
str("tony stark")
  .whenContains("tony", (value) => value.title())
  .append(" — Iron Man")
  .toString() // "Tony Stark — Iron Man"
```

Chains are immutable, and the wrapper coerces to a string implicitly:

```ts
`${str("laravel")}` // "laravel"
```

## `Arr`

Array and keyed-collection helpers. Methods Laravel defines over associative
arrays accept both JS arrays and plain objects.

**Reading** — `get` · `has` · `hasAny` · `exists` · `first` · `last` · `sole` ·
`random` · `accessible` · `isArray` · `isAssoc` · `isList`

**Writing** — `set` · `add` · `forget` · `pull` · `prepend`

**Shape** — `entries` · `keys` · `values` · `divide` · `wrap` · `from` ·
`collapse` · `flatten` · `dot` · `undot` · `crossJoin` · `chunk` · `split` ·
`take` · `partition`

**Selection** — `only` · `except` · `select` · `pluck` · `keyBy` ·
`prependKeysWith`

**Filtering & mapping** — `where` · `whereColumn` · `whereNotNull` · `reject` ·
`filter` · `string` · `map` · `mapWithKeys` · `mapSpread`

**Ordering & sets** — `sort` · `sortDesc` · `sortRecursive` ·
`sortRecursiveDesc` · `shuffle` · `unique` · `diff` · `intersect` · `contains`

**Output & aggregation** — `join` · `query` · `toCssClasses` · `toCssStyles` ·
`sum` · `avg` · `min` · `max` · `groupBy` · `countBy` · `clone`

```ts
Arr.dot({ products: { desk: { price: 100 } } }) // { "products.desk.price": 100 }
Arr.join(["Tailwind", "Alpine", "Livewire"], ", ", " and ")
// "Tailwind, Alpine and Livewire"
Arr.toCssClasses(["p-4", { "font-bold": true, "text-red": false }])
// "p-4 font-bold"
```

Note that `Arr.sort` orders numbers numerically, not lexicographically.

## `Obj`

Laravel's `data_*` helpers plus general object utilities. Dot paths support
`*` wildcards.

**Reading** — `get` · `has` · `hasAny` · `exists`
**Writing** — `set` · `fill` · `add` · `forget` · `pull`
**Shape** — `only` / `pick` · `except` / `omit` · `keys` · `values` · `entries` ·
`fromEntries` · `count` · `invert` · `dot` · `undot`
**Transformation** — `map` / `mapValues` · `mapKeys` · `mapWithKeys` · `filter` ·
`reject` · `merge` · `defaults` · `clone` · `freeze`
**Comparison** — `equals` · `isEmpty` · `isNotEmpty` · `isObject`

```ts
Obj.get({ users: [{ name: "Taylor" }] }, "users.*.name") // ["Taylor"]
Obj.set({}, "products.desk.price", 100) // { products: { desk: { price: 100 } } }
Obj.merge({ a: { x: 1 } }, { a: { y: 2 } }) // { a: { x: 1, y: 2 } }
```

## `Num`

Locale-aware number formatting built on `Intl`.

**Formatting** — `format` · `currency` · `percentage` · `fileSize` ·
`abbreviate` · `forHumans`
**Words** — `spell` · `spellOrdinal` · `ordinal`
**Maths** — `clamp` · `pairs` · `trim` · `parseInt` · `parseFloat` ·
`isNumeric` · `round` · `random` · `sum` · `average` · `lerp` · `percentOf`
**Configuration** — `useLocale` · `useCurrency` · `withLocale` · `withCurrency` ·
`defaultLocale` · `defaultCurrency`

```ts
Num.currency(1000)                          // "$1,000.00"
Num.abbreviate(489_939)                     // "490K"
Num.forHumans(1_230_000, { precision: 2 })  // "1.23 million"
Num.spell(1234)                             // "one thousand two hundred thirty-four"
Num.ordinal(21)                             // "21st"

Num.withLocale("de-DE", () => Num.format(100000)) // "100.000"
```

## `Collection` / `collect()`

A chainable collection over a JavaScript array. Transforming methods return a
new collection; the methods Laravel mutates in place (`push`, `pop`, `shift`,
`put`, `pull`, `forget`, `splice`, `transform`) mutate here too.

**Access** — `all` · `toArray` · `toJson` · `count` · `get` · `has` · `first` ·
`last` · `firstWhere` · `sole` · `random` · `search`

**Predicates** — `isEmpty` · `isNotEmpty` · `contains` · `doesntContain` ·
`every` · `some`

**Transformation** — `map` · `flatMap` · `mapSpread` · `mapWithKeys` ·
`mapToGroups` · `transform` · `filter` · `reject` · `where` · `whereIn` ·
`whereNotIn` · `whereBetween` · `whereNotBetween` · `whereNull` · `whereNotNull`

**Shape** — `collapse` · `flatten` · `chunk` · `chunkWhile` · `sliding` ·
`split` · `splitIn` · `partition` · `pad`

**Ordering & slicing** — `sort` · `sortDesc` · `sortBy` · `sortByDesc` ·
`reverse` · `shuffle` · `slice` · `take` · `takeWhile` · `takeUntil` · `skip` ·
`skipWhile` · `skipUntil` · `nth` · `forPage`

**Sets** — `unique` · `duplicates` · `diff` · `intersect` · `merge` · `concat` ·
`zip` · `combine` · `crossJoin`

**Keys** — `pluck` · `keyBy` · `groupBy` · `countBy` · `only` · `except` ·
`keys` · `values` · `flip`

**Aggregation** — `sum` · `avg` / `average` · `min` · `max` · `median` · `mode` ·
`reduce` · `implode` · `join`

**Control flow** — `each` · `eachSpread` · `tap` · `pipe` · `when` · `unless` ·
`whenEmpty` · `whenNotEmpty` · `dump` · `clone`

Collections are iterable, so `for...of` and spreading work as expected.

```ts
collect(products)
  .where("price", ">", 100)
  .sortByDesc("price")
  .take(3)
  .pluck("name")

Collection.times(3, (i) => i * 2).all() // [2, 4, 6]
Collection.range(1, 5).sum()            // 15
```

## Global helpers

```ts
import {
  blank, filled, value, dataGet, dataSet, dataFill, dataForget,
  head, last, tap, transform, withValue, throwIf, throwUnless,
  retry, once, optional, sleep, classBasename, collect, str,
} from "larax"
```

```ts
blank("   ")                              // true — but blank(0) is false
value(() => 42)                           // 42
dataGet(data, "products.*.name")          // wildcard reads
tap(user, (u) => console.log(u.id))       // returns user
throwUnless(user.isAdmin, "Forbidden")
await retry(3, fetchThing, 250)           // 3 attempts, 250ms apart
optional(maybeNull).name                  // undefined, never a TypeError
```

## Migrating from 0.2.x

Two helpers gained Laravel's positional signatures. **The old object-argument
form still works**, so existing code keeps running:

```ts
Num.clamp({ num: 5, min: 1, max: 3 }) // still supported
Num.clamp(5, 1, 3)                    // preferred

Obj.get({ obj: data, path: "a.b", daf: "x" }) // still supported
Obj.get(data, "a.b", "x")                     // preferred
```

Two behaviour changes are worth knowing about:

- **`Str.contains` now matches substrings**, as Laravel does. It previously
  split the subject on spaces and compared whole words, so
  `Str.contains("This is my name", "nam")` returned `false`; it now returns
  `true`.
- **`Obj.get` no longer returns the fallback for falsy stored values.**
  `Obj.get({ count: 0 }, "count", 99)` previously returned `99` and now
  correctly returns `0`.

## Configuration

Larax needs no configuration. Import the helpers you need and go — the build is
side-effect free, so bundlers tree-shake anything you don't use.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`feature/my-feature`).
3. Run the checks: `pnpm typecheck && pnpm test && pnpm build`.
4. Add a changeset describing your change: `pnpm changeset`.
5. Commit your changes (`git commit -m 'Add some feature'`).
6. Push to the branch (`git push origin feature/my-feature`).
7. Create a Pull Request.

CI runs the same three checks on Node 22 and 24. Releases are automated: merging
a changeset to `master` opens a "Version Packages" PR, and merging that PR
publishes to npm.

Development requires Node 22.11+ (a floor set by `@changesets/cli` 3) and
pnpm 11, which is pinned via `packageManager`.

## License

This project is licensed under the MIT License.

## Author

Developed by [Abbas Roholamin](https://github.com/abbas-roholamin).

---

⭐ **Star the repository if you find it useful!**

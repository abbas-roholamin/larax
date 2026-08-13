---
"larax": minor
---

Port the Laravel helper surface to JavaScript, and fix packaging.

**New helpers**

- `Str` — ~70 methods covering slicing, searching, casing, replacement,
  padding, truncation, inflection, validation and ID generation
  (`uuid`, `uuid7`, `ulid`).
- `Stringable` / `str()` — a fluent, immutable chaining wrapper around `Str`.
- `Arr` — ~55 methods including `get`/`set`/`forget` with dot notation, `dot`,
  `undot`, `pluck`, `keyBy`, `groupBy`, `crossJoin`, `toCssClasses` and `query`.
- `Obj` — Laravel's `data_*` helpers with `*` wildcard support, plus `merge`,
  `mapKeys`, `freeze` and friends.
- `Num` — `Intl`-backed `format`, `currency`, `percentage`, `fileSize`,
  `abbreviate`, `forHumans`, `spell` and `ordinal`.
- `Collection` / `collect()` — a chainable, iterable collection with ~90 methods.
- Global helpers — `value`, `blank`, `filled`, `dataGet`, `dataSet`, `tap`,
  `transform`, `throwIf`, `retry`, `once`, `optional` and more.

**Bug fixes**

- `package.json` pointed `main` at the ESM bundle and `module` at
  `dist/index.mjs`, which tsup never emits. `require("larax")` failed outright.
  Added a proper `exports` map with separate ESM/CJS types.
- `Obj.get` used `||` to apply its default, so stored `0`, `""` and `false`
  values were replaced by the fallback.
- `Str.contains` split the subject on spaces and compared whole words instead
  of matching substrings the way Laravel does.
- Shipped declarations were stale, describing only the four original helpers.
- Added `files`, `sideEffects` and `engines`; the tarball no longer carries
  `src`, `test` and `coverage`.

**Housekeeping**

- Dependencies updated: changesets 3, vitest 4, `@vitest/coverage-v8` 4,
  tsup 8.5. TypeScript stays on 5.9 because tsup's declaration step
  (`rollup-plugin-dts`) is not compatible with the TypeScript 7 compiler API.
- Removed the duplicate `package-lock.json`; pnpm is the sole lockfile.
- Added a `LICENSE` file and corrected the author's email address.
- Changesets `baseBranch` now matches the repository's `master` branch, and
  `access` matches `publishConfig`.

**CI/CD**

- Added a `CI` workflow (typecheck, test and build on Node 22 and 24, plus a
  coverage job that uploads its report as an artifact).
- Added a `Release` workflow using `changesets/action@v2`: pending changesets
  open a "Version Packages" PR, and merging it publishes to npm via trusted
  publishing (OIDC, no `NPM_TOKEN`).
- Pinned `packageManager` to `pnpm@11.21.0`, which is the minimum pnpm that
  understands OIDC when `changeset publish` delegates to `pnpm publish`.
- Added `pnpm-workspace.yaml` with `allowBuilds: { esbuild: true }`. pnpm 11
  exits 1 on unapproved postinstall scripts, so without it every CI run would
  fail at `pnpm install --frozen-lockfile`.
- Renamed `test` to run once (`vitest run`) so CI cannot hang in watch mode; the
  watcher moved to `test:watch`. Added a `typecheck` script alongside `lint`.

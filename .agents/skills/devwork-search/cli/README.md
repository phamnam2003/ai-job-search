# devwork-cli

Zero-dependency CLI for searching jobs on [Devwork](https://devwork.vn), a
Hanoi-based IT recruitment / referral network. Reads the site's public,
server-rendered pages — no authentication, no API key, no headless browser.

## Install

```bash
cd .agents/skills/devwork-search/cli && bun install
```

`bun install` only pulls dev types. There are no runtime dependencies.

## Usage

```bash
bun run src/cli.ts search -q "golang" --format table
bun run src/cli.ts search -q "nodejs" -l "ha noi" --format json
bun run src/cli.ts detail 13758 --format plain
bun run src/cli.ts tags
bun run src/cli.ts --help
```

`-q` takes a **fixed technology tag**, not free text — run `tags` for the list.

See `../SKILL.md` for the full flag reference and `../url-reference.md` for the
endpoint and parsing anchors.

## Tests

```bash
bun run test        # live smoke tests against devwork.vn
bun run typecheck
```

The suite asserts that search returns populated `id`/`title`/`url`, that salary
bands and skills are actually parsed (the portal's main value), that `--location`
folds diacritics, that `detail` yields decoded text with the real pay band rather
than the login-gated referral bonus, and that bad flags exit 1 with a JSON error
on stderr.

## Design notes

- **Tag-based browse.** Devwork has no free-text search worth relying on; `-q` maps
  to a technology slug path. `KNOWN_TAGS` in `src/helpers.ts` is the curated list.
- **Client-side location filter.** The portal exposes no location parameter, so
  `-l` is a diacritic-folded substring match over the card's location text.
- **Chunked card parsing.** `parseJobCards` splits on the job anchor and parses
  each listing independently.
- **Two detail traps handled:** the salary parser anchors on the `Mức lương`
  heading (the first `salary-amount` div is a login-gated referral bonus), and the
  skills parser is scoped to the block before the description heading (otherwise
  it picks up the site-wide search suggestions). Both are documented in
  `../url-reference.md`.
- **No `--jobage`.** Devwork exposes no posting date, so the flag is omitted rather
  than implemented against data that does not exist.

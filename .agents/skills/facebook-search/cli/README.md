# facebook-cli

Zero-network CLI for the `facebook-search` skill. It **never contacts Facebook**.
It builds Facebook browse URLs (`links`) and parses recruitment posts you paste
into `../inbox/` (`search`/`detail`/`parse`). Runs on `bun` with zero runtime
dependencies (dev-only TypeScript types).

## Setup

```bash
bun install   # pulls dev types only
bun run typecheck
bun run test
```

## Commands

```bash
# Build Facebook search links to browse yourself
bun run src/cli.ts links -q "tuyển Golang backend" -l "Hà Nội" --format plain

# Parse posts pasted into ../inbox
bun run src/cli.ts search --format table

# One parsed post
bun run src/cli.ts detail fb-1234567890123456 --format plain
bun run src/cli.ts parse ../inbox/abctech-backend.txt
```

See `../SKILL.md` for the full workflow and `../url-reference.md` for parsing
anchors. Errors are written to stderr as `{ "error": "...", "code": "..." }` with
exit code 1.

---
name: xrpl-cli
description: AI coding agent guide for the xrpl-cli codebase
---

# AGENTS.md

Instructions for AI coding agents working on the `xrpl-cli` codebase.
For using the CLI as a tool, see [SKILL.md](SKILL.md).

## Project Overview

TypeScript CLI tool for interacting with the XRP Ledger. Wraps
[xrpl.js](https://js.xrpl.org/) with a flat, composable command interface.

## Tech Stack

- **Language**: TypeScript (strict mode, ES2022 target)
- **Runtime**: Node.js >= 20
- **Package manager**: pnpm
- **Module system**: ESM-only (`"type": "module"`)
- **Bundler**: tsup
- **Linter/Formatter**: Biome (tabs, double quotes, semicolons)
- **Test framework**: Vitest
- **CLI framework**: Commander.js
- **Validation**: Zod

## Project Structure

```text
src/
├── index.ts              # Entry point, registers all commands
├── commands/
│   ├── account/          # Account queries and management
│   ├── amm/              # AMM commands
│   ├── channel/          # Payment channel commands
│   ├── check/            # Check commands
│   ├── dex/              # DEX / order book commands
│   ├── escrow/           # Escrow commands
│   ├── ledger/           # Ledger queries, features, subscribe
│   ├── mpt/              # Multi-Purpose Token commands
│   ├── nft/              # NFT commands
│   ├── signing/          # Sign, submit, multisign commands
│   ├── tx/               # Send, trust-set, clawback, build
│   ├── utility/          # Conversion helpers, completions
│   └── wallet/           # Wallet generate, fund, from-seed
└── lib/
    ├── client.ts         # XRPL WebSocket client lifecycle
    ├── config.ts         # Config file + alias resolution
    ├── memo.ts           # Memo parser
    ├── output.ts         # stdout (data) / stderr (info) helpers
    ├── parsing.ts        # Shared input parsing helpers
    ├── schemas.ts        # Zod schemas for input validation
    ├── tokens.ts         # Token notation parser
    ├── tx.ts             # Shared transaction helpers
    ├── types.ts          # GlobalOptions, TxOptions, EXIT_CODES
    ├── validate.ts       # Composable validation helpers
    └── wallet.ts         # Wallet loading from seed/keyfile
test/
├── *.test.ts             # Unit tests
└── e2e/                  # E2E tests (testnet)
docs/
├── cli-reference.md      # Full command reference with all options
├── examples.md           # Real-world workflow examples
└── configuration.md      # Env vars, config file, amendments
```

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Build | `pnpm build` |
| Run from source | `pnpm dev -- <args>` |
| Run unit tests | `pnpm test` |
| Run E2E tests | `pnpm test:e2e` |
| Lint | `pnpm lint` |
| Lint and auto-fix | `pnpm lint:fix` |
| Format | `pnpm format` |
| Lint markdown | `pnpm lint:md` |
| Typecheck | `pnpm exec tsc --noEmit` |
| Full CI suite locally | `pnpm ci` |

## Code Style

- Biome handles all linting and formatting — run `pnpm lint:fix` or `pnpm format`
- Tabs for indentation, double quotes, semicolons always
- ESM imports with `.js` extensions (required for ESM)
- Prefer `type` imports where possible (`import type { ... }`)
- Keep changes minimal — don't refactor surrounding code unless asked

## Key Types

- `GlobalOptions` (`lib/types.ts`) — parsed global CLI flags (`network`, `json`, `quiet`, `yes`, etc.)
- `TxOptions` (`lib/types.ts`) — transaction flags (`prepare`, `signers`, `memo`, `ticket`)
- `EXIT_CODES` (`lib/types.ts`) — exit code constants (0–5)
- `UnsignedTx` (`lib/tx.ts`) — transaction body before signing

## Patterns

### Adding a new command

1. Create a file in the appropriate `src/commands/<category>/` directory
2. Export a `register<Name>(program: Command)` function
3. Import and call it from `src/commands/<category>/index.ts`
4. For query commands: use `withClient()` from `lib/client.ts`
5. For transaction commands: use `submitOrPrepare()` from `lib/tx.ts`
6. Output data with `output()` (stdout), info messages with `info()` (stderr)
7. Add tests in `test/`
8. Update `docs/cli-reference.md` with the new command's options and examples

### Output conventions

- `output(data, opts)` — writes to **stdout** (JSON when `--json`, highlighted otherwise)
- `info(message, opts)` — writes to **stderr** (suppressed by `--quiet`)
- Errors go to **stderr** via `console.error()`
- Never write non-data output to stdout

### Transaction commands

All transaction commands should:

- Use `withTxOptions(cmd)` to add `--prepare`, `--signers`, `--memo`, `--ticket`
- Use `loadWalletForTx()` to load the wallet
- Use `submitOrPrepare()` to handle signing/submitting
- Use `outputResult()` to print the result

### Input validation

- Use Zod schemas from `lib/schemas.ts` for complex validation
- Use `resolve()` from `lib/config.ts` to resolve address aliases
- Use `parseToken()` from `lib/tokens.ts` for token notation

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add new command
fix: handle edge case in token parsing
docs: update CLI reference
refactor: extract shared validation logic
test: add unit tests for memo parser
chore: bump dependencies
```

Commits are validated by commitlint in CI on pull requests.

## Testing

- Unit tests: `test/*.test.ts` — test parsing, validation, formatting logic
- E2E tests: `test/e2e/*.test.ts` — run against testnet, test real transactions
- E2E tests use `fundWallet()` helper that handles faucet rate limits
- Run `pnpm test` before committing; run `pnpm test:e2e` for integration validation

## CI Overview

CI runs on every push to `main` and on pull requests. Jobs run in parallel:

| Job | What it checks |
|-----|----------------|
| `commitlint` | Conventional commit format (PRs only) |
| `lint` | Biome lint + markdown lint |
| `typecheck` | `tsc --noEmit` |
| `test` | Unit tests |
| `build` | tsup build succeeds |
| `e2e` | E2E tests against testnet (after build) |
| `publish` | npm publish with provenance (tag pushes only) |

## Pre-Commit Checklist

1. Run `pnpm lint:fix` to fix TypeScript lint/format issues
2. Run `pnpm lint:md` if any Markdown files were changed
3. Run `pnpm test` to verify unit tests pass
4. Run `pnpm build` to verify the build succeeds
5. If you added or changed a command, update `docs/cli-reference.md`
6. If you added a new command, add it to the README commands table

## Troubleshooting

- **Import errors at runtime**: Make sure all relative imports use `.js` extensions
  (e.g. `import { foo } from "./bar.js"` not `"./bar"`)
- **Biome format conflicts**: Run `pnpm format` — don't manually fix formatting
- **E2E tests flaky**: Testnet can be slow; `fundWallet()` retries with backoff
  but queries right after a transaction may hit stale state
- **`tsc` errors after adding a dependency**: Check that `tsconfig.json` has
  `"moduleResolution": "bundler"` — some packages need this

## Boundaries

### Always

- Run `pnpm lint:fix` after modifying TypeScript files
- Run `pnpm lint:md` after modifying Markdown files
- Use `--json` output in tests for reliable assertions
- Add `.js` extension to all relative imports
- Preserve existing code style — match the surrounding context

### Ask First

- Adding new dependencies
- Changing the public CLI interface (command names, flag names)
- Modifying CI/CD configuration
- Changes that affect multiple command categories

### Never

- Modify `dist/` — it's generated by `pnpm build`
- Commit secrets, seeds, or private keys
- Skip the `--yes` flag in E2E tests (avoids hanging on prompts)
- Write to stdout from non-output code paths
- Remove or rename existing commands without an alias for backwards compatibility

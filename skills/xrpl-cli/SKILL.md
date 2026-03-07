---
name: xrpl-cli
description: CLI tool for querying, transacting, and managing accounts on the XRP Ledger
---

# SKILL.md

Instructions for AI agents that want to **use** `xrpl-cli` as a tool.
For contributing to the codebase, see [AGENTS.md](../../AGENTS.md).

## Overview

`xrpl-cli` (`xrpl`) is a CLI for the XRP Ledger. It wraps xrpl.js and exposes
account queries, transactions, wallet management, and utility commands.

## Quick Reference

```bash
xrpl --help              # List all commands
xrpl <command> --help    # Show options for a command
```

## Required Flags for Agent Use

Always pass these flags when calling `xrpl` programmatically:

- `--json` — structured JSON output to stdout (all non-data goes to stderr)
- `--yes` — skip interactive confirmation prompts
- `--quiet` — suppress informational stderr messages

Example:

```bash
xrpl --json --yes --quiet balance rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY
```

## Output Conventions

- **stdout**: JSON data only (when `--json` is passed)
- **stderr**: errors, warnings, informational messages (plain text, not JSON)
- Errors are **not** structured JSON — use the exit code to determine failure type
- Agents should parse stdout on exit code 0; read stderr for diagnostics on failure

## Exit Codes

| Code | Meaning | Agent Action |
|------|---------|--------------|
| 0 | Success | Parse stdout |
| 1 | General error | Read stderr for details |
| 2 | Invalid arguments | Fix the command syntax |
| 3 | Network / connection error | Retry or check `--rpc-url` |
| 4 | Transaction rejected (`tec*`) | Read result code in JSON output |
| 5 | Transaction expired | Retry (the `LastLedgerSequence` was passed) |

## Network Selection

```bash
--network mainnet    # default, real funds
--network testnet    # test network, free faucet
--network devnet     # dev network, experimental amendments
--rpc-url <url>      # custom WebSocket endpoint
```

For testing, always use `--network testnet` or `--network devnet`.

## Wallet / Signing

Transactions require a wallet. Provide one of:

```bash
--seed <seed>              # Direct seed (e.g. sEdV...)
--from <name>              # Named wallet from keystore
--keyfile <path>           # JSON file containing seed
--mnemonic "<words>"       # BIP39 mnemonic phrase
```

Or set environment variables: `XRPL_SEED`, `XRPL_FROM`, `XRPL_KEYFILE`.

## Token Notation

Tokens are specified as:

| Format | Meaning |
|--------|---------|
| `XRP` | Native XRP |
| `USD.rIssuerAddress` | IOU (currency.issuer) |
| `mpt:00064D1C...` | Multi-Purpose Token by ID |

Used with `--token` in commands like `send`, `balance`, `offer-create`.

## Common Workflows

### Query an account

```bash
xrpl --json --quiet balance rAddress
xrpl --json --quiet account-info rAddress
xrpl --json --quiet account-lines rAddress
xrpl --json --quiet sequence-number rAddress
```

### Send a payment

```bash
xrpl --json --yes --quiet send \
  --seed "$XRPL_SEED" \
  --to rDestination \
  --amount 10 \
  --token XRP \
  --network testnet
```

### Create a trust line

```bash
xrpl --json --yes --quiet trust-set \
  --seed "$XRPL_SEED" \
  USD rIssuer --limit 1000 \
  --network testnet
```

### Inspect a transaction

```bash
xrpl --json --quiet tx <hash>
```

### Generate and fund a wallet (testnet)

```bash
xrpl --json --quiet wallet generate
xrpl --json --quiet wallet fund --network testnet
```

### Build without submitting (dry run)

Any transaction command supports `--prepare` to output unsigned JSON
without submitting:

```bash
xrpl --json --quiet send \
  --to rDest --amount 5 --token XRP --prepare
```

### Escape hatches

For any transaction type not covered by a dedicated command:

```bash
xrpl --json --yes --quiet build <TransactionType> --Field value
```

For any API method not covered:

```bash
xrpl --json --quiet rpc <method> '{"param": "value"}'
```

## Command Categories

Run `xrpl --help` for the full list. Key categories:

- **Account queries**: `balance`, `account-info`, `account-objects`, `account-lines`, `account-tx`, `sequence-number`
- **Ledger**: `ledger`, `ledger-index`, `fee`, `server-info`, `feature`
- **Transactions**: `send`, `trust-set`, `offer-create`, `escrow-create`, `nft-mint`, `clawback`
- **Token management**: `mpt-create`, `mpt-authorize`, `mpt-set`, `mpt-destroy`
- **DEX**: `offer-create`, `offer-cancel`, `book-offers`, `path-find`
- **AMM**: `amm-create`, `amm-deposit`, `amm-withdraw`, `amm-info`
- **Wallet**: `wallet generate`, `wallet fund`, `wallet from-seed`, `wallet import`
- **Utility**: `to-hex`, `from-hex`, `hash`, `decode-tx`, `encode-tx`, `rpc`
- **Multi-signing**: `multisign`, `multisign-combine`, `multisign-submit`

## Limiting Output Size

Many list commands support `--limit <n>` to cap results and avoid large responses:

```bash
xrpl --json --quiet account-tx rAddress --limit 5
xrpl --json --quiet account-objects rAddress --limit 10
xrpl --json --quiet book-offers XRP USD.rIssuer --limit 3
```

Commands with `--limit`: `account-tx`, `account-objects`, `account-lines`,
`account-offers`, `account-channels`, `account-nfts`, `book-offers`,
`ledger-data`, `nft-buy-offers`, `nft-sell-offers`, `noripple-check`.

## Offline Commands (No Network Required)

These commands run instantly without connecting to a node:

- `wallet generate`, `wallet from-seed`, `wallet from-entropy`, `wallet vanity`
- `wallet sign-message`, `wallet verify-message`
- `wallet import`, `wallet list`, `wallet remove`
- `xrp-to-drops`, `drops-to-xrp`, `ripple-time`
- `to-hex`, `from-hex`, `hash`
- `address-info`, `decode-tx`, `encode-tx`
- `sign`, `multisign`, `multisign-combine`
- `completions`

All other commands require a network connection and are slower.

## Rules

- **Always** use `--json --yes --quiet` for programmatic access
- **Always** use `--network testnet` or `--network devnet` for testing — never mainnet
- **Always** check the exit code before parsing stdout
- **Never** hardcode seeds or secrets in commands; use environment variables
- **Never** submit transactions to mainnet without explicit user approval
- **Prefer** `--prepare` to inspect transactions before submitting

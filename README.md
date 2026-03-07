# xrpl-cli

[![Version][version-badge]][version-link]
[![npm][npm-badge]][npm-link]
[![CI][ci-badge]][ci-link]
[![License][license-badge]][license-link]

A Swiss Army knife for interacting with the XRP Ledger from the command line.

`xrpl-cli` wraps [xrpl.js](https://js.xrpl.org/) and exposes the full breadth of XRPL functionality through a flat, composable command interface — inspired by Foundry's [`cast`](https://www.getfoundry.sh/reference/cast/cast) for EVM chains.

> [!IMPORTANT]
> This project was vibe-coded and has **not** been audited. It is under active development — expect breaking changes. Use at your own risk, especially when signing transactions or handling seeds/keys. Always verify transactions before submitting to mainnet.

## Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Exit Codes](#exit-codes)
- [Development](#development)
- [Docs](#docs)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

## Install

```bash
npm install -g @commonprefix/xrpl-cli
```

Requires Node.js v20+.

## Quick Start

```bash
# Check an account's XRP balance
xrpl balance rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY

# Get current ledger index
xrpl ledger-index

# Look up a transaction
xrpl tx 9B2D2B0E8E3E24C2D07B714A38B8E547B3C5B05D8E3B0E5E6E8F3B8C5D7E9F1A

# Send 10 XRP
xrpl send --to rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe --amount 10 --token XRP

# Generate a new wallet
xrpl wallet generate

# Generate a vanity address
xrpl wallet vanity --starts-with Nick

# Watch ledger events in real time
xrpl subscribe --streams ledger
```

## Commands

| Command | Description |
|---------|-------------|
| `balance` | Get XRP or token balance for an account |
| `account-info` | Get full account info (sequence, flags, balance, etc.) |
| `account-objects` | Get objects owned by an account (offers, trust lines, escrows, etc.) |
| `account-lines` | Get trust lines for an account |
| `account-tx` | Get transaction history for an account |
| `nonce` | Get the current sequence number |
| `ledger` | Get ledger info |
| `ledger-index` | Get latest validated ledger index |
| `fee` | Get current transaction fee |
| `server-info` | Get server status |
| `feature` | List protocol amendments and their status |
| `tx` | Look up a transaction by hash |
| `send` | Send a payment (XRP, IOU, or MPT) |
| `trust-set` | Create or modify a trust line |
| `offer-create` | Create a DEX offer |
| `book-offers` | Get the order book for a currency pair |
| `mpt-create` | Create a Multi-Purpose Token issuance |
| `amm-create` | Create an AMM for a token pair |
| `escrow-create` | Create a time/condition-based escrow |
| `nft-mint` | Mint an NFT |
| `clawback` | Claw back tokens from a holder |
| `account-set` | Modify account properties |
| `signer-list-set` | Set up multi-signing |
| `multisign` | Sign a transaction for multi-signing |
| `wallet generate` | Generate a new random keypair |
| `wallet vanity` | Generate a vanity address |
| `wallet fund` | Fund a wallet via testnet/devnet faucet |
| `wallet import` | Import a wallet into encrypted keystore |
| `wallet sign-message` | Sign an arbitrary message |
| `sign` | Sign a transaction without submitting |
| `build` | Build any transaction type (escape hatch) |
| `rpc` | Send a raw API request (escape hatch) |
| `subscribe` | Subscribe to ledger events |
| ... | [Full command reference →](docs/cli-reference.md) |

Global options: `--network` (`-n`), `--rpc-url`, `--json`, `--quiet` (`-q`), `--yes` (`-y`)

Wallet options (for signing): `--seed` (`-s`), `--from` (`-f`), `--keyfile`, `--mnemonic`, `--interactive` (`-i`)

Full command reference with all options and flags: **[docs/cli-reference.md](docs/cli-reference.md)**

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments / usage error |
| `3` | Network / connection error |
| `4` | Transaction rejected |
| `5` | Transaction expired |

## Requirements

- Node.js >= 20

## Development

```bash
pnpm install             # Install dependencies
pnpm build               # Build with tsup
pnpm dev -- <args>       # Run from source via tsx
pnpm test                # Run unit tests
pnpm test:e2e            # Run E2E tests against testnet
pnpm lint                # Check with Biome
pnpm format              # Format with Biome
```

## Docs

| Document | Description |
|----------|-------------|
| [CLI Reference](docs/cli-reference.md) | Full command reference with all options and flags |
| [Examples](docs/examples.md) | Real-world usage examples for every workflow |
| [Configuration](docs/configuration.md) | Environment variables, config file, shell completions, amendments |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, project structure, and code style.

## Releasing

Releases are tag-triggered. Pushing a semver tag runs all CI checks, publishes to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements), and creates a GitHub release with auto-generated notes.

```bash
# 1. Bump version
pnpm version patch   # or minor / major

# 2. Push commit and tag
git push --follow-tags
```

## Roadmap

Features worth exploring later:

- **`watch` mode** — poll a command at an interval and stream changes
- **Ledger hardware wallet signing** — sign transactions using a connected Ledger device
- **`--private-key` option** — accept a raw hex private key directly for signing
- **Niche developer utilities** — RFC1751 mnemonic encode/decode, seed encoding/decoding, raw keypair derivation, etc.
- **AI agent compatibility** — MCP server, Agent Skills (`SKILL.md`), and agent-facing documentation

## License

MIT

## Disclaimer

> [!CAUTION]
> This is an independent, community-built tool. It is **not** officially supported, endorsed, or maintained by Ripple, the XRP Ledger Foundation (XRPLF), or any affiliated organization. Use at your own risk.

[version-badge]: https://img.shields.io/github/package-json/v/commonprefix/xrpl-cli
[version-link]: https://github.com/commonprefix/xrpl-cli/releases
[npm-badge]: https://img.shields.io/npm/v/@commonprefix/xrpl-cli?color=red
[npm-link]: https://www.npmjs.com/package/@commonprefix/xrpl-cli
[ci-badge]: https://github.com/commonprefix/xrpl-cli/actions/workflows/ci.yml/badge.svg
[ci-link]: https://github.com/commonprefix/xrpl-cli/actions/workflows/ci.yml
[license-badge]: https://img.shields.io/github/license/commonprefix/xrpl-cli
[license-link]: https://github.com/commonprefix/xrpl-cli/blob/main/LICENSE

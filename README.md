# xrpl-cli

[![Version][version-badge]][version-link]
[![npm][npm-badge]][npm-link]
[![CI][ci-badge]][ci-link]
[![License][license-badge]][license-link]

A Swiss Army knife for interacting with the XRP Ledger from the command line. Built for both humans and [AI agents](skills/xrpl-cli/SKILL.md).

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
- [AI Agents](#ai-agents)
- [Roadmap](#roadmap)
- [License](#license)

## Install

```bash
npm install -g @commonprefix/xrpl-cli
```

Or run directly without installing:

```bash
npx @commonprefix/xrpl-cli --help
```

Requires Node.js v20+.

## Quick Start

```bash
# Check an account's XRP balance
xrpl balance ra5nK24KXen9AHvsdFTKHSANinZseWnPcX

# Get current ledger index
xrpl ledger-index

# Look up a transaction
xrpl tx 9B2D2B0E8E3E24C2D07B714A38B8E547B3C5B05D8E3B0E5E6E8F3B8C5D7E9F1A

# Send 10 XRP
xrpl send --to ra5nK24KXen9AHvsdFTKHSANinZseWnPcX --amount 10 --token XRP

# Generate a new wallet
xrpl wallet generate

# Generate a vanity address
xrpl wallet vanity --starts-with Nick

# Watch ledger events in real time
xrpl subscribe --streams ledger
```

## Commands

Global options: `--network` (`-n`), `--rpc-url`, `--json`, `--quiet` (`-q`), `--yes` (`-y`)

Wallet options (for signing): `--seed` (`-s`), `--from` (`-f`), `--keyfile`, `--mnemonic`, `--interactive` (`-i`)

Full command reference with all options and flags: **[docs/cli-reference.md](docs/cli-reference.md)**

### Account Query

| Command | Description |
|---------|-------------|
| [`balance`](docs/cli-reference.md#balance) | Get XRP or token balance for an account |
| [`account-info`](docs/cli-reference.md#account-info-alias-info) | Get full account info (sequence, flags, balance, etc.) |
| [`account-objects`](docs/cli-reference.md#account-objects-alias-objects) | Get objects owned by an account (offers, trust lines, escrows, etc.) |
| [`account-lines`](docs/cli-reference.md#account-lines-alias-lines) | Get trust lines for an account |
| [`account-channels`](docs/cli-reference.md#account-channels-alias-channels) | Get payment channels for an account |
| [`account-currencies`](docs/cli-reference.md#account-currencies-alias-currencies) | Get currencies an account can send or receive |
| [`account-nfts`](docs/cli-reference.md#account-nfts-alias-nfts) | Get NFTs owned by an account |
| [`account-offers`](docs/cli-reference.md#account-offers-alias-offers) | Get open DEX offers for an account |
| [`account-tx`](docs/cli-reference.md#account-tx) | Get transaction history for an account |
| [`gateway-balances`](docs/cli-reference.md#gateway-balances) | Get total issued token balances |
| [`noripple-check`](docs/cli-reference.md#noripple-check) | Check account rippling settings |
| [`sequence-number`](docs/cli-reference.md#sequence-number-alias-nonce) | Get the current sequence number |

### Ledger

| Command | Description |
|---------|-------------|
| [`ledger`](docs/cli-reference.md#ledger) | Get ledger info |
| [`ledger-index`](docs/cli-reference.md#ledger-index) | Get latest validated ledger index |
| [`ledger-data`](docs/cli-reference.md#ledger-data) | Get raw ledger contents |
| [`ledger-entry`](docs/cli-reference.md#ledger-entry) | Get a single ledger entry by index |
| [`fee`](docs/cli-reference.md#fee) | Get current transaction fee |
| [`server-info`](docs/cli-reference.md#server-info) | Get server status |
| [`server-state`](docs/cli-reference.md#server-state) | Get machine-readable server status |
| [`feature`](docs/cli-reference.md#feature-alias-amendment) | List protocol amendments and their status |

### Transactions

| Command | Description |
|---------|-------------|
| [`tx`](docs/cli-reference.md#tx) | Look up a transaction by hash |
| [`send`](docs/cli-reference.md#send-aliases-pay-payment) | Send a payment (XRP, IOU, or MPT) |
| [`submit`](docs/cli-reference.md#submit) | Submit a raw signed transaction blob |
| [`sign`](docs/cli-reference.md#sign) | Sign a transaction without submitting |
| [`build`](docs/cli-reference.md#build) | Build any transaction type (escape hatch) |

### Trust Lines & Tokens

| Command | Description |
|---------|-------------|
| [`trust-set`](docs/cli-reference.md#trust-set) | Create or modify a trust line |
| [`mpt-create`](docs/cli-reference.md#mpt-create) | Create a Multi-Purpose Token issuance |
| [`mpt-authorize`](docs/cli-reference.md#mpt-authorize) | Authorize an account for an MPT |
| [`mpt-set`](docs/cli-reference.md#mpt-set) | Lock/unlock an MPT issuance or holder |
| [`mpt-destroy`](docs/cli-reference.md#mpt-destroy) | Destroy an MPT issuance |
| [`clawback`](docs/cli-reference.md#clawback) | Claw back tokens from a holder |

### Account Configuration

| Command | Description |
|---------|-------------|
| [`account-set`](docs/cli-reference.md#account-set) | Modify account properties |
| [`account-delete`](docs/cli-reference.md#account-delete) | Delete an account |
| [`set-regular-key`](docs/cli-reference.md#set-regular-key) | Set or remove a regular key |
| [`deposit-preauth`](docs/cli-reference.md#deposit-preauth) | Preauthorize an account for deposits |
| [`signer-list-set`](docs/cli-reference.md#signer-list-set) | Set up multi-signing |
| [`signer-list-delete`](docs/cli-reference.md#signer-list-delete) | Remove the signer list |
| [`delegate-set`](docs/cli-reference.md#delegate-set) | Grant transaction delegation |

### Tickets

| Command | Description |
|---------|-------------|
| [`ticket-create`](docs/cli-reference.md#ticket-create) | Create tickets for later use |
| [`tickets`](docs/cli-reference.md#tickets) | List available tickets for an account |

### DEX

| Command | Description |
|---------|-------------|
| [`offer-create`](docs/cli-reference.md#offer-create-alias-offer) | Create a DEX offer |
| [`offer-cancel`](docs/cli-reference.md#offer-cancel) | Cancel a DEX offer |
| [`book-offers`](docs/cli-reference.md#book-offers-alias-order-book) | Get the order book for a currency pair |
| [`deposit-authorized`](docs/cli-reference.md#deposit-authorized) | Check deposit authorization between accounts |
| [`path-find`](docs/cli-reference.md#path-find-alias-paths) | Find a payment path between accounts |

### AMM

| Command | Description |
|---------|-------------|
| [`amm-info`](docs/cli-reference.md#amm-info) | Get info about an AMM instance |
| [`amm-create`](docs/cli-reference.md#amm-create) | Create an AMM for a token pair |
| [`amm-deposit`](docs/cli-reference.md#amm-deposit) | Deposit funds into an AMM |
| [`amm-withdraw`](docs/cli-reference.md#amm-withdraw) | Withdraw funds from an AMM |
| [`amm-vote`](docs/cli-reference.md#amm-vote) | Vote on AMM trading fee |
| [`amm-bid`](docs/cli-reference.md#amm-bid) | Bid on AMM auction slot |

### Checks

| Command | Description |
|---------|-------------|
| [`check-create`](docs/cli-reference.md#check-create) | Create a check |
| [`check-cash`](docs/cli-reference.md#check-cash) | Redeem a check |
| [`check-cancel`](docs/cli-reference.md#check-cancel) | Cancel a check |

### Escrow

| Command | Description |
|---------|-------------|
| [`escrow-create`](docs/cli-reference.md#escrow-create) | Create a time/condition-based escrow |
| [`escrow-finish`](docs/cli-reference.md#escrow-finish) | Complete an escrow |
| [`escrow-cancel`](docs/cli-reference.md#escrow-cancel) | Cancel an expired escrow |

### Payment Channels

| Command | Description |
|---------|-------------|
| [`channel-create`](docs/cli-reference.md#channel-create) | Create a payment channel |
| [`channel-fund`](docs/cli-reference.md#channel-fund) | Fund a payment channel |
| [`channel-claim`](docs/cli-reference.md#channel-claim) | Claim from a payment channel |
| [`channel-verify`](docs/cli-reference.md#channel-verify) | Verify a channel claim signature |

### NFTs

| Command | Description |
|---------|-------------|
| [`nft-mint`](docs/cli-reference.md#nft-mint) | Mint an NFT |
| [`nft-burn`](docs/cli-reference.md#nft-burn) | Burn an NFT |
| [`nft-offer-create`](docs/cli-reference.md#nft-offer-create) | Create an offer to buy or sell an NFT |
| [`nft-offer-accept`](docs/cli-reference.md#nft-offer-accept) | Accept an NFT offer |
| [`nft-offer-cancel`](docs/cli-reference.md#nft-offer-cancel) | Cancel an NFT offer |
| [`nft-buy-offers`](docs/cli-reference.md#nft-buy-offers) | Get buy offers for an NFT |
| [`nft-sell-offers`](docs/cli-reference.md#nft-sell-offers) | Get sell offers for an NFT |

### Multi-Signing

| Command | Description |
|---------|-------------|
| [`multisign`](docs/cli-reference.md#multisign) | Sign a transaction for multi-signing |
| [`multisign-combine`](docs/cli-reference.md#multisign-combine) | Combine multi-signed transactions |
| [`multisign-submit`](docs/cli-reference.md#multisign-submit) | Combine and submit multi-signed transactions |

### Wallet

| Command | Description |
|---------|-------------|
| [`wallet generate`](docs/cli-reference.md#wallet-generate) | Generate a new random keypair |
| [`wallet from-seed`](docs/cli-reference.md#wallet-from-seed) | Derive wallet from an existing seed |
| [`wallet from-entropy`](docs/cli-reference.md#wallet-from-entropy) | Derive wallet from raw entropy |
| [`wallet vanity`](docs/cli-reference.md#wallet-vanity) | Generate a vanity address |
| [`wallet fund`](docs/cli-reference.md#wallet-fund-alias-wallet-faucet) | Fund a wallet via testnet/devnet faucet |
| [`wallet sign-message`](docs/cli-reference.md#wallet-sign-message) | Sign an arbitrary message |
| [`wallet verify-message`](docs/cli-reference.md#wallet-verify-message) | Verify a signed message |
| [`wallet import`](docs/cli-reference.md#wallet-import) | Import a wallet into encrypted keystore |
| [`wallet list`](docs/cli-reference.md#wallet-list-alias-wallet-ls) | List keystore wallets |
| [`wallet remove`](docs/cli-reference.md#wallet-remove-alias-wallet-rm) | Remove a wallet from keystore |

### Conversion

| Command | Description |
|---------|-------------|
| [`xrp-to-drops`](docs/cli-reference.md#xrp-to-drops) | Convert XRP to drops |
| [`drops-to-xrp`](docs/cli-reference.md#drops-to-xrp) | Convert drops to XRP |
| [`ripple-time`](docs/cli-reference.md#ripple-time) | Convert between XRPL epoch and ISO 8601 |

### Utility

| Command | Description |
|---------|-------------|
| [`address-info`](docs/cli-reference.md#address-info) | Validate and decode an XRPL address |
| [`to-hex`](docs/cli-reference.md#to-hex) | Convert UTF-8 string to hex |
| [`from-hex`](docs/cli-reference.md#from-hex) | Convert hex to UTF-8 string |
| [`hash`](docs/cli-reference.md#hash) | Hash data with XRPL-relevant algorithms |
| [`decode-tx`](docs/cli-reference.md#decode-tx) | Decode a transaction blob to JSON |
| [`encode-tx`](docs/cli-reference.md#encode-tx) | Encode transaction JSON to binary |
| [`rpc`](docs/cli-reference.md#rpc) | Send a raw API request (escape hatch) |
| [`subscribe`](docs/cli-reference.md#subscribe) | Subscribe to ledger events |
| [`ping`](docs/cli-reference.md#ping) | Confirm server connectivity |
| [`completions`](docs/cli-reference.md#completions) | Generate shell completion scripts |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments / usage error |
| `3` | Network / connection error |
| `4` | Transaction rejected |
| `5` | Transaction expired |

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

## Shell Completions

```bash
xrpl completions bash > ~/.local/share/bash-completion/completions/xrpl
xrpl completions zsh > ~/.zfunc/_xrpl
xrpl completions fish > ~/.config/fish/completions/xrpl.fish
```

## Docs

| Document | Description |
|----------|-------------|
| [CLI Reference](docs/cli-reference.md) | Full command reference with all options and flags |
| [Examples](docs/examples.md) | Real-world usage examples for every workflow |
| [Configuration](docs/configuration.md) | Environment variables, config file, shell completions, amendments |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, project structure, and code style.

## AI Agents

`xrpl-cli` is designed for AI agent use — structured JSON output (`--json`), non-interactive mode (`--yes --quiet`), and meaningful exit codes.

Install the agent skill:

```bash
npx skills add commonprefix/xrpl-cli
```

| File | Description |
|------|-------------|
| [SKILL.md](skills/xrpl-cli/SKILL.md) | Agent skill — how to use `xrpl-cli` as a tool |
| [AGENTS.md](AGENTS.md) | Coding agent guide — how to work on the codebase |

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

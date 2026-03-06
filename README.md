# xrpl-cli

A Swiss Army knife for interacting with the XRP Ledger from the command line.

```bash
xrpl --help
```

`xrpl-cli` is a CLI tool for querying, transacting, and managing accounts on the XRP Ledger. It wraps [xrpl.js](https://js.xrpl.org/) and exposes the full breadth of XRPL functionality through a flat, composable command interface — inspired by Foundry's [`cast`](https://www.getfoundry.sh/reference/cast/cast) for EVM chains.

> [!IMPORTANT]
> This project was vibe-coded and has **not** been audited. It is under active development — expect breaking changes. Use at your own risk, especially when signing transactions or handling seeds/keys. Always verify transactions before submitting to mainnet.

## Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Quick Start](#quick-start)
  - [Global Options](#global-options)
  - [Token Notation](#token-notation)
- [Commands](#commands)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Configuration File](#configuration-file)
  - [Exit Codes](#exit-codes)
  - [Shell Completions](#shell-completions)
- [Amendments](#amendments)
- [Protocol Coverage](#protocol-coverage)
- [Examples](#examples)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Building](#building)
  - [Testing](#testing)
  - [Project Structure](#project-structure)
  - [Code Style](#code-style)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

## Installation

```bash
npm install -g xrpl-cli
```

Requires Node.js v20+.

## Usage

### Quick Start

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
```

### Global Options

These options apply to all commands that interact with the network:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--network` | `string` | `mainnet` | Network to connect to: `mainnet`, `testnet`, `devnet` |
| `--rpc-url` | `string` | — | Custom WebSocket RPC URL (overrides `--network`) |
| `--seed` | `string` | — | Wallet seed for signing (or set `XRPL_SEED` env var) |
| `--keyfile` | `string` | — | Path to a JSON keyfile containing the seed |
| `--json` | `boolean` | `false` | Output as JSON |
| `--quiet` | `boolean` | `false` | Suppress non-essential output |
| `--yes`, `-y` | `boolean` | `false` | Skip confirmation prompts |

#### RPC URL

`--rpc-url` accepts a WebSocket URL (`wss://` or `ws://`). xrpl.js uses WebSocket for all communication with `rippled` servers.

When `--rpc-url` is not specified, the default RPC URL is determined by `--network`:

| Network   | Default RPC URL                                  |
|-----------|--------------------------------------------------|
| `mainnet` | `wss://xrplcluster.com`                          |
| `testnet` | `wss://s.altnet.rippletest.net:51233`             |
| `devnet`  | `wss://s.devnet.rippletest.net:51233`             |

### Token Notation

The XRPL has three kinds of fungible tokens: native XRP, IOU trust line tokens, and Multi-Purpose Tokens (MPTs). Throughout `xrpl`, tokens are specified using a unified `--token` flag with the following notation:

| Kind | Notation                              | Example                                              |
|------|---------------------------------------|------------------------------------------------------|
| XRP  | `XRP`                                 | `--token XRP`                                        |
| IOU  | `<currency>.<issuer>`                 | `--token USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B`     |
| IOU  | `<name>.<issuer>` (non-standard)      | `--token NONST.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B`   |
| IOU  | `<hex>.<issuer>` (raw hex)            | `--token 0158415500000000C1F76FF6ECB0BAC600000000.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B` |
| MPT  | `mpt:<issuance-id>`                   | `--token mpt:00064D1C63CEBEB49FC20032206CE0F203138BFC59F1AC578` |

- **XRP**: amounts are specified in XRP (not drops) — the CLI converts internally.
- **IOU**: currency codes can be specified as:
  - Standard 3-character codes (e.g. `USD`, `EUR`, `BTC`)
  - Non-standard ASCII names up to 20 characters (e.g. `NONST`, `MyToken`) — automatically hex-encoded and right-padded to 40 characters
  - Raw 40-character hex codes for full control
  The issuer is always an r-address.
- **MPT**: Multi-Purpose Tokens are identified by their 48-character hex issuance ID. The `mpt:` prefix distinguishes them from IOUs.

For commands that only accept XRP (e.g. `escrow-create`), the `--token` flag is not needed.

## Commands

### Account Query Commands

Commands for reading account state. These correspond to the rippled [account methods](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods).

#### `balance`

Get the balance of an account. Returns the XRP balance by default, or a specific token balance with `--token`.

```bash
xrpl balance <account> [--token <token>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Account address or alias |
| `--token` | `token` | `XRP` | Token to query: `XRP`, `<currency>.<issuer>`, or `mpt:<issuance-id>` |

```bash
xrpl balance rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY
# 48.5 XRP

xrpl balance rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY --token USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B
# 1250.00 USD

xrpl balance rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY --token mpt:00064D1C63CEBEB49FC20032206CE0F203138BFC59F1AC578
# 500 mpt:00064D1C...
```

#### `account-info` (alias: `info`)

Get full account info (sequence, flags, balance, owner count, etc.). Wraps [`account_info`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/account_info).

```bash
xrpl account-info <account> [--signer-lists] [--queue] [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Account address or alias |
| `--signer-lists` | `boolean` | `false` | Include the account's `SignerList` objects in the response |
| `--queue` | `boolean` | `false` | Include queued transaction info (only for the current open ledger) |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

#### `account-objects` (alias: `objects`)

Get objects owned by an account (offers, trust lines, escrows, tickets, signer lists, etc.). Wraps [`account_objects`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/account_objects).

```bash
xrpl account-objects <account> [--type <type>] [--limit <n>] [--marker <marker>] [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Account address or alias |
| `--type` | `string` | all | Filter by object type (see below) |
| `--limit` | `number` | server default | Max objects to return (10–400) |
| `--marker` | `string` | — | Pagination marker from a previous response |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

`--type` values: `offer`, `trust_line`, `escrow`, `ticket`, `signer_list`, `payment_channel`, `check`, `deposit_preauth`, `nftoken_offer`, `nftoken_page`, `mptoken`, `mpt_issuance`.

#### `account-lines` (alias: `lines`)

Get trust lines for an account. Wraps [`account_lines`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/account_lines).

```bash
xrpl account-lines <account> [--counterparty <address>] [--limit <n>] [--marker <marker>] [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Account address or alias |
| `--counterparty` | `address` | — | Filter to trust lines with this counterparty (alias: `--peer`). Corresponds to the `peer` field in the rippled API |
| `--limit` | `number` | server default | Max lines to return (10–400) |
| `--marker` | `string` | — | Pagination marker from a previous response |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

#### `account-channels` (alias: `channels`)

Get payment channels where the account is the source. Wraps [`account_channels`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/account_channels).

```bash
xrpl account-channels <account> [--destination <address>] [--limit <n>] [--marker <marker>] [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Source/owner account address or alias |
| `--destination` | `address` | — | Filter to channels with this destination account |
| `--limit` | `number` | `200` | Max channels to return (10–400) |
| `--marker` | `string` | — | Pagination marker from a previous response |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

#### `account-currencies` (alias: `currencies`)

Get a list of currencies an account can send or receive. Wraps [`account_currencies`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/account_currencies).

```bash
xrpl account-currencies <account> [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Account address or alias |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

#### `account-nfts` (alias: `nfts`)

Get NFTs owned by an account. Wraps [`account_nfts`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/account_nfts).

```bash
xrpl account-nfts <account> [--limit <n>] [--marker <marker>] [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Account address or alias |
| `--limit` | `number` | server default | Max NFTs to return (10–400) |
| `--marker` | `string` | — | Pagination marker from a previous response |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

#### `account-offers` (alias: `offers`)

Get open DEX offers for an account. Wraps [`account_offers`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/account_offers).

```bash
xrpl account-offers <account> [--limit <n>] [--marker <marker>] [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Account address or alias |
| `--limit` | `number` | server default | Max offers to return (10–400) |
| `--marker` | `string` | — | Pagination marker from a previous response |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

#### `account-tx`

Get transaction history for an account. Wraps [`account_tx`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/account_tx).

```bash
xrpl account-tx <account> [--limit <n>] [--forward] [--ledger-index-min <n>] [--ledger-index-max <n>] [--marker <marker>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Account address or alias |
| `--limit` | `number` | server default | Max transactions to return |
| `--forward` | `boolean` | `false` | Return results in chronological order (oldest first) |
| `--ledger-index-min` | `number` | `-1` | Earliest ledger to search (`-1` for earliest available) |
| `--ledger-index-max` | `number` | `-1` | Latest ledger to search (`-1` for latest available) |
| `--marker` | `string` | — | Pagination marker from a previous response |

#### `gateway-balances`

Calculate total amounts of tokens issued by an account. Wraps [`gateway_balances`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/gateway_balances).

```bash
xrpl gateway-balances <account> [--hot-wallet <address>...] [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Issuing account address or alias |
| `--hot-wallet` | `address[]` | — | Operational/hot wallet addresses to exclude from obligations. Can be repeated |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

#### `noripple-check`

Get recommended changes to an account's Default Ripple and No Ripple settings. Wraps [`noripple_check`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/noripple_check).

```bash
xrpl noripple-check <account> [--role <gateway|user>] [--transactions] [--limit <n>] [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Account address or alias |
| `--role` | `string` | `"user"` | Account role: `gateway` (issuer) or `user`. Determines which settings are recommended |
| `--transactions` | `boolean` | `false` | Include suggested fix transactions in the response |
| `--limit` | `number` | `300` | Max trust line problems to include |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

#### `nonce`

Get the current sequence number for an account. Derived from `account_info`.

```bash
xrpl nonce <account>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Account address or alias |

### Ledger Commands

Commands for reading ledger state. These correspond to the rippled [ledger methods](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/ledger-methods).

#### `ledger`

Get information about a ledger. Defaults to the latest validated ledger. Wraps [`ledger`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/ledger-methods/ledger).

```bash
xrpl ledger [--index <ledger-index>] [--hash <ledger-hash>] [--transactions] [--expand]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--index` | `string` | `"validated"` | Ledger index, or shortcut: `validated`, `closed`, `current` |
| `--hash` | `string` | — | Look up a specific ledger by its 64-character hex hash |
| `--transactions` | `boolean` | `false` | Include transaction hashes in the response |
| `--expand` | `boolean` | `false` | Expand transactions to full JSON (requires `--transactions`) |

#### `ledger-index`

Get the latest validated ledger index. Takes no options.

#### `ledger-data`

Get raw contents of a ledger version. Wraps [`ledger_data`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/ledger-methods/ledger_data).

```bash
xrpl ledger-data [--ledger-index <index>] [--limit <n>] [--type <type>] [--binary] [--marker <marker>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |
| `--limit` | `number` | server default | Max ledger objects to return |
| `--type` | `string` | — | Filter by ledger entry type (e.g. `account`, `offer`, `ripple_state`, `amm`, `mpt_issuance`) |
| `--binary` | `boolean` | `false` | Return objects as hex strings instead of JSON |
| `--marker` | `string` | — | Pagination marker from a previous response |

#### `ledger-entry`

Get a single ledger entry by its index. Wraps [`ledger_entry`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/ledger-methods/ledger_entry).

```bash
xrpl ledger-entry <index> [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<index>` | `string` | required | 64-character hex ledger entry index |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

#### `fee`

Get the current transaction fee. Outputs the open-ledger fee in drops by default, or the full fee object with `--json`. Wraps [`fee`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/server-info-methods/fee). Takes no options.

#### `server-info`

Get the connected server's status and info. Wraps [`server_info`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/server-info-methods/server_info). Takes no options.

#### `server-state`

Get machine-readable server status. Wraps [`server_state`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/server-info-methods/server_state). Takes no options.

#### `feature` (alias: `amendment`)

List protocol amendments and their status on the connected network. Wraps [`feature`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/server-info-methods/feature).

```bash
xrpl feature [<amendment>] [--enabled] [--pending]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<amendment>` | `string` | — | Amendment name or 64-char hex ID to look up a specific amendment |
| `--enabled` | `boolean` | `false` | Show only enabled amendments |
| `--pending` | `boolean` | `false` | Show only amendments with majority but not yet enabled |

```bash
# List all amendments and their status
xrpl feature

# Check if MPTokensV1 is enabled on this network
xrpl feature MPTokensV1

# Show only enabled amendments
xrpl feature --enabled
```

### Transaction Commands

Commands for building, signing, and submitting transactions.

All transaction commands (`send`, `trust-set`, `offer-create`, `account-set`, `escrow-create`, etc.) accept the following shared flags:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--prepare` | `boolean` | `false` | Output unsigned JSON instead of signing and submitting. Sets `SigningPubKey` to `""` for multi-signing. See Multi-Signing Commands |
| `--signers` | `number` | — | Set fee to `(n+1) * base_fee` for multi-signing. Implies `--prepare` |
| `--memo` | `string` | — | Add a memo as `<type>:<data>`. Can be repeated. Values are UTF-8 strings, hex-encoded automatically. Prefix a value with `hex:` to pass raw hex through as-is |
| `--ticket` | `number` | — | Use a ticket instead of the account's sequence number |

#### `tx`

Get information about a transaction by hash. Wraps [`tx`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/transaction-methods/tx).

```bash
xrpl tx <hash> [--ctid]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<hash>` | `string` | required | 64-character hex transaction hash |
| `--ctid` | `boolean` | `false` | Treat the argument as a Compact Transaction ID instead of a hash |

#### `send` (aliases: `pay`, `payment`)

Sign, submit, and wait for a Payment transaction. Wraps [`Payment`](https://xrpl.org/docs/references/protocol/transactions/types/payment).

```bash
xrpl send --to <destination> --amount <amount> --token <token> [--tag <destination-tag>] [--send-max-amount <amount> --send-max-token <token>] [--deliver-min-amount <amount> --deliver-min-token <token>] [--paths <json>] [--invoice-id <hex>] [--partial] [--no-direct] [--limit-quality] [--memo <memo>...] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--to` | `address` | required | Destination account address or alias |
| `--amount` | `string` | required | Amount to send |
| `--token` | `token` | required | Token to send: `XRP`, `<currency>.<issuer>`, or `mpt:<issuance-id>` |
| `--tag` | `number` | — | Destination tag (for exchanges, hosted wallets, etc.) |
| `--send-max-amount` | `string` | — | Max source amount for cross-currency payments |
| `--send-max-token` | `token` | — | Token for `--send-max-amount` |
| `--deliver-min-amount` | `string` | — | Minimum delivered amount for partial payments (requires `--partial`) |
| `--deliver-min-token` | `token` | — | Token for `--deliver-min-amount` |
| `--paths` | `json` | — | Explicit payment paths as JSON array of path arrays |
| `--invoice-id` | `string` | — | Arbitrary 256-bit (64-char hex) hash for referencing an invoice |
| `--partial` | `boolean` | `false` | Allow partial payments (`tfPartialPayment`) |
| `--no-direct` | `boolean` | `false` | Do not use the default path; only use `--paths` (`tfNoRippleDirect`) |
| `--limit-quality` | `boolean` | `false` | Only take paths where all liquidity has the same quality as the best path (`tfLimitQuality`) |

**Memos**: `--memo` can be repeated and accepts `<type>:<data>` pairs. By default, both type and data are UTF-8 strings that get hex-encoded automatically. Prefix a value with `hex:` to pass raw hex through as-is:

```bash
# UTF-8 (auto hex-encoded) — this is the default
--memo "type:interchain_transfer"

# Raw hex (passed through as-is)
--memo "hex:74797065:hex:696e746572636861696e5f7472616e73666572"

# Mixed: raw hex type, UTF-8 data
--memo "hex:74797065:interchain_transfer"

# UTF-8 string that starts with 0x — works correctly, no ambiguity
--memo "destination_address:0x0A90c0Af1B07f6AC34f3520348Dbfae73BDa358E"
```

**Prepare for multi-signing**: Pass `--prepare` to autofill the transaction and output unsigned JSON instead of signing and submitting. The output has `SigningPubKey: ""` set, ready for `xrpl multisign`. Use `--signers <n>` to set the fee to `(n+1) * base_fee` as required by the multi-signing protocol.

```bash
# Send 10 XRP
xrpl send --to rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe --amount 10 --token XRP

# Send 100 USD IOU
xrpl send --to rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe --amount 100 --token USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B

# Send MPT
xrpl send --to rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe --amount 50 --token mpt:00064D1C63CEBEB49FC20032206CE0F203138BFC59F1AC578

# Cross-currency: send USD, pay up to 110 USD from source
xrpl send --to rPT1Sjq2 --amount 100 --token USD.rIssuer --send-max-amount 110 --send-max-token USD.rIssuer

# Partial payment with minimum
xrpl send --to rPT1Sjq2 --amount 100 --token USD.rIssuer --partial --deliver-min-amount 90 --deliver-min-token USD.rIssuer

# Send with memos
xrpl send --to rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe --amount 1 --token XRP \
  --memo "type:interchain_transfer" \
  --memo "destination_chain:ethereum" \
  --memo "destination_address:0x0A90c0Af1B07f6AC34f3520348Dbfae73BDa358E"

# Prepare for multi-signing (3 signers)
xrpl send --to rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe --amount 10 --token XRP \
  --prepare --signers 3 > unsigned.json
```

#### `submit`

Submit a raw signed transaction blob. Wraps [`submit`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/transaction-methods/submit).

```bash
xrpl submit <tx-blob> [--fail-hard]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<tx-blob>` | `string` | required | Hex-encoded signed transaction blob |
| `--fail-hard` | `boolean` | `false` | If `true`, fail immediately with `tec`-class errors instead of queuing |

#### `sign`

Sign a transaction (from JSON) without submitting. Uses the wallet from `--seed` / `--keyfile` / `XRPL_SEED`.

```bash
xrpl sign <tx-json> [--file <path>] [--multisign [<account>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<tx-json>` | `json` | — | Transaction JSON as a string argument |
| `--file` | `string` | — | Path to a JSON file containing the transaction (alternative to inline JSON) |
| `--multisign` | `string` | — | Sign for multi-signing. Optionally specify the multisig account address |

Outputs the signed blob (`tx_blob`) and transaction hash. When `--multisign` is used, produces a `Signers` entry instead of a regular signature.

#### `build`

Build a transaction, autofilling sequence/fee/ledger, and print it without signing or submitting. This is the generic escape hatch for any transaction type — you provide the raw fields and the CLI autofills the rest. Outputs unsigned JSON with `SigningPubKey: ""`, ready for `xrpl multisign` or `xrpl sign`.

```bash
xrpl build <TransactionType> [--<Field> <value>...] [--signers <n>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<TransactionType>` | `string` | required | Any valid XRPL transaction type (e.g. `Payment`, `OfferCreate`, `VaultCreate`) |
| `--<Field>` | varies | — | Transaction fields passed as `--FieldName value`. JSON objects/arrays must be quoted strings |
| `--signers` | `number` | — | Number of signers; sets fee to `(n+1) * base_fee` for multi-signing |

Fields are passed using their exact protocol names (PascalCase). String values are passed directly, objects/arrays as JSON strings.

```bash
xrpl build Payment --Destination rPT1Sjq2 --Amount 10000000
xrpl build OfferCreate --TakerPays '{"currency":"USD","issuer":"rIssuer","value":"100"}' --TakerGets "50000000"
xrpl build AccountDelete --Destination rTarget --DestinationTag 12345
```

### Trust Line Commands

#### `trust-set`

Create or modify a trust line. Wraps [`TrustSet`](https://xrpl.org/docs/references/protocol/transactions/types/trustset).

```bash
xrpl trust-set <currency> <issuer> [--limit <limit>] [--quality-in <quality>] [--quality-out <quality>] [--no-ripple] [--clear-no-ripple] [--freeze] [--clear-freeze] [--deep-freeze] [--clear-deep-freeze] [--auth] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<currency>` | `string` | required | Currency code: 3-char standard (e.g. `USD`) or 40-char hex |
| `<issuer>` | `address` | required | Issuer account address |
| `--limit` | `string` | `"0"` | Trust line limit (max amount you're willing to hold). `"0"` removes the trust line |
| `--quality-in` | `number` | — | Incoming quality ratio (value × 10^9). Treat incoming balances as worth this fraction |
| `--quality-out` | `number` | — | Outgoing quality ratio (value × 10^9). Treat outgoing balances as worth this fraction |
| `--no-ripple` | `boolean` | `false` | Set the No Ripple flag on this trust line (`tfSetNoRipple`) |
| `--clear-no-ripple` | `boolean` | `false` | Clear the No Ripple flag (`tfClearNoRipple`) |
| `--freeze` | `boolean` | `false` | Freeze this trust line (`tfSetFreeze`) |
| `--clear-freeze` | `boolean` | `false` | Unfreeze this trust line (`tfClearFreeze`) |
| `--deep-freeze` | `boolean` | `false` | Deep-freeze this trust line (`tfSetDeepFreeze`) |
| `--clear-deep-freeze` | `boolean` | `false` | Clear deep-freeze on this trust line (`tfClearDeepFreeze`) |
| `--auth` | `boolean` | `false` | Authorize the counterparty to hold your issued currency (`tfSetfAuth`) |

```bash
xrpl trust-set USD rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B --limit 1000000

# Freeze a specific trust line (issuer only)
xrpl trust-set USD rHolder --freeze

# Prepare a TrustSet for multi-signing
xrpl trust-set USD rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B --limit 1000000 --prepare --signers 3 > unsigned.json
```

### MPT Commands

Commands for working with Multi-Purpose Tokens. Requires amendment: **MPTokensV1**. These wrap [`MPTokenIssuanceCreate`](https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuancecreate), [`MPTokenAuthorize`](https://xrpl.org/docs/references/protocol/transactions/types/mptokenauthorize), [`MPTokenIssuanceSet`](https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuanceset), and [`MPTokenIssuanceDestroy`](https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuancedestroy).

#### `mpt-create`

Create a new Multi-Purpose Token issuance. Wraps [`MPTokenIssuanceCreate`](https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuancecreate).

```bash
xrpl mpt-create [--max-amount <max>] [--asset-scale <scale>] [--transfer-fee <fee>] [--can-transfer] [--can-lock] [--can-clawback] [--can-escrow] [--can-trade] [--require-auth] [--metadata <hex>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--max-amount` | `string` | max uint63 | Maximum supply. Non-negative integer string (up to 63-bit) |
| `--asset-scale` | `number` | `0` | Asset scale: 10^(-scale) of the standard unit (e.g. `2` for cents) |
| `--transfer-fee` | `number` | `0` | Fee for secondary sales (0–50000, representing 0.000%–50.000%) |
| `--can-transfer` | `boolean` | `false` | Allow transfers between non-issuer accounts (`tfMPTCanTransfer`) |
| `--can-lock` | `boolean` | `false` | Allow locking individual holders or all holders (`tfMPTCanLock`) |
| `--can-clawback` | `boolean` | `false` | Allow issuer to claw back tokens from holders (`tfMPTCanClawback`) |
| `--can-escrow` | `boolean` | `false` | Allow holders to place balances in escrow (`tfMPTCanEscrow`) |
| `--can-trade` | `boolean` | `false` | Allow holders to trade on the DEX or AMM (`tfMPTCanTrade`) |
| `--require-auth` | `boolean` | `false` | Require holders to be individually authorized (`tfMPTRequireAuth`) |
| `--metadata` | `string` | — | Token metadata as a hex string |

```bash
xrpl mpt-create --asset-scale 2 --can-transfer --metadata 4D79546F6B656E
```

#### `mpt-authorize`

Authorize an account to hold a specific MPT, or authorize/unauthorize a holder (as issuer). Wraps [`MPTokenAuthorize`](https://xrpl.org/docs/references/protocol/transactions/types/mptokenauthorize).

```bash
xrpl mpt-authorize <issuance-id> [--holder <address>] [--unauthorize] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<issuance-id>` | `string` | required | 48-character hex MPT issuance ID |
| `--holder` | `address` | — | When submitted by the issuer: the holder account to authorize/unauthorize |
| `--unauthorize` | `boolean` | `false` | Revoke authorization. As a holder: opt out and delete the MPToken (balance must be 0). As an issuer: unauthorize the `--holder` (`tfMPTUnauthorize`) |

#### `mpt-set`

Lock or unlock an MPT issuance or individual holder. Wraps [`MPTokenIssuanceSet`](https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuanceset).

```bash
xrpl mpt-set <issuance-id> [--holder <address>] [--lock] [--unlock] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<issuance-id>` | `string` | required | 48-character hex MPT issuance ID |
| `--holder` | `address` | — | Lock/unlock a specific holder. If omitted, applies globally to all holders |
| `--lock` | `boolean` | `false` | Lock the MPT (`tfMPTLock`) |
| `--unlock` | `boolean` | `false` | Unlock the MPT (`tfMPTUnlock`) |

Exactly one of `--lock` or `--unlock` is required. The issuance must have been created with `--can-lock`.

#### `mpt-destroy`

Destroy an MPT issuance. The issuance must have zero outstanding supply. Wraps [`MPTokenIssuanceDestroy`](https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuancedestroy).

```bash
xrpl mpt-destroy <issuance-id> [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<issuance-id>` | `string` | required | 48-character hex MPT issuance ID to destroy |

### Account Configuration Commands

#### `account-set`

Modify account properties. Wraps [`AccountSet`](https://xrpl.org/docs/references/protocol/transactions/types/accountset).

```bash
xrpl account-set [--flag <flag>] [--clear-flag <flag>] [--domain <domain>] [--transfer-rate <rate>] [--tick-size <size>] [--email-hash <hash>] [--message-key <key>] [--nftoken-minter <address>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--flag` | `string\|number` | — | Enable an account flag. Accepts a numeric value or symbolic name (see below) |
| `--clear-flag` | `string\|number` | — | Disable an account flag |
| `--domain` | `string` | — | Domain that owns this account (ASCII, hex-encoded automatically) |
| `--transfer-rate` | `number` | — | Fee for transferring issued currencies, as billionths (e.g. `1002000000` = 0.2% fee). `0` to clear |
| `--tick-size` | `number` | — | Tick size for offers involving currencies issued by this account (3–15, or `0` to disable) |
| `--email-hash` | `string` | — | 128-bit MD5 hash of an email address for Gravatar |
| `--message-key` | `string` | — | Public key for sending encrypted messages to this account |
| `--nftoken-minter` | `address` | — | Allow this account to mint NFTokens on your behalf |

`--flag` / `--clear-flag` symbolic names: `asfRequireDest` (1), `asfRequireAuth` (2), `asfDisallowXRP` (3), `asfDisableMaster` (4), `asfAccountTxnID` (5), `asfNoFreeze` (6), `asfGlobalFreeze` (7), `asfDefaultRipple` (8), `asfDepositAuth` (9), `asfAuthorizedNFTokenMinter` (10), `asfDisallowIncomingNFTokenOffer` (12), `asfDisallowIncomingCheck` (13), `asfDisallowIncomingPayChan` (14), `asfDisallowIncomingTrustline` (15), `asfAllowTrustLineClawback` (16), `asfAllowTrustLineLocking` (17).

#### `account-delete`

Delete an account, sending remaining XRP to a destination. The account must have a sequence number at least 256 higher than the current ledger index, own no ledger objects, and the special transaction fee is 5 XRP. Wraps [`AccountDelete`](https://xrpl.org/docs/references/protocol/transactions/types/accountdelete).

```bash
xrpl account-delete --to <destination> [--tag <destination-tag>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--to` | `address` | required | Destination account to receive remaining XRP. Must be a funded account |
| `--tag` | `number` | — | Destination tag for the recipient |

#### `set-regular-key`

Add, remove, or change an account's regular key pair. Wraps [`SetRegularKey`](https://xrpl.org/docs/references/protocol/transactions/types/setregularkey).

```bash
xrpl set-regular-key [--key <address>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--key` | `address` | — | The regular key address to assign. Must not match the account's master key pair. Omit to remove the regular key |

#### `deposit-preauth`

Preauthorize an account to send payments to you (for accounts with Deposit Authorization enabled). Wraps [`DepositPreauth`](https://xrpl.org/docs/references/protocol/transactions/types/depositpreauth).

```bash
xrpl deposit-preauth --authorize <address> [--prepare [--signers <n>]]
xrpl deposit-preauth --unauthorize <address> [--prepare [--signers <n>]]
xrpl deposit-preauth --authorize-credentials <issuer:credential-type>... [--prepare [--signers <n>]]
xrpl deposit-preauth --unauthorize-credentials <issuer:credential-type>... [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--authorize` | `address` | — | Preauthorize this account to send you payments |
| `--unauthorize` | `address` | — | Revoke preauthorization for this account |
| `--authorize-credentials` | `string` | — | Preauthorize by credential(s). Format: `<issuer>:<credential-type>`. Can be repeated (max 8) |
| `--unauthorize-credentials` | `string` | — | Revoke credential-based preauthorization. Same format |

Exactly one of the four options is required per invocation.

#### `signer-list-set`

Set or update the signer list on an account. Wraps [`SignerListSet`](https://xrpl.org/docs/references/protocol/transactions/types/signerlistset).

```bash
xrpl signer-list-set --quorum <quorum> --signer <address:weight>... [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--quorum` | `number` | required | Target weight threshold. A multi-signature is valid when the sum of signer weights meets or exceeds this value |
| `--signer` | `string` | required | Signer entry as `<address>:<weight>`. Can be repeated (1–32 signers). Weight is a `number` |

```bash
xrpl signer-list-set --quorum 3 \
  --signer rAddr1:1 \
  --signer rAddr2:1 \
  --signer rAddr3:1 \
  --signer rAddr4:1
```

#### `signer-list-delete`

Remove the signer list from an account. Sends a `SignerListSet` with `SignerQuorum: 0`. Takes no command-specific options.

#### `delegate-set`

Grant another account permission to send transactions on your behalf. Requires amendment: **PermissionDelegation**. Wraps [`DelegateSet`](https://xrpl.org/docs/references/protocol/transactions/types/delegateset).

```bash
xrpl delegate-set <authorize> [--permission <value>...] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<authorize>` | `address` | required | Account to delegate to (address or alias) |
| `--permission` | `string[]` | — | Permission value(s) to grant. Can be repeated |

To revoke delegation, submit a `DelegateSet` with an empty `Permissions` array via `xrpl build DelegateSet --Authorize <address> --Permissions '[]'`.

### Ticket Commands

#### `ticket-create`

Create tickets for later use. Wraps [`TicketCreate`](https://xrpl.org/docs/references/protocol/transactions/types/ticketcreate).

```bash
xrpl ticket-create <count> [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<count>` | `number` | required | Number of tickets to create (1–250). Account cannot own more than 250 total |

#### `tickets`

List available tickets for an account. Convenience wrapper around `account_objects --type ticket`.

```bash
xrpl tickets <account> [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<account>` | `address` | required | Account address or alias |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

### DEX Commands

#### `offer-create` (alias: `offer`)

Create a DEX offer. Wraps [`OfferCreate`](https://xrpl.org/docs/references/protocol/transactions/types/offercreate).

```bash
xrpl offer-create --taker-pays-amount <amount> --taker-pays-token <token> --taker-gets-amount <amount> --taker-gets-token <token> [--expiration <seconds>] [--offer-sequence <seq>] [--passive] [--immediate-or-cancel] [--fill-or-kill] [--sell] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--taker-pays-amount` | `string` | required | Amount the taker pays |
| `--taker-pays-token` | `token` | required | Token the taker pays: `XRP`, `<currency>.<issuer>`, or `mpt:<id>` |
| `--taker-gets-amount` | `string` | required | Amount the taker gets |
| `--taker-gets-token` | `token` | required | Token the taker gets: `XRP`, `<currency>.<issuer>`, or `mpt:<id>` |
| `--expiration` | `number` | — | Time in seconds since the Ripple Epoch after which the offer is no longer active |
| `--offer-sequence` | `number` | — | Sequence number of an existing offer to replace (cancelled atomically) |
| `--passive` | `boolean` | `false` | Don't consume offers that exactly match; only cross (`tfPassive`) |
| `--immediate-or-cancel` | `boolean` | `false` | Only match existing offers; never create a ledger object (`tfImmediateOrCancel`) |
| `--fill-or-kill` | `boolean` | `false` | Only execute if the entire `TakerPays` can be obtained (`tfFillOrKill`) |
| `--sell` | `boolean` | `false` | Exchange the entire `TakerGets` even if it exceeds `TakerPays` (`tfSell`) |

```bash
xrpl offer-create --taker-pays-amount 100 --taker-pays-token USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B --taker-gets-amount 50 --taker-gets-token XRP
```

#### `offer-cancel`

Cancel an existing DEX offer. Wraps [`OfferCancel`](https://xrpl.org/docs/references/protocol/transactions/types/offercancel).

```bash
xrpl offer-cancel <offer-sequence> [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<offer-sequence>` | `number` | required | Sequence number (or ticket number) of the `OfferCreate` transaction to cancel |

#### `book-offers` (alias: `order-book`)

Get the order book for a currency pair. Wraps [`book_offers`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/path-and-order-book-methods/book_offers).

```bash
xrpl book-offers <taker-pays> <taker-gets> [--limit <n>] [--taker <address>] [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<taker-pays>` | `token` | required | Token the taker pays: `XRP` or `<currency>.<issuer>` |
| `<taker-gets>` | `token` | required | Token the taker gets: `XRP` or `<currency>.<issuer>` |
| `--limit` | `number` | server default | Max offers to return. Unfunded offers are omitted regardless of limit |
| `--taker` | `address` | — | Perspective account. Unfunded offers from this account are always included |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

#### `deposit-authorized`

Check whether one account is authorized to send payments to another. Wraps [`deposit_authorized`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/path-and-order-book-methods/deposit_authorized).

```bash
xrpl deposit-authorized <source> <destination> [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<source>` | `address` | required | Source account address or alias |
| `<destination>` | `address` | required | Destination account address or alias |
| `--ledger-index` | `string` | `"validated"` | Ledger version: integer, `validated`, `closed`, or `current` |

### Path Finding Commands

#### `path-find` (alias: `paths`)

Find a payment path between two accounts. Wraps [`ripple_path_find`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/path-and-order-book-methods/ripple_path_find).

```bash
xrpl path-find <source> <destination> <amount> <token> [--send-max-amount <amount> --send-max-token <token>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<source>` | `address` | required | Source account address or alias |
| `<destination>` | `address` | required | Destination account address or alias |
| `<amount>` | `string` | required | Destination amount |
| `<token>` | `token` | required | Token: `XRP`, `<currency>.<issuer>`, or `mpt:<id>` |
| `--send-max-amount` | `string` | — | Max source amount to spend |
| `--send-max-token` | `token` | — | Token for `--send-max-amount` |

### AMM Commands

Commands for working with Automated Market Makers. Requires amendment: **AMM**. Wraps `AMMCreate`, `AMMDeposit`, `AMMWithdraw`, `AMMVote`, `AMMBid`, `AMMDelete`.

#### `amm-info`

Get info about an AMM instance. Query by token pair or by AMM account address. Wraps [`amm_info`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/path-and-order-book-methods/amm_info).

```bash
xrpl amm-info [--asset <token> --asset2 <token>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--asset` | `token` | — | First token of the pair: `XRP`, `<currency>.<issuer>` |
| `--asset2` | `token` | — | Second token of the pair |

#### `amm-create`

Create a new AMM for a token pair. Both initial deposits are required. Wraps [`AMMCreate`](https://xrpl.org/docs/references/protocol/transactions/types/ammcreate).

```bash
xrpl amm-create --amount1 <amount> --token1 <token> --amount2 <amount> --token2 <token> [--trading-fee <fee>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--amount1` | `string` | required | First token deposit amount |
| `--token1` | `token` | required | First token: `XRP`, `<currency>.<issuer>` |
| `--amount2` | `string` | required | Second token deposit amount |
| `--token2` | `token` | required | Second token: `XRP`, `<currency>.<issuer>` |
| `--trading-fee` | `number` | `0` | Trading fee in basis points (0–1000, i.e. 0–1%). Charged on swaps |

#### `amm-deposit`

Deposit funds into an AMM. Multiple deposit modes: two-asset (proportional), single-asset, LP-token targeted, or limit-price. The flags are inferred from which options you provide. Wraps [`AMMDeposit`](https://xrpl.org/docs/references/protocol/transactions/types/ammdeposit).

```bash
xrpl amm-deposit --asset <token> --asset2 <token> [--amount <amount> --amount-token <token>] [--amount2 <amount> --amount2-token <token>] [--lp-token-out <amount> --lp-token-token <token>] [--e-price <amount> --e-price-token <token>] [--lp-token] [--single-asset] [--two-asset] [--one-asset-lp-token] [--limit-lp-token] [--two-asset-if-empty] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--asset` | `token` | required | First token of the AMM pair (identifies the AMM) |
| `--asset2` | `token` | required | Second token of the AMM pair |
| `--amount` | `string` | — | Amount of the first asset to deposit |
| `--amount-token` | `token` | — | Token for `--amount` |
| `--amount2` | `string` | — | Amount of the second asset to deposit |
| `--amount2-token` | `token` | — | Token for `--amount2` |
| `--lp-token-out` | `string` | — | LP tokens to receive |
| `--lp-token-token` | `token` | — | Token for `--lp-token-out` |
| `--e-price` | `string` | — | Effective price limit |
| `--e-price-token` | `token` | — | Token for `--e-price` |
| `--lp-token` | `boolean` | `false` | Deposit LP tokens only (`tfLPToken`) |
| `--single-asset` | `boolean` | `false` | Single-asset deposit (`tfSingleAsset`) |
| `--two-asset` | `boolean` | `false` | Two-asset deposit (`tfTwoAsset`) |
| `--one-asset-lp-token` | `boolean` | `false` | Single asset with LP token constraint (`tfOneAssetLPToken`) |
| `--limit-lp-token` | `boolean` | `false` | Limit by LP token amount (`tfLimitLPToken`) |
| `--two-asset-if-empty` | `boolean` | `false` | Two-asset deposit for empty pool (`tfTwoAssetIfEmpty`) |

#### `amm-withdraw`

Withdraw funds from an AMM. Multiple withdrawal modes mirror the deposit modes. The flags are inferred from which options you provide. Wraps [`AMMWithdraw`](https://xrpl.org/docs/references/protocol/transactions/types/ammwithdraw).

```bash
xrpl amm-withdraw --asset <token> --asset2 <token> [--amount <amount> --amount-token <token>] [--amount2 <amount> --amount2-token <token>] [--lp-token-in <amount> --lp-token-token <token>] [--e-price <amount> --e-price-token <token>] [--lp-token] [--withdraw-all] [--one-asset-withdraw-all] [--single-asset] [--two-asset] [--one-asset-lp-token] [--limit-lp-token] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--asset` | `token` | required | First token of the AMM pair (identifies the AMM) |
| `--asset2` | `token` | required | Second token of the AMM pair |
| `--amount` | `string` | — | Amount of the first asset to withdraw |
| `--amount-token` | `token` | — | Token for `--amount` |
| `--amount2` | `string` | — | Amount of the second asset to withdraw |
| `--amount2-token` | `token` | — | Token for `--amount2` |
| `--lp-token-in` | `string` | — | LP tokens to redeem |
| `--lp-token-token` | `token` | — | Token for `--lp-token-in` |
| `--e-price` | `string` | — | Effective price limit |
| `--e-price-token` | `token` | — | Token for `--e-price` |
| `--lp-token` | `boolean` | `false` | Withdraw LP tokens only (`tfLPToken`) |
| `--withdraw-all` | `boolean` | `false` | Withdraw all assets proportionally (`tfWithdrawAll`) |
| `--one-asset-withdraw-all` | `boolean` | `false` | Withdraw all of one asset (`tfOneAssetWithdrawAll`) |
| `--single-asset` | `boolean` | `false` | Withdraw a single asset (`tfSingleAsset`) |
| `--two-asset` | `boolean` | `false` | Withdraw both assets (`tfTwoAsset`) |
| `--one-asset-lp-token` | `boolean` | `false` | Single asset with LP token constraint (`tfOneAssetLPToken`) |
| `--limit-lp-token` | `boolean` | `false` | Limit by LP token amount (`tfLimitLPToken`) |

#### `amm-vote`

Vote on an AMM's trading fee. Your vote is weighted by your LP token holdings. Wraps [`AMMVote`](https://xrpl.org/docs/references/protocol/transactions/types/ammvote).

```bash
xrpl amm-vote --asset <token> --asset2 <token> --trading-fee <fee> [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--asset` | `token` | required | First token of the AMM pair |
| `--asset2` | `token` | required | Second token of the AMM pair |
| `--trading-fee` | `number` | required | Proposed trading fee in basis points (0–1000, i.e. 0–1%) |

#### `amm-bid`

Bid on an AMM's auction slot. The auction slot holder gets a discounted trading fee (0%) for 24 hours. Wraps [`AMMBid`](https://xrpl.org/docs/references/protocol/transactions/types/ammbid).

```bash
xrpl amm-bid --asset <token> --asset2 <token> [--bid-min-amount <amount> --bid-min-token <token>] [--bid-max-amount <amount> --bid-max-token <token>] [--auth-accounts <address>...] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--asset` | `token` | required | First token of the AMM pair |
| `--asset2` | `token` | required | Second token of the AMM pair |
| `--bid-min-amount` | `string` | — | Minimum bid amount |
| `--bid-min-token` | `token` | — | Token for `--bid-min-amount` |
| `--bid-max-amount` | `string` | — | Maximum bid amount |
| `--bid-max-token` | `token` | — | Token for `--bid-max-amount` |
| `--auth-accounts` | `address[]` | — | Up to 4 accounts to authorize for the discounted trading fee |

### Check Commands

Commands for working with Checks. Requires amendment: **Checks**. Wraps `CheckCreate`, `CheckCash`, `CheckCancel`.

#### `check-create`

Create a check. Wraps [`CheckCreate`](https://xrpl.org/docs/references/protocol/transactions/types/checkcreate).

```bash
xrpl check-create --destination <address> --send-max-amount <amount> --send-max-token <token> [--tag <destination-tag>] [--expiration <seconds>] [--invoice-id <hex>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--destination` | `address` | required | Recipient address or alias |
| `--send-max-amount` | `string` | required | Maximum amount the check can debit |
| `--send-max-token` | `token` | required | Token: `XRP`, `<currency>.<issuer>`, or `mpt:<id>` |
| `--tag` | `number` | — | Destination tag |
| `--expiration` | `number` | — | Check expiration (Ripple epoch) |
| `--invoice-id` | `string` | — | 256-bit invoice ID (64-char hex) |

#### `check-cash`

Redeem a check. Exactly one of `--amount`/`--token` or `--deliver-min-amount`/`--deliver-min-token` is required. Wraps [`CheckCash`](https://xrpl.org/docs/references/protocol/transactions/types/checkcash).

```bash
xrpl check-cash <check-id> [--amount <amount> --token <token>] [--deliver-min-amount <amount> --deliver-min-token <token>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<check-id>` | `string` | required | 64-character hex ID of the Check ledger object |
| `--amount` | `string` | — | Exact amount to cash |
| `--token` | `token` | — | Token for `--amount` |
| `--deliver-min-amount` | `string` | — | Minimum amount to deliver |
| `--deliver-min-token` | `token` | — | Token for `--deliver-min-amount` |

#### `check-cancel`

Cancel a check. Can be cancelled by the sender or recipient, or by anyone after expiration. Wraps [`CheckCancel`](https://xrpl.org/docs/references/protocol/transactions/types/checkcancel).

```bash
xrpl check-cancel <check-id> [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<check-id>` | `string` | required | 64-character hex ID of the Check ledger object to cancel |

### Escrow Commands

#### `escrow-create`

Create a time-based or condition-based XRP escrow. At least one of `--finish-after` or `--condition` is required. Wraps [`EscrowCreate`](https://xrpl.org/docs/references/protocol/transactions/types/escrowcreate).

```bash
xrpl escrow-create --destination <address> --amount <xrp> [--finish-after <time>] [--cancel-after <time>] [--condition <hex>] [--tag <destination-tag>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--destination` | `address` | required | Recipient address or alias |
| `--amount` | `string` | required | Amount of XRP to escrow |
| `--finish-after` | `string` | — | Earliest finish time (ISO 8601 or Ripple epoch) |
| `--cancel-after` | `string` | — | Expiration time (ISO 8601 or Ripple epoch) |
| `--condition` | `string` | — | Crypto-condition (hex) |
| `--tag` | `number` | — | Destination tag |

#### `escrow-finish`

Complete an escrow and release funds to the destination. Wraps [`EscrowFinish`](https://xrpl.org/docs/references/protocol/transactions/types/escrowfinish).

```bash
xrpl escrow-finish <owner> <offer-sequence> [--condition <hex>] [--fulfillment <hex>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<owner>` | `address` | required | Escrow owner address or alias |
| `<offer-sequence>` | `number` | required | Sequence number of the `EscrowCreate` transaction |
| `--condition` | `string` | — | Crypto-condition (hex) |
| `--fulfillment` | `string` | — | Crypto-condition fulfillment (hex) |

#### `escrow-cancel`

Cancel an expired escrow and return funds to the sender. The escrow's `CancelAfter` time must have passed. Wraps [`EscrowCancel`](https://xrpl.org/docs/references/protocol/transactions/types/escrowcancel).

```bash
xrpl escrow-cancel <owner> <offer-sequence> [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<owner>` | `address` | required | Escrow owner address or alias |
| `<offer-sequence>` | `number` | required | Sequence number of the `EscrowCreate` transaction |

### Payment Channel Commands

#### `channel-create`

Create a payment channel (XRP only). Wraps [`PaymentChannelCreate`](https://xrpl.org/docs/references/protocol/transactions/types/paymentchannelcreate).

```bash
xrpl channel-create --destination <address> --amount <xrp> --settle-delay <seconds> --public-key <hex> [--cancel-after <ripple-time>] [--tag <destination-tag>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--destination` | `address` | required | Destination address or alias |
| `--amount` | `string` | required | Amount of XRP (in XRP, converted to drops internally) to fund the channel with |
| `--settle-delay` | `number` | required | Seconds the source must wait before closing the channel with unclaimed XRP |
| `--public-key` | `string` | required | Hex public key (secp256k1 or ed25519) used to sign claims against this channel |
| `--cancel-after` | `string` | — | ISO 8601 time after which the channel expires (immutable) |
| `--tag` | `number` | — | Destination tag |

#### `channel-fund`

Add XRP to an existing payment channel. Wraps [`PaymentChannelFund`](https://xrpl.org/docs/references/protocol/transactions/types/paymentchannelfund).

```bash
xrpl channel-fund <channel-id> --amount <xrp> [--expiration <ripple-time>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<channel-id>` | `string` | required | Channel ID (64-char hex) |
| `--amount` | `string` | required | Amount of XRP to add |
| `--expiration` | `string` | — | New expiration (Ripple epoch) |

#### `channel-claim`

Claim XRP from a payment channel, or request to close it. Wraps [`PaymentChannelClaim`](https://xrpl.org/docs/references/protocol/transactions/types/paymentchannelclaim).

```bash
xrpl channel-claim <channel-id> [--balance <xrp>] [--amount <xrp>] [--signature <hex>] [--public-key <hex>] [--close] [--renew] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<channel-id>` | `string` | required | Channel ID (64-char hex) |
| `--balance` | `string` | — | New balance after claim |
| `--amount` | `string` | — | Amount of XRP authorized by signature |
| `--signature` | `string` | — | Hex signature of the claim. Not required if sender is the channel source |
| `--public-key` | `string` | — | Hex public key matching the channel's `PublicKey`. Required with `--signature` |
| `--close` | `boolean` | `false` | Request to close the channel (`tfClose`). Immediate if no XRP remains, otherwise closes after settle delay |
| `--renew` | `boolean` | `false` | Clear the channel's expiration time (`tfRenew`). Source address only |

#### `channel-verify`

Verify a payment channel claim's signature. Wraps [`channel_verify`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/payment-channel-methods/channel_verify).

```bash
xrpl channel-verify <channel-id> --amount <xrp> --signature <hex> --public-key <hex>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<channel-id>` | `string` | required | Channel ID (64-char hex) |
| `--amount` | `string` | required | Amount of XRP the signature authorizes |
| `--signature` | `string` | required | Signature to verify |
| `--public-key` | `string` | required | Public key of the signer |

### NFT Commands

Commands for working with Non-Fungible Tokens. Requires amendment: **NonFungibleTokensV1_1**.

#### `nft-mint`

Mint an NFT. Wraps [`NFTokenMint`](https://xrpl.org/docs/references/protocol/transactions/types/nftokenmint).

```bash
xrpl nft-mint --taxon <taxon> [--uri <uri>] [--transfer-fee <fee>] [--issuer <address>] [--amount <amount> --amount-token <token>] [--destination <address>] [--expiration <ripple-time>] [--burnable] [--only-xrp] [--trust-line] [--transferable] [--mutable] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--taxon` | `number` | required | Token taxon. Used to group NFTs into collections. The ledger scrambles this internally; identical taxon values are not guaranteed sequential |
| `--uri` | `string` | — | URI for the NFT data (up to 256 bytes). Hex-encoded internally |
| `--transfer-fee` | `number` | — | Transfer fee in basis points (0–50000, i.e. 0–50%). Charged on secondary sales. Only meaningful with `--transferable` |
| `--issuer` | `address` | — | Issuer account if minting on behalf of another account (requires `MintAccount` authorization) |
| `--amount` | `string` | — | Amount for mint-and-sell offer |
| `--amount-token` | `token` | — | Token for `--amount` |
| `--destination` | `address` | — | If set, only this account can mint the token (for private/allowlisted mints) |
| `--expiration` | `string` | — | ISO 8601 time after which the mint offer expires (converted to Ripple Epoch internally) |
| `--burnable` | `boolean` | `false` | Flag `tfBurnable`: issuer can burn this NFT even after transfer |
| `--only-xrp` | `boolean` | `false` | Flag `tfOnlyXRP`: NFT can only be traded for XRP |
| `--trust-line` | `boolean` | `false` | Flag `tfTrustLine`: allow creating trust lines to hold transfer fees for non-XRP tokens |
| `--transferable` | `boolean` | `false` | Flag `tfTransferable`: NFT can be transferred between accounts (secondary sales). Without this, NFT can only be traded back to issuer |
| `--mutable` | `boolean` | `false` | Flag `tfMutable`: URI and other mutable fields can be updated after minting |

#### `nft-burn`

Burn an NFT. The signer must be the NFT owner or the issuer (if `tfBurnable` was set at mint). Wraps [`NFTokenBurn`](https://xrpl.org/docs/references/protocol/transactions/types/nftokenburn).

```bash
xrpl nft-burn <nft-id> [--owner <address>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<nft-id>` | `string` | required | 64-character hex NFTokenID to burn |
| `--owner` | `address` | — | Required when the issuer (not the owner) is burning. Specifies the current owner of the NFT |

#### `nft-offer-create`

Create an offer to buy or sell an NFT. By default creates a buy offer; use `--sell` for a sell offer. Wraps [`NFTokenCreateOffer`](https://xrpl.org/docs/references/protocol/transactions/types/nftokencreateoffer).

```bash
xrpl nft-offer-create <nft-id> --amount <amount> --token <token> [--sell] [--owner <address>] [--destination <address>] [--expiration <iso-time>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<nft-id>` | `string` | required | 64-character hex NFTokenID |
| `--amount` | `string` | required | Offer amount. Use `0` with `--token XRP` for a free transfer (sell offers only) |
| `--token` | `token` | required | Currency for the offer: `XRP`, `<currency>.<issuer>` |
| `--sell` | `boolean` | `false` | Flag `tfSellNFToken`: create a sell offer (default is buy) |
| `--owner` | `address` | — | For buy offers: the current owner of the NFT. Not used for sell offers |
| `--destination` | `address` | — | If set, only this account can accept the offer |
| `--expiration` | `string` | — | ISO 8601 time after which the offer expires (converted to Ripple Epoch internally) |

#### `nft-offer-accept`

Accept an offer to buy or sell an NFT. Provide one of `--buy-offer` / `--sell-offer`, or both for brokered mode. Wraps [`NFTokenAcceptOffer`](https://xrpl.org/docs/references/protocol/transactions/types/nftokenacceptoffer).

```bash
xrpl nft-offer-accept [--buy-offer <offer-id>] [--sell-offer <offer-id>] [--broker-fee-amount <amount> --broker-fee-token <token>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--buy-offer` | `string` | — | 64-character hex ID of a buy offer to accept |
| `--sell-offer` | `string` | — | 64-character hex ID of a sell offer to accept |
| `--broker-fee-amount` | `string` | — | Broker fee amount. Only valid in brokered mode (both `--buy-offer` and `--sell-offer` specified) |
| `--broker-fee-token` | `token` | — | Token for broker fee |

#### `nft-offer-cancel`

Cancel one or more NFT offers you own. Wraps [`NFTokenCancelOffer`](https://xrpl.org/docs/references/protocol/transactions/types/nftokencanceloffer).

```bash
xrpl nft-offer-cancel <offer-id>... [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<offer-id>...` | `string[]` | required | One or more 64-character hex offer IDs to cancel |

#### `nft-buy-offers`

Get buy offers for an NFT. Wraps [`nft_buy_offers`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/path-and-order-book-methods/nft_buy_offers).

```bash
xrpl nft-buy-offers <nft-id> [--limit <n>] [--marker <marker>] [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<nft-id>` | `string` | required | 64-character hex NFTokenID to query buy offers for |
| `--limit` | `number` | — | Maximum number of offers to return |
| `--marker` | `string` | — | Pagination marker from a previous response |
| `--ledger-index` | `string` | `"validated"` | Ledger version |

#### `nft-sell-offers`

Get sell offers for an NFT. Wraps [`nft_sell_offers`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/path-and-order-book-methods/nft_sell_offers).

```bash
xrpl nft-sell-offers <nft-id> [--limit <n>] [--marker <marker>] [--ledger-index <index>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<nft-id>` | `string` | required | 64-character hex NFTokenID to query sell offers for |
| `--limit` | `number` | — | Maximum number of offers to return |
| `--marker` | `string` | — | Pagination marker from a previous response |
| `--ledger-index` | `string` | `"validated"` | Ledger version |

### Clawback Commands

Requires amendment: **Clawback**.

#### `clawback`

Claw back tokens from a holder. For IOUs, the signer must be the token issuer and must have enabled `lsfAllowTrustLineClawback`. For MPTs, the issuer must have set `tfMPTCanClawback` at creation. Wraps [`Clawback`](https://xrpl.org/docs/references/protocol/transactions/types/clawback).

```bash
xrpl clawback --amount <amount> --token <token> [--holder <address>] [--prepare [--signers <n>]]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--amount` | `string` | required | Amount to claw back |
| `--token` | `token` | required | Token to claw back: `<currency>.<issuer>` for IOUs, `mpt:<issuance-id>` for MPTs. XRP cannot be clawed back |
| `--holder` | `address` | — | Holder account (for MPT clawback) |

### Multi-Signing Commands

XRPL supports native multi-signing: an account configures a signer list (via `signer-list-set`) with weighted addresses and a quorum. Transactions from that account require signatures from signers whose combined weight meets the quorum.

Multi-signed transactions must set `SigningPubKey` to an empty string and use a higher fee: at least `(N+1) * base_fee`, where N is the number of signatures provided.

**Preparing transactions for multi-signing**: Any transaction command (e.g. `send`, `trust-set`, `offer-create`, `account-set`) accepts `--prepare` to output unsigned JSON instead of signing and submitting. Use `--signers <n>` to set the correct fee. Alternatively, use `xrpl build` for raw transaction types.

The multi-signing workflow is:

```bash
# 1. Prepare the transaction (using any command with --prepare, or xrpl build)
xrpl send --to rAddr --amount 10 --token XRP --prepare --signers 3 > unsigned.json

# 2. Each signer signs independently
XRPL_SEED=sSigner1... xrpl multisign --file unsigned.json --account rMultisig > sig1.json
XRPL_SEED=sSigner2... xrpl multisign --file unsigned.json --account rMultisig > sig2.json
XRPL_SEED=sSigner3... xrpl multisign --file unsigned.json --account rMultisig > sig3.json

# 3. Combine and submit
xrpl multisign-submit --files sig1.json sig2.json sig3.json
```

#### `multisign`

Add a signer's signature to a transaction for multi-signing. The transaction must have `SigningPubKey: ""` (set automatically by `--prepare` and `build`). Uses `Wallet.sign(tx, multisign)` under the hood.

```bash
xrpl multisign [<tx-json>] --account <multisig-account> [--file <path>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<tx-json>` | `json` | — | Transaction JSON as a string argument |
| `--file` | `string` | — | Path to a JSON file containing the transaction (alternative to inline JSON) |
| `--account` | `address` | required | The multisig account address this signature is for |

Returns the transaction with this signer's entry added to the `Signers` array.

#### `multisign-combine`

Combine multiple individually-signed transactions into a single submittable blob.

```bash
xrpl multisign-combine [<signed-tx-json>...] [--files <path>...]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<signed-tx-json>` | `json` | — | One or more signed transaction JSON strings |
| `--files` | `string[]` | — | Paths to JSON files, each containing a signed transaction with a `Signers` entry |

Merges all `Signers` arrays, sorts them by decoded account ID (as required by the protocol), and outputs the combined transaction JSON.

#### `multisign-submit`

Combine signatures and submit in one step.

```bash
xrpl multisign-submit [<signed-tx-json>...] [--files <path>...] [--fail-hard]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<signed-tx-json>` | `json` | — | One or more signed transaction JSON strings |
| `--files` | `string[]` | — | Paths to JSON files containing individually-signed transactions |
| `--fail-hard` | `boolean` | `false` | Fail immediately with `tec`-class errors instead of queuing |

### Wallet Commands

#### `wallet generate`

Generate a new random XRPL keypair. The account must be funded before it exists on the ledger.

```bash
xrpl wallet generate [--algorithm <ed25519|secp256k1>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--algorithm` | `string` | `"ed25519"` | Key algorithm: `ed25519` or `secp256k1` |

Outputs address, public key, private key, and seed.

#### `wallet from-seed`

Derive a wallet from an existing seed (e.g. `sEdV...`).

```bash
xrpl wallet from-seed <seed> [--algorithm <ed25519|secp256k1>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<seed>` | `string` | required | Base58-encoded seed string |
| `--algorithm` | `string` | `"ed25519"` | Key algorithm: `ed25519` or `secp256k1` |

#### `wallet from-entropy`

Derive a wallet from raw entropy (16 bytes).

```bash
xrpl wallet from-entropy <hex-entropy> [--algorithm <ed25519|secp256k1>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<hex-entropy>` | `string` | required | 32-character hex string (16 bytes of entropy) |
| `--algorithm` | `string` | `"ed25519"` | Key algorithm: `ed25519` or `secp256k1` |

#### `wallet fund`

Fund a wallet using the testnet/devnet faucet. Only works on testnet and devnet. If no account is specified, generates a new wallet and funds it.

```bash
xrpl wallet fund [--account <account>] [--amount <amount>] [--faucet-host <host>] [--faucet-path <path>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--account` | `address` | — | Account to fund. If omitted, generates a new wallet |
| `--amount` | `string` | faucet default | Amount of XRP to request from the faucet |
| `--faucet-host` | `string` | per network | Custom faucet hostname (overrides default for the network) |
| `--faucet-path` | `string` | per network | Custom faucet API path |

### Conversion Commands

#### `xrp-to-drops`

Convert an XRP amount to drops (1 XRP = 1,000,000 drops). Offline.

```bash
xrpl xrp-to-drops <amount>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<amount>` | `string` | required | XRP amount (e.g. `1.5`, `0.000001`) |

```bash
xrpl xrp-to-drops 1.5
# 1500000
```

#### `drops-to-xrp`

Convert drops to XRP. Offline.

```bash
xrpl drops-to-xrp <drops>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<drops>` | `string` | required | Amount in drops (e.g. `1500000`) |

```bash
xrpl drops-to-xrp 1500000
# 1.5
```

#### `ripple-time`

Convert between XRPL epoch timestamps (seconds since 2000-01-01T00:00:00Z) and ISO 8601. Offline.

```bash
xrpl ripple-time --to-iso <ripple-timestamp>
xrpl ripple-time --to-ripple <iso-time>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--to-iso` | `number` | — | Convert a Ripple epoch timestamp to ISO 8601 string |
| `--to-ripple` | `string` | — | Convert an ISO 8601 string to a Ripple epoch timestamp |

Exactly one of `--to-iso` or `--to-ripple` is required.

### Utility Commands

#### `address-info`

Validate and decode an XRPL address. Supports both classic r-addresses and X-addresses. Offline.

```bash
xrpl address-info <address>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<address>` | `string` | required | Classic r-address or X-address to inspect |

Outputs:

- Whether the address is valid
- Address type: classic (`r...`) or X-address (`X...` / `T...`)
- Account ID (hex)
- For X-addresses: the embedded destination tag (if any) and whether it's mainnet or testnet

```bash
xrpl address-info rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY
# Valid: true
# Type: classic
# Account ID: 2DECAB42559A4B0B0F9B2C4A3C7B8E1F5D6A7C9E
# Network: any

xrpl address-info X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqh
# Valid: true
# Type: x-address
# Classic: rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY
# Tag: 12345
# Network: mainnet
```

#### `to-hex`

Convert a UTF-8 string to hex. Useful for memos, domains, and MPT metadata. Offline.

```bash
xrpl to-hex <string>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<string>` | `string` | required | UTF-8 string to hex-encode |

```bash
xrpl to-hex "interchain_transfer"
# 696E746572636861696E5F7472616E73666572
```

#### `from-hex`

Convert hex to a UTF-8 string. Useful for reading memos, domains, and metadata from raw ledger data. Offline.

```bash
xrpl from-hex <hex>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<hex>` | `string` | required | Hex string to decode (with or without `0x` prefix) |

```bash
xrpl from-hex 696E746572636861696E5F7472616E73666572
# interchain_transfer
```

#### `hash`

Hash data using XRPL-relevant algorithms. Offline.

```bash
xrpl hash <algorithm> <data> [--hex]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<algorithm>` | `string` | required | Hash algorithm: `sha256`, `sha512`, `sha512half`, `ripemd160` |
| `<data>` | `string` | required | Data to hash (UTF-8 string by default) |
| `--hex` | `boolean` | `false` | Treat input as hex-encoded bytes instead of UTF-8 |

`sha512half` returns the first 32 bytes of the SHA-512 digest — this is the hash function used internally by the XRP Ledger for transaction IDs, account IDs, and ledger object keys.

```bash
xrpl hash sha256 "hello world"
xrpl hash sha512half "hello world"
xrpl hash ripemd160 --hex 0123456789ABCDEF
```

#### `decode-tx`

Decode a raw transaction blob into readable JSON. Uses `ripple-binary-codec` under the hood. Offline — does not require a network connection.

```bash
xrpl decode-tx <tx-blob>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<tx-blob>` | `string` | required | Hex-encoded transaction blob |

#### `rpc`

Send a raw WebSocket API request. This is the escape hatch for any API method not covered by a dedicated command.

```bash
xrpl rpc <method> [<params>]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<method>` | `string` | required | Any rippled API method name (e.g. `account_info`, `vault_info`) |
| `[params]` | `json` | `{}` | JSON object of method parameters |

```bash
xrpl rpc account_info '{"account": "rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY", "ledger_index": "validated"}'
xrpl rpc vault_info '{"vault_id": "..."}'
```

#### `subscribe`

Subscribe to ledger events via WebSocket and print them as they arrive. Runs until interrupted (Ctrl+C). Wraps [`subscribe`](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/subscription-methods/subscribe).

```bash
xrpl subscribe [--streams <stream>...] [--accounts <address>...]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--streams` | `string[]` | — | Event streams to subscribe to: `consensus`, `ledger`, `manifests`, `peer_status`, `transactions`, `transactions_proposed`, `validations` |
| `--accounts` | `address[]` | — | Watch for validated transactions affecting these accounts |

```bash
# Watch for new validated ledgers
xrpl subscribe --streams ledger

# Watch transactions for a specific account
xrpl subscribe --accounts rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY
```

#### `ping`

Confirm connectivity with the server. Takes no options.

#### `completions`

Generate shell completion scripts. Offline.

```bash
xrpl completions <bash|zsh|fish>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `<bash\|zsh\|fish>` | `string` | required | Shell to generate completions for |

```bash
# Bash
xrpl completions bash > ~/.local/share/bash-completion/completions/xrpl

# Zsh (make sure ~/.zfunc is in your fpath)
xrpl completions zsh > ~/.zfunc/_xrpl

# Fish
xrpl completions fish > ~/.config/fish/completions/xrpl.fish
```

Restart your shell or source the file for completions to take effect.

## Configuration

### Environment Variables

| Variable       | Description                                      |
|----------------|--------------------------------------------------|
| `XRPL_SEED`    | Default wallet seed for signing                  |
| `XRPL_NETWORK` | Default network (`mainnet`, `testnet`, `devnet`) |
| `XRPL_RPC_URL` | Default WebSocket RPC URL                        |

### Configuration File

`xrpl` reads configuration from the first file found (in order):

1. `$XDG_CONFIG_HOME/xrpl/config.toml` (typically `~/.config/xrpl/config.toml`)
2. `~/.xrplrc`

```toml
network = "testnet"
rpc_url = "wss://s.altnet.rippletest.net:51233"

[aliases]
myaccount = "rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY"
gateway = "rGAbJZEzU6WaYv5y1LfyN7LBBcQJ3TxsKC"
```

Aliases can be used anywhere an account address is expected:

```bash
xrpl balance myaccount
xrpl send --to gateway --amount 10 --token XRP
```

### Exit Codes

| Code | Meaning                                              |
|------|------------------------------------------------------|
| 0    | Success                                              |
| 1    | General error                                        |
| 2    | Invalid arguments / usage error                      |
| 3    | Network / connection error                           |
| 4    | Transaction rejected (e.g. `tec*` result codes)      |
| 5    | Transaction expired (past `LastLedgerSequence`)       |

### Shell Completions

See [`completions`](#completions) for generating shell completion scripts.

## Amendments

The XRPL uses an [amendment system](https://xrpl.org/docs/concepts/networks-and-servers/amendments) to introduce new features. Different networks have different amendments enabled — Devnet typically has experimental amendments, Testnet mirrors Mainnet, and Mainnet only enables amendments after a 2-week validator supermajority vote.

`xrpl` makes all commands available regardless of the connected network. If you use a command that requires an amendment not enabled on the connected network, the transaction will be rejected by `rippled` with a clear error (e.g. `temDISABLED`). The CLI does not gate features client-side — the network is the source of truth.

Use `xrpl feature` to check what's enabled on your connected network:

```bash
xrpl feature --enabled --network devnet
xrpl feature MPTokensV1 --network mainnet
```

Commands that depend on non-core amendments note the requirement in their help text and in this README (e.g. "Requires amendment: **MPTokensV1**").

## Protocol Coverage

The following transaction types are deliberately not given dedicated commands. They are either too niche, too new, or still in amendment stages. All of them remain accessible via `xrpl build <TransactionType>` (for transactions) or `xrpl rpc <method>` (for queries):

- **DID**: `DIDSet`, `DIDDelete`
- **Oracles**: `OracleSet`, `OracleDelete`
- **Permissioned Domains**: `PermissionedDomainSet`, `PermissionedDomainDelete`
- **Loans**: `LoanSet`, `LoanDelete`, `LoanManage`, `LoanPay`, `LoanBrokerSet`, `LoanBrokerDelete`, `LoanBrokerCoverDeposit`, `LoanBrokerCoverWithdraw`, `LoanBrokerCoverClawback`
- **Vaults**: `VaultCreate`, `VaultDeposit`, `VaultWithdraw`, `VaultSet`, `VaultDelete`, `VaultClawback`; query via `xrpl rpc vault_info`
- **Cross-chain Bridges**: `XChainCreateBridge`, `XChainCommit`, `XChainClaim`, `XChainCreateClaimID`, `XChainModifyBridge`, `XChainAccountCreateCommit`, `XChainAddClaimAttestation`, `XChainAddAccountCreateAttestation`
- **Batch**: `Batch`
- **Credentials**: `CredentialCreate`, `CredentialAccept`, `CredentialDelete`
- **Ledger Repair**: `LedgerStateFix`

## Examples

```bash
# Full flow: generate wallet, fund it, send a payment
xrpl wallet generate
export XRPL_SEED=sEdV...
xrpl wallet fund --network testnet
xrpl send --to rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe --amount 25 --token XRP --network testnet

# Set up a multisig account
xrpl signer-list-set --quorum 3 \
  --signer rAddr1:1 --signer rAddr2:1 --signer rAddr3:1 --signer rAddr4:1
xrpl account-set --flag asfDisableMaster

# Multi-sign a payment from the multisig
xrpl send --to rSomeAddr --amount 10 --token XRP --prepare --signers 3 > unsigned.json
XRPL_SEED=sSigner1... xrpl multisign --file unsigned.json --account rMultisig > sig1.json
XRPL_SEED=sSigner2... xrpl multisign --file unsigned.json --account rMultisig > sig2.json
XRPL_SEED=sSigner3... xrpl multisign --file unsigned.json --account rMultisig > sig3.json
xrpl multisign-submit --files sig1.json sig2.json sig3.json

# Create 250 tickets for parallel multisig prover transactions
xrpl ticket-create 250

# Create a trust line, then send an IOU
xrpl trust-set USD rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B --limit 1000000
xrpl send --to rSomeAddr --amount 50 --token USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B

# Issue and send an MPT
xrpl mpt-create --asset-scale 2 --can-transfer --metadata 4D79546F6B656E
xrpl mpt-authorize 00064D1C63CEBEB49FC20032206CE0F203138BFC59F1AC578
xrpl send --to rHolder --amount 100 --token mpt:00064D1C63CEBEB49FC20032206CE0F203138BFC59F1AC578

# Work with NFTs
xrpl nft-mint --taxon 0 --uri "ipfs://QmExample" --transfer-fee 5000
xrpl account-nfts rMyAccount
xrpl nft-offer-create 000800006... --amount 10 --token XRP --sell

# Create and use an AMM
xrpl amm-create --amount1 1000 --token1 XRP --amount2 1000 --token2 USD.rIssuer --trading-fee 500
xrpl amm-info --asset XRP --asset2 USD.rIssuer

# Query the order book
xrpl book-offers XRP USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B --limit 5

# Watch ledger events in real time
xrpl subscribe --streams ledger transactions

# Use the escape hatches for anything not covered
xrpl build Batch --RawTransactions '[...]'
xrpl rpc vault_info '{"vault_id": "..."}'
xrpl rpc server_state
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) (recommended) or npm

### Setup

```bash
git clone https://github.com/k4m4/xrpl-cli.git
cd xrpl-cli
pnpm install
```

### Building

```bash
pnpm build          # Build with tsup (ESM, node20 target)
pnpm dev -- <args>  # Run from source via tsx (e.g. pnpm dev -- balance rAddr)
pnpm lint           # Check with Biome (linting + formatting)
pnpm lint:fix       # Auto-fix lint and formatting issues
pnpm lint:md        # Check Markdown with markdownlint
pnpm lint:md:fix    # Auto-fix Markdown lint issues
pnpm format         # Format with Biome
```

### Testing

```bash
pnpm test           # Run unit tests (vitest)
pnpm test:watch     # Run unit tests in watch mode
pnpm test:coverage  # Run unit tests with coverage report
pnpm test:e2e       # Run E2E tests against testnet (requires network access)
```

**Unit tests** (fast, no network, run on every commit):

- Token notation parsing (XRP, IOU with standard/hex currency codes, MPT)
- Memo encoding (UTF-8, `hex:` prefix, mixed, edge cases)
- Fee calculation for multi-signing
- Config file and alias resolution
- Transaction JSON construction for each command
- Response formatting (human-readable vs `--json`)

**E2E tests** (against testnet/devnet, run on PR/nightly):

- Each E2E test funds fresh accounts via faucet to avoid interference
- Tests are grouped by feature and can run in parallel (each uses its own accounts)
- Devnet is used for amendment-gated features (MPTs, AMMs if needed)
- Tests verify both the transaction submission and the resulting ledger state
- CI budget: keep total e2e suite under 5 minutes by parallelizing account creation

### Project Structure

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
    ├── schemas.ts        # Zod schemas for input validation
    ├── tokens.ts         # Token notation parser
    ├── tx.ts             # Shared transaction helpers
    ├── validate.ts       # Composable validation helpers
    └── wallet.ts         # Wallet loading from seed/keyfile
test/
├── *.test.ts             # Unit tests
└── e2e/                  # E2E tests (testnet)
```

### Code Style

- [Biome](https://biomejs.dev/) for linting and formatting
- Tabs for indentation, double quotes
- ESM-only (`"type": "module"`)

## Contributing

Contributions are welcome! Please:

1. Fork the repo and create a feature branch
2. Make your changes and add tests where appropriate
3. Ensure `pnpm lint` and `pnpm test` pass
4. Open a pull request

## Roadmap

Features that aren't planned for the initial release but worth exploring later:

- **`watch` mode** — poll a command at an interval and stream changes, e.g. `xrpl watch balance rAddr --interval 5s`. Useful for scripting and monitoring.
- **`wallet sign-message` / `verify-message`** — sign and verify arbitrary data (not transactions). Useful for off-chain proof-of-ownership.
- **Persistent wallet store** (`wallet import`, `wallet list`, `wallet remove`) — encrypted local keystore as an alternative to `--seed` / `XRPL_SEED` env var for frequent use.
- **`wallet vanity`** — generate a vanity address matching a prefix/suffix pattern (e.g. `xrpl wallet vanity --starts-with rXRP`).
- **Ledger hardware wallet signing** — sign transactions using a connected Ledger device, as an alternative to providing a seed or keyfile.
- **AI agent compatibility** — make the CLI easy for AI agents to use via an [MCP](https://modelcontextprotocol.io/) server and agent-facing files (`SKILL.md`, `CLAUDE.md`, etc.). The `--json` flag already makes output agent-friendly; MCP would add schema discovery and structured tool calls.

## License

MIT

## Disclaimer

> [!CAUTION]
> This is an independent, community-built tool. It is **not** officially supported, endorsed, or maintained by Ripple, the XRP Ledger Foundation (XRPLF), or any affiliated organization. Use at your own risk.

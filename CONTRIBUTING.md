# Contributing

Contributions are welcome! Please:

1. Fork the repo and create a feature branch
2. Make your changes and add tests where appropriate
3. Run `pnpm ci` to validate (lint, typecheck, test, build)
4. Open a pull request

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
    ├── schemas.ts        # Zod schemas for input validation
    ├── tokens.ts         # Token notation parser
    ├── tx.ts             # Shared transaction helpers
    ├── validate.ts       # Composable validation helpers
    └── wallet.ts         # Wallet loading from seed/keyfile
test/
├── *.test.ts             # Unit tests
└── e2e/                  # E2E tests (testnet)
```

## Code Style

- [Biome](https://biomejs.dev/) for linting and formatting
- Tabs for indentation, double quotes
- ESM-only (`"type": "module"`)

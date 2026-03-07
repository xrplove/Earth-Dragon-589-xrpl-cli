# Examples

Real-world usage examples for common XRPL workflows.

## Basic Workflow

```bash
# Full flow: generate wallet, fund it, send a payment
xrpl wallet generate
export XRPL_SEED=sEdV...
xrpl wallet fund --network testnet
xrpl send --to ra5nK24KXen9AHvsdFTKHSANinZseWnPcX --amount 25 --token XRP --network testnet
```

## Multi-Signing

```bash
# Set up a multisig account
xrpl signer-list-set --quorum 3 \
  --signer rAddr1:1 --signer rAddr2:1 --signer rAddr3:1 --signer rAddr4:1
xrpl account-set --flag asfDisableMaster

# Multi-sign a payment from the multisig
xrpl send --to rSomeAddr --amount 10 --token XRP --prepare --signers 3 > unsigned.json
XRPL_SEED=sSigner1... xrpl multisign --file unsigned.json --multisig-account rMultisig > sig1.json
XRPL_SEED=sSigner2... xrpl multisign --file unsigned.json --multisig-account rMultisig > sig2.json
XRPL_SEED=sSigner3... xrpl multisign --file unsigned.json --multisig-account rMultisig > sig3.json
xrpl multisign-submit --files sig1.json sig2.json sig3.json

# Create 250 tickets for parallel multisig prover transactions
xrpl ticket-create 250
```

## Trust Lines and IOUs

```bash
# Create a trust line, then send an IOU
xrpl trust-set USD rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B --limit 1000000
xrpl send --to rSomeAddr --amount 50 --token USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B
```

## Multi-Purpose Tokens

```bash
# Issue and send an MPT
xrpl mpt-create --asset-scale 2 --can-transfer --metadata 4D79546F6B656E
xrpl mpt-authorize 00064D1C63CEBEB49FC20032206CE0F203138BFC59F1AC578
xrpl send --to rHolder --amount 100 --token mpt:00064D1C63CEBEB49FC20032206CE0F203138BFC59F1AC578
```

## NFTs

```bash
# Work with NFTs
xrpl nft-mint --taxon 0 --uri "ipfs://QmExample" --transfer-fee 5000
xrpl account-nfts rMyAccount
xrpl nft-offer-create 000800006... --amount 10 --token XRP --sell
```

## AMM

```bash
# Create and use an AMM
xrpl amm-create --amount1 1000 --token1 XRP --amount2 1000 --token2 USD.rIssuer --trading-fee 500
xrpl amm-info --asset XRP --asset2 USD.rIssuer
```

## DEX

```bash
# Query the order book
xrpl book-offers XRP USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B --limit 5
```

## Real-Time Events

```bash
# Watch ledger events in real time
xrpl subscribe --streams ledger transactions
```

## Escape Hatches

```bash
# Use the escape hatches for anything not covered
xrpl build Batch --RawTransactions '[...]'
xrpl rpc vault_info '{"vault_id": "..."}'
xrpl rpc server_state
```

## Cross-Chain Memos

```bash
# Send with memos (e.g. for Axelar interchain transfers)
xrpl send --to ra5nK24KXen9AHvsdFTKHSANinZseWnPcX --amount 1 --token XRP \
  --memo "type:interchain_transfer" \
  --memo "destination_chain:ethereum" \
  --memo "destination_address:0x0A90c0Af1B07f6AC34f3520348Dbfae73BDa358E"
```

## Keystore Workflow

```bash
# Import and use a keystore wallet
xrpl wallet import alice -i
xrpl wallet list
xrpl balance rMyAccount --from alice
xrpl send --to rDest --amount 10 --token XRP --from alice
```

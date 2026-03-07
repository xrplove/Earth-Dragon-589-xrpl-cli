# Configuration

## Environment Variables

| Variable             | Description                                      |
|----------------------|--------------------------------------------------|
| `XRPL_SEED`          | Default wallet seed for signing                  |
| `XRPL_KEYFILE`       | Default path to a JSON keyfile containing the seed |
| `XRPL_FROM`          | Default keystore wallet name (used with `--from`) |
| `XRPL_PASSWORD_FILE` | Path to keystore password file                   |
| `XRPL_NETWORK`       | Default network (`mainnet`, `testnet`, `devnet`) |
| `XRPL_RPC_URL`       | Default WebSocket RPC URL                        |

## Configuration File

`xrpl` reads configuration from the first file found (in order):

1. `$XDG_CONFIG_HOME/xrpl/config.toml` (typically `~/.config/xrpl/config.toml`)
2. `~/.xrplrc`

```toml
network = "testnet"
rpc_url = "wss://s.altnet.rippletest.net:51233"

[aliases]
myaccount = "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX"
gateway = "rGAbJZEzU6WaYv5y1LfyN7LBBcQJ3TxsKC"
```

Aliases can be used anywhere an account address is expected:

```bash
xrpl balance myaccount
xrpl send --to gateway --amount 10 --token XRP
```

## Exit Codes

| Code | Meaning                                              |
|------|------------------------------------------------------|
| 0    | Success                                              |
| 1    | General error                                        |
| 2    | Invalid arguments / usage error                      |
| 3    | Network / connection error                           |
| 4    | Transaction rejected (e.g. `tec*` result codes)      |
| 5    | Transaction expired (past `LastLedgerSequence`)       |

## Shell Completions

Generate shell completion scripts with:

```bash
# Bash
xrpl completions bash > ~/.local/share/bash-completion/completions/xrpl

# Zsh (make sure ~/.zfunc is in your fpath)
xrpl completions zsh > ~/.zfunc/_xrpl

# Fish
xrpl completions fish > ~/.config/fish/completions/xrpl.fish
```

Restart your shell or source the file for completions to take effect.

## Amendments

The XRPL uses an [amendment system](https://xrpl.org/docs/concepts/networks-and-servers/amendments) to introduce new features. Different networks have different amendments enabled — Devnet typically has experimental amendments, Testnet mirrors Mainnet, and Mainnet only enables amendments after a 2-week validator supermajority vote.

`xrpl` makes all commands available regardless of the connected network. If you use a command that requires an amendment not enabled on the connected network, the transaction will be rejected by `rippled` with a clear error (e.g. `temDISABLED`). The CLI does not gate features client-side — the network is the source of truth.

Use `xrpl feature` to check what's enabled on your connected network:

```bash
xrpl feature --enabled --network devnet
xrpl feature MPTokensV1 --network mainnet
```

Commands that depend on non-core amendments note the requirement in their help text and in the [CLI reference](cli-reference.md) (e.g. "Requires amendment: **MPTokensV1**").

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

import type { Command } from "commander";
import { type ECDSA, Wallet } from "xrpl";
import { withClient } from "../lib/client.js";
import { output } from "../lib/output.js";
import { BASE_RESERVE_XRP, type GlobalOptions } from "../lib/types.js";

const ALGORITHMS: Record<string, ECDSA> = {
	ed25519: "ed25519" as ECDSA,
	secp256k1: "ecdsa-secp256k1" as ECDSA,
};

function parseAlgorithm(value: string): ECDSA {
	const algo = ALGORITHMS[value];
	if (!algo) {
		throw new Error(
			`Unknown algorithm "${value}". Expected: ed25519 or secp256k1`,
		);
	}
	return algo;
}

function formatWallet(wallet: Wallet): Record<string, string> {
	return {
		address: wallet.address,
		publicKey: wallet.publicKey,
		privateKey: wallet.privateKey,
		seed: wallet.seed ?? "",
	};
}

export function registerWalletCommands(program: Command) {
	const wallet = program
		.command("wallet")
		.description("Wallet management commands");

	wallet
		.command("generate")
		.description("Generate a new random XRPL keypair")
		.option(
			"--algorithm <algorithm>",
			"Key algorithm: ed25519 or secp256k1",
			"ed25519",
		)
		.action(async (opts: { algorithm: string }) => {
			const globalOpts = program.opts() as GlobalOptions;
			const w = Wallet.generate(parseAlgorithm(opts.algorithm));
			output(formatWallet(w), globalOpts);
		});

	wallet
		.command("from-seed")
		.description("Derive a wallet from an existing seed")
		.argument("<seed>", "Base58-encoded seed string")
		.option(
			"--algorithm <algorithm>",
			"Key algorithm: ed25519 or secp256k1",
			"ed25519",
		)
		.option("--master-address <address>", "Account this regular key signs for")
		.action(
			async (
				seed: string,
				opts: { algorithm: string; masterAddress?: string },
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				const w = Wallet.fromSeed(seed, {
					algorithm: parseAlgorithm(opts.algorithm),
					masterAddress: opts.masterAddress,
				});
				output(formatWallet(w), globalOpts);
			},
		);

	wallet
		.command("from-entropy")
		.description("Derive a wallet from raw entropy (16 bytes)")
		.argument("<hex-entropy>", "32-character hex string (16 bytes)")
		.option(
			"--algorithm <algorithm>",
			"Key algorithm: ed25519 or secp256k1",
			"ed25519",
		)
		.option("--master-address <address>", "Account this regular key signs for")
		.action(
			async (
				hexEntropy: string,
				opts: { algorithm: string; masterAddress?: string },
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				if (!/^[0-9A-Fa-f]{32}$/.test(hexEntropy)) {
					throw new Error(
						"Entropy must be exactly 32 hex characters (16 bytes).",
					);
				}
				const pairs = hexEntropy.match(/.{2}/g) ?? [];
				const bytes = Uint8Array.from(pairs.map((b) => Number.parseInt(b, 16)));
				const w = Wallet.fromEntropy(bytes, {
					algorithm: parseAlgorithm(opts.algorithm),
					masterAddress: opts.masterAddress,
				});
				output(formatWallet(w), globalOpts);
			},
		);

	wallet
		.command("fund")
		.description(
			"Fund a wallet using the testnet/devnet faucet. Generates a new wallet if no account is given.",
		)
		.option("--account <account>", "Account to fund")
		.option("--amount <amount>", "Amount of XRP to request")
		.option("--faucet-host <host>", "Custom faucet hostname")
		.option("--faucet-path <path>", "Custom faucet API path")
		.action(
			async (opts: {
				account?: string;
				amount?: string;
				faucetHost?: string;
				faucetPath?: string;
			}) => {
				const globalOpts = program.opts() as GlobalOptions;
				if (
					globalOpts.network !== "testnet" &&
					globalOpts.network !== "devnet"
				) {
					throw new Error(
						"Faucet is only available on testnet and devnet. Use --network testnet or --network devnet.",
					);
				}

				await withClient(globalOpts, async (client) => {
					const faucetOpts: Record<string, unknown> = {};
					if (opts.amount) faucetOpts.amount = opts.amount;
					if (opts.faucetHost) faucetOpts.faucetHost = opts.faucetHost;
					if (opts.faucetPath) faucetOpts.faucetPath = opts.faucetPath;

					const result = await client.fundWallet(null, faucetOpts);

					if (opts.account) {
						await client.submitAndWait(
							{
								TransactionType: "Payment",
								Account: result.wallet.address,
								Destination: opts.account,
								Amount: String(
									Math.floor((result.balance - BASE_RESERVE_XRP) * 1_000_000),
								),
							},
							{ autofill: true, wallet: result.wallet },
						);
						const balance = await client.getXrpBalance(opts.account);
						if (globalOpts.json) {
							output({ address: opts.account, balance }, globalOpts);
						} else {
							output(
								`Funded ${opts.account}\nBalance: ${balance} XRP`,
								globalOpts,
							);
						}
					} else {
						if (globalOpts.json) {
							output(
								{
									address: result.wallet.address,
									seed: result.wallet.seed,
									balance: result.balance,
								},
								globalOpts,
							);
						} else {
							const lines = [
								`Address: ${result.wallet.address}`,
								`Seed:    ${result.wallet.seed}`,
								`Balance: ${result.balance} XRP`,
							];
							output(lines.join("\n"), globalOpts);
						}
					}
				});
			},
		);
}

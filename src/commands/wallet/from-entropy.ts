import type { Command } from "commander";
import { Wallet } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";
import { formatWallet, parseAlgorithm } from "./shared.js";

async function deriveFromEntropy(
	hexEntropy: string,
	opts: { algorithm: string; masterAddress?: string },
	globalOpts: GlobalOptions,
) {
	if (!/^[0-9A-Fa-f]{32}$/.test(hexEntropy)) {
		throw new Error("Entropy must be exactly 32 hex characters (16 bytes).");
	}
	const pairs = hexEntropy.match(/.{2}/g) ?? [];
	const bytes = Uint8Array.from(pairs.map((b) => Number.parseInt(b, 16)));
	const w = Wallet.fromEntropy(bytes, {
		algorithm: parseAlgorithm(opts.algorithm),
		masterAddress: opts.masterAddress,
	});
	output(formatWallet(w), globalOpts);
}

export function registerFromEntropy(wallet: Command, program: Command) {
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
			(
				hexEntropy: string,
				opts: { algorithm: string; masterAddress?: string },
			) => deriveFromEntropy(hexEntropy, opts, program.opts() as GlobalOptions),
		);
}

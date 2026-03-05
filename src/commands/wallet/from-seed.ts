import type { Command } from "commander";
import { Wallet } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";
import { formatWallet, parseAlgorithm } from "./shared.js";

async function deriveFromSeed(
	seed: string,
	opts: { algorithm: string; masterAddress?: string },
	globalOpts: GlobalOptions,
) {
	const w = Wallet.fromSeed(seed, {
		algorithm: parseAlgorithm(opts.algorithm),
		masterAddress: opts.masterAddress,
	});
	output(formatWallet(w), globalOpts);
}

export function registerFromSeed(wallet: Command, program: Command) {
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
			(seed: string, opts: { algorithm: string; masterAddress?: string }) =>
				deriveFromSeed(seed, opts, program.opts() as GlobalOptions),
		);
}

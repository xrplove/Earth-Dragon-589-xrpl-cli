import type { Command } from "commander";
import { Wallet } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";
import { formatWallet, parseAlgorithm } from "./shared.js";

async function generateWallet(
	opts: { algorithm: string },
	globalOpts: GlobalOptions,
) {
	const w = Wallet.generate(parseAlgorithm(opts.algorithm));
	output(formatWallet(w), globalOpts);
}

export function registerGenerate(wallet: Command, program: Command) {
	wallet
		.command("generate")
		.description("Generate a new random XRPL keypair")
		.option(
			"--algorithm <algorithm>",
			"Key algorithm: ed25519 or secp256k1",
			"ed25519",
		)
		.action((opts: { algorithm: string }) =>
			generateWallet(opts, program.opts() as GlobalOptions),
		);
}

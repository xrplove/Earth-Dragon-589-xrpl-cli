import { type Command, Option } from "commander";
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
		.addOption(
			new Option("--algorithm <algorithm>", "Key algorithm")
				.choices(["ed25519", "secp256k1"])
				.default("ed25519"),
		)
		.action((opts: { algorithm: string }) =>
			generateWallet(opts, program.opts() as GlobalOptions),
		);
}

import type { Command } from "commander";
import { output } from "../../lib/output.js";
import { readTx } from "../../lib/tx-input.js";
import type { GlobalOptions } from "../../lib/types.js";
import { loadWallet } from "../../lib/wallet.js";
import { withWalletOptions } from "../../lib/wallet-options.js";

async function signTransaction(
	txJson: string | undefined,
	opts: { file?: string; multisign?: string | true },
	globalOpts: GlobalOptions,
) {
	const wallet = await loadWallet(globalOpts);
	const tx = readTx(txJson, opts.file);

	const multisign = opts.multisign != null;
	const signed = wallet.sign(tx, multisign);

	output(
		{
			tx_blob: signed.tx_blob,
			hash: signed.hash,
		},
		globalOpts,
	);
}

export function registerSign(program: Command) {
	const cmd = program
		.command("sign")
		.description("Sign a transaction (from JSON) without submitting")
		.argument("[tx-json]", "Transaction JSON as a string argument")
		.option("--file <path>", "Path to a JSON file containing the transaction")
		.option(
			"--multisign [account]",
			"Sign for multi-signing, optionally specify the multisig account",
		);
	withWalletOptions(cmd).action(
		(
			txJson: string | undefined,
			opts: { file?: string; multisign?: string | true },
		) => signTransaction(txJson, opts, cmd.optsWithGlobals() as GlobalOptions),
	);
}

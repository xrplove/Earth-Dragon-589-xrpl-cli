import { readFileSync } from "node:fs";
import type { Command } from "commander";
import type { Transaction } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";
import { loadWallet } from "../../lib/wallet.js";

async function signTransaction(
	txJson: string | undefined,
	opts: { file?: string; multisign?: string | true },
	globalOpts: GlobalOptions,
) {
	const wallet = loadWallet(globalOpts);

	let tx: Transaction;
	if (opts.file) {
		const raw = readFileSync(opts.file, "utf-8");
		tx = JSON.parse(raw);
	} else if (txJson) {
		tx = JSON.parse(txJson);
	} else {
		throw new Error("Provide transaction JSON as an argument or use --file.");
	}

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
	program
		.command("sign")
		.description("Sign a transaction (from JSON) without submitting")
		.argument("[tx-json]", "Transaction JSON as a string argument")
		.option("--file <path>", "Path to a JSON file containing the transaction")
		.option(
			"--multisign [account]",
			"Sign for multi-signing, optionally specify the multisig account",
		)
		.action(
			(
				txJson: string | undefined,
				opts: { file?: string; multisign?: string | true },
			) => signTransaction(txJson, opts, program.opts() as GlobalOptions),
		);
}

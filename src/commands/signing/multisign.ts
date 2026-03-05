import { readFileSync } from "node:fs";
import type { Command } from "commander";
import type { Transaction } from "xrpl";
import { decode } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";
import { loadWallet } from "../../lib/wallet.js";

function readTx(
	txJson: string | undefined,
	file: string | undefined,
): Transaction {
	if (file) {
		return JSON.parse(readFileSync(file, "utf-8"));
	}
	if (txJson) {
		return JSON.parse(txJson);
	}
	throw new Error("Provide transaction JSON as an argument or use --file.");
}

async function multisignTransaction(
	txJson: string | undefined,
	opts: { file?: string; account: string },
	globalOpts: GlobalOptions,
) {
	const wallet = loadWallet(globalOpts);
	const tx = readTx(txJson, opts.file);

	if (tx.SigningPubKey !== "") {
		throw new Error(
			'Transaction must have SigningPubKey: "" for multi-signing. Use --prepare or build.',
		);
	}

	const signed = wallet.sign(tx, true);
	const decoded = decode(signed.tx_blob) as Record<string, unknown>;
	const signers = decoded.Signers;

	output({ ...tx, Signers: signers }, globalOpts);
}

export function registerMultisign(program: Command) {
	program
		.command("multisign")
		.description("Add a signer's signature to a transaction for multi-signing")
		.argument("[tx-json]", "Transaction JSON as a string argument")
		.option("--file <path>", "Path to a JSON file containing the transaction")
		.requiredOption(
			"--account <address>",
			"The multisig account address this signature is for",
		)
		.action(
			(txJson: string | undefined, opts: { file?: string; account: string }) =>
				multisignTransaction(txJson, opts, program.opts() as GlobalOptions),
		);
}

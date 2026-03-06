import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { encode } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function encodeTxJson(
	txJson: string | undefined,
	opts: { file?: string },
	globalOpts: GlobalOptions,
) {
	let json: string;
	if (opts.file) {
		json = readFileSync(opts.file, "utf-8");
	} else if (txJson) {
		json = txJson;
	} else {
		throw new Error("Provide transaction JSON as an argument or use --file.");
	}
	const tx = JSON.parse(json);
	const blob = encode(tx);
	if (globalOpts.json) {
		output({ tx_blob: blob }, globalOpts);
	} else {
		output(blob, globalOpts);
	}
}

export function registerEncodeTx(program: Command) {
	program
		.command("encode-tx")
		.description("Encode transaction JSON into a binary blob (hex)")
		.argument("[tx-json]", "Transaction JSON as a string argument")
		.option("--file <path>", "Path to a JSON file containing the transaction")
		.action((txJson: string | undefined, opts: { file?: string }) =>
			encodeTxJson(txJson, opts, program.opts() as GlobalOptions),
		);
}

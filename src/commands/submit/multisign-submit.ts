import type { Command } from "commander";
import { encode, type Transaction } from "xrpl";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";
import { collectSigners } from "../signing/multisign-combine.js";

async function multisignSubmit(
	txJsonArgs: string[],
	opts: { files?: string[]; failHard: boolean },
	globalOpts: GlobalOptions,
) {
	const { baseTx, signers } = collectSigners(txJsonArgs, opts.files);
	const combined = { ...baseTx, Signers: signers };
	const txBlob = encode(combined as unknown as Transaction);

	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "submit",
			tx_blob: txBlob,
			fail_hard: opts.failHard || undefined,
		});
		output(resp.result, globalOpts);
	});
}

export function registerMultisignSubmit(program: Command) {
	program
		.command("multisign-submit")
		.description("Combine signatures and submit in one step")
		.argument("[signed-tx-json...]", "Signed transaction JSON strings")
		.option(
			"--files <paths...>",
			"Paths to JSON files containing signed transactions",
		)
		.option(
			"--fail-hard",
			"Fail immediately with tec-class errors instead of queuing",
			false,
		)
		.action(
			(txJsonArgs: string[], opts: { files?: string[]; failHard: boolean }) =>
				multisignSubmit(txJsonArgs, opts, program.opts() as GlobalOptions),
		);
}

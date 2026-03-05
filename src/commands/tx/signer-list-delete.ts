import type { Command } from "commander";
import type { Transaction } from "xrpl";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import { submitOrPrepare } from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { loadWallet } from "../../lib/wallet.js";

async function deleteSignerList(opts: TxOptions, globalOpts: GlobalOptions) {
	const wallet = opts.prepare ? null : loadWallet(globalOpts);

	const tx: Transaction = {
		TransactionType: "SignerListSet",
		Account: wallet?.address ?? "",
		SignerQuorum: 0,
		SignerEntries: [],
	} as unknown as Transaction;

	await withClient(globalOpts, async (client) => {
		if (!tx.Account) {
			throw new Error(
				"Account is required in --prepare mode. Use --seed, --keyfile, or set XRPL_SEED.",
			);
		}
		const result = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		output(result.mode === "prepared" ? result.tx : result.result, globalOpts);
	});
}

export function registerSignerListDelete(program: Command) {
	program
		.command("signer-list-delete")
		.description("Remove the signer list from an account")
		.option(
			"--prepare",
			"Output unsigned transaction JSON instead of submitting",
			false,
		)
		.option("--signers <n>", "Number of signers for multi-sign fee", Number)
		.option(
			"--memo <memo>",
			"Attach memo (repeatable)",
			(val: string, prev: string[]) => [...prev, val],
			[] as string[],
		)
		.option("--ticket <seq>", "Use a ticket instead of sequence number", Number)
		.action((opts: TxOptions) =>
			deleteSignerList(opts, program.opts() as GlobalOptions),
		);
}

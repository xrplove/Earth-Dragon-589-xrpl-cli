import type { Command } from "commander";
import type { Transaction } from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

async function deleteSignerList(opts: TxOptions, globalOpts: GlobalOptions) {
	const wallet = loadWalletForTx(opts, globalOpts);

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
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerSignerListDelete(program: Command) {
	const cmd = program
		.command("signer-list-delete")
		.description("Remove the signer list from an account");
	withTxOptions(cmd).action((opts: TxOptions) =>
		deleteSignerList(opts, program.opts() as GlobalOptions),
	);
}

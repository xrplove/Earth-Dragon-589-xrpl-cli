import type { Command } from "commander";
import type { SignerListSet } from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { withWalletOptions } from "../../lib/wallet-options.js";

async function deleteSignerList(opts: TxOptions, globalOpts: GlobalOptions) {
	const wallet = await loadWalletForTx(opts, globalOpts);

	const tx: Omit<SignerListSet, "Account"> = {
		TransactionType: "SignerListSet",
		SignerQuorum: 0,
		SignerEntries: [],
	};

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerSignerListDelete(program: Command) {
	const cmd = program
		.command("signer-list-delete")
		.description("Remove the signer list from an account");
	withWalletOptions(withTxOptions(cmd)).action((opts: TxOptions) =>
		deleteSignerList(opts, cmd.optsWithGlobals() as GlobalOptions),
	);
}

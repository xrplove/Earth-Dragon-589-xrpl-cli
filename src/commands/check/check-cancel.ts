import type { Command } from "commander";
import type { CheckCancel } from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

async function checkCancel(
	checkId: string,
	opts: TxOptions,
	globalOpts: GlobalOptions,
) {
	const tx: Omit<CheckCancel, "Account"> = {
		TransactionType: "CheckCancel",
		CheckID: checkId,
	};

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerCheckCancel(program: Command) {
	const cmd = program
		.command("check-cancel")
		.description("Cancel a check")
		.argument("<check-id>", "Check ID (64-char hex)");
	withTxOptions(cmd).action((checkId: string, opts: TxOptions) =>
		checkCancel(checkId, opts, program.opts() as GlobalOptions),
	);
}

import type { Command } from "commander";
import type { MPTokenIssuanceDestroy } from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

async function mptDestroy(
	mptIssuanceId: string,
	opts: TxOptions,
	globalOpts: GlobalOptions,
) {
	const tx: Omit<MPTokenIssuanceDestroy, "Account"> = {
		TransactionType: "MPTokenIssuanceDestroy",
		MPTokenIssuanceID: mptIssuanceId,
	};

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerMptDestroy(program: Command) {
	const cmd = program
		.command("mpt-destroy")
		.description("Destroy an MPT issuance (must have zero outstanding balance)")
		.argument("<mpt-issuance-id>", "MPT issuance ID (48-char hex)");
	withTxOptions(cmd).action((mptIssuanceId: string, opts: TxOptions) =>
		mptDestroy(mptIssuanceId, opts, program.opts() as GlobalOptions),
	);
}

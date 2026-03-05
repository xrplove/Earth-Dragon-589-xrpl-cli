import type { Command } from "commander";
import type { EscrowCancel } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

async function escrowCancel(
	owner: string,
	offerSequence: number,
	opts: TxOptions,
	globalOpts: GlobalOptions,
) {
	const tx: Omit<EscrowCancel, "Account"> = {
		TransactionType: "EscrowCancel",
		Owner: resolve(owner),
		OfferSequence: offerSequence,
	};

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerEscrowCancel(program: Command) {
	const cmd = program
		.command("escrow-cancel")
		.description("Cancel an expired escrow")
		.argument("<owner>", "Escrow owner address or alias")
		.argument("<offer-sequence>", "Sequence number of the EscrowCreate", Number);
	withTxOptions(cmd).action(
		(owner: string, offerSequence: number, opts: TxOptions) =>
			escrowCancel(owner, offerSequence, opts, program.opts() as GlobalOptions),
	);
}

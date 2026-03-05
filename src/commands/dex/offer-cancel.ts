import type { Command } from "commander";
import type { OfferCancel } from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validatePositiveInt } from "../../lib/validate.js";

interface OfferCancelOpts extends TxOptions {}

async function offerCancel(
	offerSequence: number,
	opts: OfferCancelOpts,
	globalOpts: GlobalOptions,
) {
	validatePositiveInt(offerSequence, "offer-sequence");

	const tx: Omit<OfferCancel, "Account"> = {
		TransactionType: "OfferCancel",
		OfferSequence: offerSequence,
	};

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerOfferCancel(program: Command) {
	const cmd = program
		.command("offer-cancel")
		.description("Cancel an existing DEX offer")
		.argument("<offer-sequence>", "Sequence number of the offer to cancel", Number);
	withTxOptions(cmd).action((offerSequence: number, opts: OfferCancelOpts) =>
		offerCancel(offerSequence, opts, program.opts() as GlobalOptions),
	);
}

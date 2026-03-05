import type { Command } from "commander";
import type { EscrowFinish } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

interface EscrowFinishOpts extends TxOptions {
	condition?: string;
	fulfillment?: string;
}

async function escrowFinish(
	owner: string,
	offerSequence: number,
	opts: EscrowFinishOpts,
	globalOpts: GlobalOptions,
) {
	const tx: Omit<EscrowFinish, "Account"> = {
		TransactionType: "EscrowFinish",
		Owner: resolve(owner),
		OfferSequence: offerSequence,
	};

	if (opts.condition) tx.Condition = opts.condition;
	if (opts.fulfillment) tx.Fulfillment = opts.fulfillment;

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerEscrowFinish(program: Command) {
	const cmd = program
		.command("escrow-finish")
		.description("Finish (release) an escrow")
		.argument("<owner>", "Escrow owner address or alias")
		.argument("<offer-sequence>", "Sequence number of the EscrowCreate", Number)
		.option("--condition <hex>", "Crypto-condition (hex)")
		.option("--fulfillment <hex>", "Crypto-condition fulfillment (hex)");
	withTxOptions(cmd).action(
		(owner: string, offerSequence: number, opts: EscrowFinishOpts) =>
			escrowFinish(owner, offerSequence, opts, program.opts() as GlobalOptions),
	);
}

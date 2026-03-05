import { type Command, Option } from "commander";
import { type OfferCreate, OfferCreateFlags } from "xrpl";
import { withClient } from "../../lib/client.js";
import { parseToken, toXrplAmount } from "../../lib/tokens.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

interface OfferCreateOpts extends TxOptions {
	takerPaysAmount: string;
	takerPaysToken: string;
	takerGetsAmount: string;
	takerGetsToken: string;
	expiration?: number;
	offerSequence?: number;
	passive: boolean;
	immediateOrCancel: boolean;
	fillOrKill: boolean;
	sell: boolean;
}

async function offerCreate(opts: OfferCreateOpts, globalOpts: GlobalOptions) {
	const paysToken = parseToken(opts.takerPaysToken);
	const getsToken = parseToken(opts.takerGetsToken);

	const tx: Omit<OfferCreate, "Account"> = {
		TransactionType: "OfferCreate",
		TakerPays: toXrplAmount(paysToken, opts.takerPaysAmount),
		TakerGets: toXrplAmount(getsToken, opts.takerGetsAmount),
	};

	if (opts.expiration != null) tx.Expiration = opts.expiration;
	if (opts.offerSequence != null) tx.OfferSequence = opts.offerSequence;

	let flags = 0;
	if (opts.passive) flags |= OfferCreateFlags.tfPassive;
	if (opts.immediateOrCancel) flags |= OfferCreateFlags.tfImmediateOrCancel;
	if (opts.fillOrKill) flags |= OfferCreateFlags.tfFillOrKill;
	if (opts.sell) flags |= OfferCreateFlags.tfSell;
	if (flags) tx.Flags = flags;

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerOfferCreate(program: Command) {
	const cmd = program
		.command("offer-create")
		.alias("offer")
		.description("Create a DEX offer")
		.requiredOption("--taker-pays-amount <amount>", "Amount the taker pays")
		.requiredOption(
			"--taker-pays-token <token>",
			"Token the taker pays: XRP, <currency>.<issuer>, or mpt:<id>",
		)
		.requiredOption("--taker-gets-amount <amount>", "Amount the taker gets")
		.requiredOption(
			"--taker-gets-token <token>",
			"Token the taker gets: XRP, <currency>.<issuer>, or mpt:<id>",
		)
		.option(
			"--expiration <ripple-time>",
			"Offer expiration (Ripple epoch)",
			Number,
		)
		.option(
			"--offer-sequence <seq>",
			"Replace an existing offer by sequence",
			Number,
		)
		.addOption(new Option("--passive", "Create a passive offer").default(false))
		.addOption(
			new Option("--immediate-or-cancel", "Fill what you can, cancel the rest")
				.default(false)
				.conflicts("fillOrKill"),
		)
		.addOption(
			new Option("--fill-or-kill", "Fill entirely or cancel")
				.default(false)
				.conflicts("immediateOrCancel"),
		)
		.option("--sell", "Sell the full TakerGets amount", false);
	withTxOptions(cmd).action((opts: OfferCreateOpts) =>
		offerCreate(opts, program.opts() as GlobalOptions),
	);
}

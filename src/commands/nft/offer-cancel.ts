import type { Command } from "commander";
import type { NFTokenCancelOffer } from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validateHex64 } from "../../lib/validate.js";
import { withWalletOptions } from "../../lib/wallet-options.js";

async function nftOfferCancel(
	offerIds: string[],
	opts: TxOptions,
	globalOpts: GlobalOptions,
) {
	for (const id of offerIds) validateHex64(id, "offer ID");

	const tx: Omit<NFTokenCancelOffer, "Account"> = {
		TransactionType: "NFTokenCancelOffer",
		NFTokenOffers: offerIds,
	};

	const wallet = await loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerNftOfferCancel(program: Command) {
	const cmd = program
		.command("nft-offer-cancel")
		.description("Cancel one or more NFT offers")
		.argument("<offer-ids...>", "Offer ID(s) to cancel");
	withWalletOptions(withTxOptions(cmd)).action(
		(offerIds: string[], opts: TxOptions) =>
			nftOfferCancel(offerIds, opts, cmd.optsWithGlobals() as GlobalOptions),
	);
}

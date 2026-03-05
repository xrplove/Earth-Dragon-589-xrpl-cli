import { type Command, Option } from "commander";
import type { Amount, NFTokenAcceptOffer } from "xrpl";
import { withClient } from "../../lib/client.js";
import { parseToken, toXrplAmount } from "../../lib/tokens.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

interface NftOfferAcceptOpts extends TxOptions {
	sellOffer?: string;
	buyOffer?: string;
	brokerFeeAmount?: string;
	brokerFeeToken?: string;
}

async function nftOfferAccept(
	opts: NftOfferAcceptOpts,
	globalOpts: GlobalOptions,
) {
	const tx: Omit<NFTokenAcceptOffer, "Account"> = {
		TransactionType: "NFTokenAcceptOffer",
	};

	if (opts.sellOffer) tx.NFTokenSellOffer = opts.sellOffer;
	if (opts.buyOffer) tx.NFTokenBuyOffer = opts.buyOffer;
	if (opts.brokerFeeAmount && opts.brokerFeeToken) {
		tx.NFTokenBrokerFee = toXrplAmount(
			parseToken(opts.brokerFeeToken),
			opts.brokerFeeAmount,
		) as Amount;
	}

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerNftOfferAccept(program: Command) {
	const cmd = program
		.command("nft-offer-accept")
		.description("Accept an NFT buy or sell offer")
		.option("--sell-offer <id>", "Sell offer ID to accept")
		.option("--buy-offer <id>", "Buy offer ID to accept")
		.option("--broker-fee-amount <amount>", "Broker fee amount")
		.option("--broker-fee-token <token>", "Token for broker fee");
	withTxOptions(cmd).action((opts: NftOfferAcceptOpts) =>
		nftOfferAccept(opts, program.opts() as GlobalOptions),
	);
}

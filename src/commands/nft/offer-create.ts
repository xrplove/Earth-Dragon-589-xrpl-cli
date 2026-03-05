import { type Command, Option } from "commander";
import {
	NFTokenCreateOfferFlags,
	type Amount,
	type NFTokenCreateOffer,
} from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { parseToken, toXrplAmount } from "../../lib/tokens.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validateHex64 } from "../../lib/validate.js";

interface NftOfferCreateOpts extends TxOptions {
	amount: string;
	token: string;
	owner?: string;
	expiration?: number;
	destination?: string;
	sell: boolean;
}

async function nftOfferCreate(
	nftokenId: string,
	opts: NftOfferCreateOpts,
	globalOpts: GlobalOptions,
) {
	validateHex64(nftokenId, "NFToken ID");

	const tx: Omit<NFTokenCreateOffer, "Account"> = {
		TransactionType: "NFTokenCreateOffer",
		NFTokenID: nftokenId,
		Amount: toXrplAmount(parseToken(opts.token), opts.amount) as Amount,
	};

	if (opts.owner) tx.Owner = resolve(opts.owner);
	if (opts.expiration != null) tx.Expiration = opts.expiration;
	if (opts.destination) tx.Destination = resolve(opts.destination);
	if (opts.sell) tx.Flags = NFTokenCreateOfferFlags.tfSellNFToken;

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerNftOfferCreate(program: Command) {
	const cmd = program
		.command("nft-offer-create")
		.description("Create an offer to buy or sell an NFT")
		.argument("<nftoken-id>", "NFToken ID (64-char hex)")
		.requiredOption("--amount <amount>", "Offer amount")
		.requiredOption("--token <token>", "Token: XRP or <currency>.<issuer>")
		.option("--owner <address>", "NFT owner (required for buy offers)")
		.option("--expiration <ripple-time>", "Offer expiration (Ripple epoch)", Number)
		.option("--destination <address>", "Only this account can accept the offer")
		.option("--sell", "Create a sell offer (default is buy)", false);
	withTxOptions(cmd).action((nftokenId: string, opts: NftOfferCreateOpts) =>
		nftOfferCreate(nftokenId, opts, program.opts() as GlobalOptions),
	);
}

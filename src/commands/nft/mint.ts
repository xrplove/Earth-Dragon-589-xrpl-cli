import type { Command } from "commander";
import { type Amount, type NFTokenMint, NFTokenMintFlags } from "xrpl";
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
import { validateOptionalRange } from "../../lib/validate.js";

interface NftMintOpts extends TxOptions {
	taxon: number;
	issuer?: string;
	transferFee?: number;
	uri?: string;
	amount?: string;
	amountToken?: string;
	expiration?: number;
	destination?: string;
	burnable: boolean;
	onlyXrp: boolean;
	trustLine: boolean;
	transferable: boolean;
	mutable: boolean;
}

async function nftMint(opts: NftMintOpts, globalOpts: GlobalOptions) {
	validateOptionalRange(opts.transferFee, 0, 50000, "transfer-fee");

	const tx: Omit<NFTokenMint, "Account"> = {
		TransactionType: "NFTokenMint",
		NFTokenTaxon: opts.taxon,
	};

	if (opts.issuer) tx.Issuer = resolve(opts.issuer);
	if (opts.transferFee != null) tx.TransferFee = opts.transferFee;
	if (opts.uri)
		tx.URI = Buffer.from(opts.uri, "utf-8").toString("hex").toUpperCase();
	if (opts.amount && opts.amountToken) {
		tx.Amount = toXrplAmount(
			parseToken(opts.amountToken),
			opts.amount,
		) as Amount;
	}
	if (opts.expiration != null) tx.Expiration = opts.expiration;
	if (opts.destination) tx.Destination = resolve(opts.destination);

	let flags = 0;
	if (opts.burnable) flags |= NFTokenMintFlags.tfBurnable;
	if (opts.onlyXrp) flags |= NFTokenMintFlags.tfOnlyXRP;
	if (opts.trustLine) flags |= NFTokenMintFlags.tfTrustLine;
	if (opts.transferable) flags |= NFTokenMintFlags.tfTransferable;
	if (opts.mutable) flags |= NFTokenMintFlags.tfMutable;
	if (flags) tx.Flags = flags;

	const wallet = await loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerNftMint(program: Command) {
	const cmd = program
		.command("nft-mint")
		.description("Mint a new NFT")
		.requiredOption("--taxon <n>", "NFToken taxon (grouping value)", Number)
		.option("--issuer <address>", "Issuer account (for authorized minting)")
		.option(
			"--transfer-fee <fee>",
			"Transfer fee (0-50000, in 1/100000ths)",
			Number,
		)
		.option("--uri <uri>", "URI for token data (will be hex-encoded)")
		.option("--amount <amount>", "Amount for mint-and-sell offer")
		.option("--amount-token <token>", "Token for --amount")
		.option("--expiration <ripple-time>", "Sell offer expiration", Number)
		.option("--destination <address>", "Destination for mint-and-sell offer")
		.option("--burnable", "Allow issuer to burn this NFT", false)
		.option("--only-xrp", "Only allow XRP for offers", false)
		.option("--trust-line", "Allow trust line for transfer fees", false)
		.option(
			"--transferable",
			"Allow transfers between non-issuer accounts",
			false,
		)
		.option("--mutable", "Allow issuer to modify the URI", false);
	withTxOptions(cmd).action((opts: NftMintOpts) =>
		nftMint(opts, program.opts() as GlobalOptions),
	);
}

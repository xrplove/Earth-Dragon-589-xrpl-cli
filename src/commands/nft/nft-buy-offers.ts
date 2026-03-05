import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";
import { validateHex64 } from "../../lib/validate.js";

interface NftBuyOffersOpts {
	limit?: number;
	marker?: string;
	ledgerIndex: string;
}

async function nftBuyOffers(
	nftokenId: string,
	opts: NftBuyOffersOpts,
	globalOpts: GlobalOptions,
) {
	validateHex64(nftokenId, "NFToken ID");

	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "nft_buy_offers",
			nft_id: nftokenId,
			limit: opts.limit,
			marker: opts.marker,
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		});
		output(resp.result, globalOpts);
	});
}

export function registerNftBuyOffers(program: Command) {
	program
		.command("nft-buy-offers")
		.description("List buy offers for an NFT")
		.argument("<nftoken-id>", "NFToken ID (64-char hex)")
		.option("--limit <n>", "Max offers to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action((nftokenId: string, opts: NftBuyOffersOpts) =>
			nftBuyOffers(nftokenId, opts, program.opts() as GlobalOptions),
		);
}

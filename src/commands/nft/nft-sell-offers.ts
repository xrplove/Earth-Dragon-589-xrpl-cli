import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

interface NftSellOffersOpts {
	limit?: number;
	marker?: string;
	ledgerIndex: string;
}

async function nftSellOffers(
	nftokenId: string,
	opts: NftSellOffersOpts,
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "nft_sell_offers",
			nft_id: nftokenId,
			limit: opts.limit,
			marker: opts.marker,
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		});
		output(resp.result, globalOpts);
	});
}

export function registerNftSellOffers(program: Command) {
	program
		.command("nft-sell-offers")
		.description("List sell offers for an NFT")
		.argument("<nftoken-id>", "NFToken ID (64-char hex)")
		.option("--limit <n>", "Max offers to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action((nftokenId: string, opts: NftSellOffersOpts) =>
			nftSellOffers(nftokenId, opts, program.opts() as GlobalOptions),
		);
}

import type { Command } from "commander";
import type { BookOfferCurrency } from "xrpl";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import { parseToken } from "../../lib/tokens.js";
import type { GlobalOptions } from "../../lib/types.js";

function toCurrencySpec(spec: string): BookOfferCurrency {
	const token = parseToken(spec);
	if (token.type === "xrp") return { currency: "XRP" };
	if (token.type === "iou")
		return { currency: token.currency, issuer: token.issuer };
	throw new Error("book-offers does not support MPT tokens");
}

interface BookOffersOpts {
	limit?: number;
	taker?: string;
	ledgerIndex: string;
}

async function bookOffers(
	takerPaysSpec: string,
	takerGetsSpec: string,
	opts: BookOffersOpts,
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "book_offers",
			taker_pays: toCurrencySpec(takerPaysSpec),
			taker_gets: toCurrencySpec(takerGetsSpec),
			limit: opts.limit,
			taker: opts.taker,
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		});
		output(resp.result, globalOpts);
	});
}

export function registerBookOffers(program: Command) {
	program
		.command("book-offers")
		.alias("order-book")
		.description("Get DEX order book for a currency pair")
		.argument("<taker-pays>", "Token the taker pays: XRP or <currency>.<issuer>")
		.argument("<taker-gets>", "Token the taker gets: XRP or <currency>.<issuer>")
		.option("--limit <n>", "Max offers to return", Number)
		.option("--taker <address>", "Address of prospective taker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			(
				takerPays: string,
				takerGets: string,
				opts: BookOffersOpts,
			) =>
				bookOffers(takerPays, takerGets, opts, program.opts() as GlobalOptions),
		);
}

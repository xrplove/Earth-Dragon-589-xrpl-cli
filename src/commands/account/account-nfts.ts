import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

interface AccountNftsOpts {
	limit?: number;
	marker?: string;
	ledgerIndex: string;
}

async function fetchAccountNfts(
	account: string,
	opts: AccountNftsOpts,
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "account_nfts",
			account: resolve(account),
			limit: opts.limit,
			marker: opts.marker,
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		});
		output(resp.result, globalOpts);
	});
}

export function registerAccountNfts(program: Command) {
	program
		.command("account-nfts")
		.alias("nfts")
		.description("Get NFTs owned by an account")
		.argument("<account>", "Account address or alias")
		.option("--limit <n>", "Max NFTs to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action((account: string, opts: AccountNftsOpts) =>
			fetchAccountNfts(account, opts, program.opts() as GlobalOptions),
		);
}

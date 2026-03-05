import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerAccountOffers(program: Command) {
	program
		.command("account-offers")
		.alias("offers")
		.description("Get open DEX offers for an account")
		.argument("<account>", "Account address or alias")
		.option("--limit <n>", "Max offers to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			async (
				account: string,
				opts: {
					limit?: number;
					marker?: string;
					ledgerIndex: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "account_offers",
						account: resolve(account),
						limit: opts.limit,
						marker: opts.marker,
						ledger_index: parseLedgerIndex(opts.ledgerIndex),
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);
}

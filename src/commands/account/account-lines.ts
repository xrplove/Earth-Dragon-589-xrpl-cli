import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerAccountLines(program: Command) {
	program
		.command("account-lines")
		.alias("lines")
		.description("Get trust lines for an account")
		.argument("<account>", "Account address or alias")
		.option(
			"--counterparty <address>",
			"Filter by counterparty (alias: --peer)",
		)
		.option("--peer <address>", "Alias for --counterparty")
		.option("--limit <n>", "Max lines to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			async (
				account: string,
				opts: {
					counterparty?: string;
					peer?: string;
					limit?: number;
					marker?: string;
					ledgerIndex: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				const peer = opts.counterparty ?? opts.peer;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "account_lines",
						account: resolve(account),
						peer: peer ? resolve(peer) : undefined,
						limit: opts.limit,
						marker: opts.marker,
						ledger_index: parseLedgerIndex(opts.ledgerIndex),
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);
}

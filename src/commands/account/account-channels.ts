import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

interface AccountChannelsOpts {
	destination?: string;
	limit?: number;
	marker?: string;
	ledgerIndex: string;
}

async function fetchAccountChannels(
	account: string,
	opts: AccountChannelsOpts,
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "account_channels",
			account: resolve(account),
			destination_account: opts.destination
				? resolve(opts.destination)
				: undefined,
			limit: opts.limit,
			marker: opts.marker,
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		} as never);
		output(resp.result, globalOpts);
	});
}

export function registerAccountChannels(program: Command) {
	program
		.command("account-channels")
		.alias("channels")
		.description("Get payment channels where the account is the source")
		.argument("<account>", "Account address or alias")
		.option("--destination <address>", "Filter by destination account")
		.option("--limit <n>", "Max channels to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action((account: string, opts: AccountChannelsOpts) =>
			fetchAccountChannels(account, opts, program.opts() as GlobalOptions),
		);
}

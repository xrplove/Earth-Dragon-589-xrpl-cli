import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

interface AccountObjectsOpts {
	type?: string;
	limit?: number;
	marker?: string;
	ledgerIndex: string;
}

async function fetchAccountObjects(
	account: string,
	opts: AccountObjectsOpts,
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "account_objects",
			account: resolve(account),
			type: opts.type,
			limit: opts.limit,
			marker: opts.marker,
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		} as never);
		output(resp.result, globalOpts);
	});
}

export function registerAccountObjects(program: Command) {
	program
		.command("account-objects")
		.alias("objects")
		.description("Get objects owned by an account")
		.argument("<account>", "Account address or alias")
		.option("--type <type>", "Filter by object type")
		.option("--limit <n>", "Max objects to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action((account: string, opts: AccountObjectsOpts) =>
			fetchAccountObjects(account, opts, program.opts() as GlobalOptions),
		);
}

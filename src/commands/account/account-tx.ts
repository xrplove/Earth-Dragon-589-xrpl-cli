import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

interface AccountTxOpts {
	limit?: number;
	forward: boolean;
	ledgerIndexMin?: number;
	ledgerIndexMax?: number;
	marker?: string;
}

async function fetchAccountTx(
	account: string,
	opts: AccountTxOpts,
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "account_tx",
			account: resolve(account),
			limit: opts.limit,
			forward: opts.forward || undefined,
			ledger_index_min: opts.ledgerIndexMin,
			ledger_index_max: opts.ledgerIndexMax,
			marker: opts.marker,
		} as never);
		output(resp.result, globalOpts);
	});
}

export function registerAccountTx(program: Command) {
	program
		.command("account-tx")
		.description("Get transaction history for an account")
		.argument("<account>", "Account address or alias")
		.option("--limit <n>", "Max transactions to return", Number)
		.option("--forward", "Return results oldest first", false)
		.option("--ledger-index-min <n>", "Earliest ledger to search", Number)
		.option("--ledger-index-max <n>", "Latest ledger to search", Number)
		.option("--marker <marker>", "Pagination marker")
		.action((account: string, opts: AccountTxOpts) =>
			fetchAccountTx(account, opts, program.opts() as GlobalOptions),
		);
}

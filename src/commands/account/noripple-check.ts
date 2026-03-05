import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

interface NorippleCheckOpts {
	role: string;
	transactions: boolean;
	limit?: number;
	ledgerIndex: string;
}

async function checkNoripple(
	account: string,
	opts: NorippleCheckOpts,
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "noripple_check",
			account: resolve(account),
			role: opts.role as "gateway" | "user",
			transactions: opts.transactions || undefined,
			limit: opts.limit,
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		});
		output(resp.result, globalOpts);
	});
}

export function registerNorippleCheck(program: Command) {
	program
		.command("noripple-check")
		.description("Get recommended changes to NoRipple settings")
		.argument("<account>", "Account address or alias")
		.option("--role <role>", "Account role: gateway or user", "user")
		.option("--transactions", "Include suggested fix transactions", false)
		.option("--limit <n>", "Max trust line problems to include", Number)
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action((account: string, opts: NorippleCheckOpts) =>
			checkNoripple(account, opts, program.opts() as GlobalOptions),
		);
}

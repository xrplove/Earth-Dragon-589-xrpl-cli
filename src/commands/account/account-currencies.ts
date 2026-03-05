import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

async function fetchAccountCurrencies(
	account: string,
	opts: { ledgerIndex: string },
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "account_currencies",
			account: resolve(account),
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		});
		output(resp.result, globalOpts);
	});
}

export function registerAccountCurrencies(program: Command) {
	program
		.command("account-currencies")
		.alias("currencies")
		.description("Get currencies an account can send or receive")
		.argument("<account>", "Account address or alias")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action((account: string, opts: { ledgerIndex: string }) =>
			fetchAccountCurrencies(account, opts, program.opts() as GlobalOptions),
		);
}

import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

async function listTickets(
	account: string,
	opts: { ledgerIndex: string },
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "account_objects",
			account: resolve(account),
			type: "ticket",
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		});
		output(resp.result.account_objects, globalOpts);
	});
}

export function registerTickets(program: Command) {
	program
		.command("tickets")
		.description("List available tickets for an account")
		.argument("<account>", "Account address or alias")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action((account: string, opts: { ledgerIndex: string }) =>
			listTickets(account, opts, program.opts() as GlobalOptions),
		);
}

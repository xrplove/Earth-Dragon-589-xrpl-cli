import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

interface LedgerEntryOpts {
	ledgerIndex: string;
}

async function ledgerEntry(
	index: string,
	opts: LedgerEntryOpts,
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "ledger_entry",
			index,
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		});
		output(resp.result, globalOpts);
	});
}

export function registerLedgerEntry(program: Command) {
	program
		.command("ledger-entry")
		.description("Get a single ledger entry by index")
		.argument("<index>", "Ledger entry index (64-char hex)")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action((index: string, opts: LedgerEntryOpts) =>
			ledgerEntry(index, opts, program.opts() as GlobalOptions),
		);
}

import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

interface LedgerDataOpts {
	binary: boolean;
	limit?: number;
	marker?: string;
	type?: string;
	ledgerIndex: string;
}

async function ledgerData(opts: LedgerDataOpts, globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "ledger_data",
			binary: opts.binary || undefined,
			limit: opts.limit,
			marker: opts.marker,
			type: opts.type as never,
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		});
		output(resp.result, globalOpts);
	});
}

export function registerLedgerData(program: Command) {
	program
		.command("ledger-data")
		.description("Get raw ledger state data")
		.option("--binary", "Return data in binary format", false)
		.option("--limit <n>", "Max entries to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--type <type>", "Filter by ledger entry type")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action((opts: LedgerDataOpts) =>
			ledgerData(opts, program.opts() as GlobalOptions),
		);
}

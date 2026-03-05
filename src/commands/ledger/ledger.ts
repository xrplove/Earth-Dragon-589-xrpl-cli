import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

interface LedgerOpts {
	index: string;
	hash?: string;
	transactions: boolean;
	expand: boolean;
}

async function fetchLedger(opts: LedgerOpts, globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const req: Record<string, unknown> = {
			command: "ledger",
			transactions: opts.transactions || undefined,
			expand: opts.expand || undefined,
		};
		if (opts.hash) {
			req.ledger_hash = opts.hash;
		} else {
			req.ledger_index = parseLedgerIndex(opts.index);
		}
		const resp = await client.request(req as never);
		output(resp.result, globalOpts);
	});
}

export function registerLedgerCommand(program: Command) {
	program
		.command("ledger")
		.description("Get information about a ledger")
		.option("--index <index>", "Ledger index or shortcut", "validated")
		.option("--hash <hash>", "Ledger hash (64-char hex)")
		.option("--transactions", "Include transaction hashes", false)
		.option("--expand", "Expand transactions to full JSON", false)
		.action((opts: LedgerOpts) =>
			fetchLedger(opts, program.opts() as GlobalOptions),
		);
}

import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function fetchLedgerIndex(globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "ledger",
			ledger_index: "validated",
		});
		const index = resp.result.ledger_index;
		if (globalOpts.json) {
			output({ ledger_index: index }, globalOpts);
		} else {
			output(String(index), globalOpts);
		}
	});
}

export function registerLedgerIndexCommand(program: Command) {
	program
		.command("ledger-index")
		.description("Get the latest validated ledger index")
		.action(() => fetchLedgerIndex(program.opts() as GlobalOptions));
}

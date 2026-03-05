import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function fetchFee(globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({ command: "fee" });
		if (globalOpts.json) {
			output(resp.result, globalOpts);
		} else {
			output(`${resp.result.drops.open_ledger_fee} drops`, globalOpts);
		}
	});
}

export function registerFeeCommand(program: Command) {
	program
		.command("fee")
		.description("Get the current transaction fee")
		.action(() => fetchFee(program.opts() as GlobalOptions));
}

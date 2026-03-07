import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function fetchNonce(account: string, globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "account_info",
			account: resolve(account),
			ledger_index: "validated",
		});
		const seq = resp.result.account_data.Sequence;
		if (globalOpts.json) {
			output({ sequence: seq }, globalOpts);
		} else {
			output(String(seq), globalOpts);
		}
	});
}

export function registerNonce(program: Command) {
	program
		.command("sequence-number")
		.alias("nonce")
		.description("Get the current sequence number for an account")
		.argument("<account>", "Account address or alias")
		.action((account: string) =>
			fetchNonce(account, program.opts() as GlobalOptions),
		);
}

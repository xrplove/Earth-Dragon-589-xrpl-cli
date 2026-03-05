import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerNonce(program: Command) {
	program
		.command("nonce")
		.description("Get the current sequence number for an account")
		.argument("<account>", "Account address or alias")
		.action(async (account: string) => {
			const globalOpts = program.opts() as GlobalOptions;
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
		});
}

import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerAccountInfo(program: Command) {
	program
		.command("account-info")
		.alias("info")
		.description("Get full account info")
		.argument("<account>", "Account address or alias")
		.option("--signer-lists", "Include SignerList objects", false)
		.option("--queue", "Include queued transaction info", false)
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			async (
				account: string,
				opts: {
					signerLists: boolean;
					queue: boolean;
					ledgerIndex: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "account_info",
						account: resolve(account),
						signer_lists: opts.signerLists || undefined,
						queue: opts.queue || undefined,
						ledger_index: parseLedgerIndex(opts.ledgerIndex),
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);
}

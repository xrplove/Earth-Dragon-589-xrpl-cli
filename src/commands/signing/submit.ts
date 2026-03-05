import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerSubmit(program: Command) {
	program
		.command("submit")
		.description("Submit a raw signed transaction blob")
		.argument("<tx-blob>", "Hex-encoded signed transaction blob")
		.option(
			"--fail-hard",
			"Fail immediately with tec-class errors instead of queuing",
			false,
		)
		.action(async (txBlob: string, opts: { failHard: boolean }) => {
			const globalOpts = program.opts() as GlobalOptions;
			await withClient(globalOpts, async (client) => {
				const resp = await client.request({
					command: "submit",
					tx_blob: txBlob,
					fail_hard: opts.failHard || undefined,
				});
				output(resp.result, globalOpts);
			});
		});
}

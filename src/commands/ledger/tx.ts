import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function fetchTx(
	hash: string,
	opts: { ctid: boolean },
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const req: Record<string, unknown> = { command: "tx" };
		if (opts.ctid) {
			req.ctid = hash;
		} else {
			req.transaction = hash;
		}
		const resp = await client.request(req as never);
		output(resp.result, globalOpts);
	});
}

export function registerTxCommand(program: Command) {
	program
		.command("tx")
		.description("Get information about a transaction by hash")
		.argument("<hash>", "Transaction hash or CTID")
		.option("--ctid", "Treat the argument as a Compact Transaction ID", false)
		.action((hash: string, opts: { ctid: boolean }) =>
			fetchTx(hash, opts, program.opts() as GlobalOptions),
		);
}

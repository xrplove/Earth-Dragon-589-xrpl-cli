import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function fetchServerState(globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({ command: "server_state" });
		output(resp.result, globalOpts);
	});
}

export function registerServerState(program: Command) {
	program
		.command("server-state")
		.description("Get detailed server state information")
		.action(() => fetchServerState(program.opts() as GlobalOptions));
}

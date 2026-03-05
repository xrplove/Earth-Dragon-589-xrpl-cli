import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function fetchServerInfo(globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({ command: "server_info" });
		output(resp.result, globalOpts);
	});
}

export function registerServerInfoCommand(program: Command) {
	program
		.command("server-info")
		.description("Get the connected server's status and info")
		.action(() => fetchServerInfo(program.opts() as GlobalOptions));
}

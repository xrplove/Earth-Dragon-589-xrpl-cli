import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function pingServer(globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		await client.request({ command: "ping" });
		if (!globalOpts.quiet) {
			output("pong", globalOpts);
		}
	});
}

export function registerPingCommand(program: Command) {
	program
		.command("ping")
		.description("Confirm connectivity with the server")
		.action(() => pingServer(program.opts() as GlobalOptions));
}

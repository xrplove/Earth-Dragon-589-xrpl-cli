import type { Command } from "commander";
import { dropsToXrp } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function convertDropsToXrp(drops: string, globalOpts: GlobalOptions) {
	const xrp = String(dropsToXrp(drops));
	if (globalOpts.json) {
		output({ drops, xrp }, globalOpts);
	} else {
		output(xrp, globalOpts);
	}
}

export function registerDropsToXrp(program: Command) {
	program
		.command("drops-to-xrp")
		.description("Convert drops to XRP")
		.argument("<drops>", "Amount in drops")
		.action((drops: string) =>
			convertDropsToXrp(drops, program.opts() as GlobalOptions),
		);
}

import type { Command } from "commander";
import { xrpToDrops } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function convertXrpToDrops(amount: string, globalOpts: GlobalOptions) {
	const drops = xrpToDrops(amount);
	if (globalOpts.json) {
		output({ xrp: amount, drops }, globalOpts);
	} else {
		output(drops, globalOpts);
	}
}

export function registerXrpToDrops(program: Command) {
	program
		.command("xrp-to-drops")
		.description("Convert XRP to drops (1 XRP = 1,000,000 drops)")
		.argument("<amount>", "XRP amount")
		.action((amount: string) =>
			convertXrpToDrops(amount, program.opts() as GlobalOptions),
		);
}

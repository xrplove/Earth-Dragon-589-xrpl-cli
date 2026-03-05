import type { Command } from "commander";
import { xrpToDrops } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerXrpToDrops(program: Command) {
	program
		.command("xrp-to-drops")
		.description("Convert XRP to drops (1 XRP = 1,000,000 drops)")
		.argument("<amount>", "XRP amount")
		.action(async (amount: string) => {
			const globalOpts = program.opts() as GlobalOptions;
			const drops = xrpToDrops(amount);
			if (globalOpts.json) {
				output({ xrp: amount, drops }, globalOpts);
			} else {
				output(drops, globalOpts);
			}
		});
}

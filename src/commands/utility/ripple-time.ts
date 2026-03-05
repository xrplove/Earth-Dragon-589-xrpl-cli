import type { Command } from "commander";
import { isoTimeToRippleTime, rippleTimeToISOTime } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerRippleTime(program: Command) {
	program
		.command("ripple-time")
		.description("Convert between XRPL epoch and ISO 8601 timestamps")
		.option("--to-iso <timestamp>", "Ripple epoch timestamp to ISO 8601")
		.option("--to-ripple <iso>", "ISO 8601 string to Ripple epoch timestamp")
		.action(async (opts: { toIso?: string; toRipple?: string }) => {
			const globalOpts = program.opts() as GlobalOptions;
			if (opts.toIso != null) {
				const iso = rippleTimeToISOTime(Number(opts.toIso));
				if (globalOpts.json) {
					output({ rippleTime: Number(opts.toIso), iso }, globalOpts);
				} else {
					output(iso, globalOpts);
				}
			} else if (opts.toRipple != null) {
				const rippleTime = isoTimeToRippleTime(opts.toRipple);
				if (globalOpts.json) {
					output({ iso: opts.toRipple, rippleTime }, globalOpts);
				} else {
					output(String(rippleTime), globalOpts);
				}
			} else {
				throw new Error("Provide exactly one of --to-iso or --to-ripple.");
			}
		});
}

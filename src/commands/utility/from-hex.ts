import type { Command } from "commander";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerFromHex(program: Command) {
	program
		.command("from-hex")
		.description("Convert hex to a UTF-8 string")
		.argument("<hex>", "Hex string to decode")
		.action(async (hex: string) => {
			const globalOpts = program.opts() as GlobalOptions;
			const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
			const str = Buffer.from(cleaned, "hex").toString("utf-8");
			if (globalOpts.json) {
				output({ hex: cleaned, string: str }, globalOpts);
			} else {
				output(str, globalOpts);
			}
		});
}

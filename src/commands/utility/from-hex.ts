import type { Command } from "commander";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function decodeFromHex(hex: string, globalOpts: GlobalOptions) {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
	const str = Buffer.from(cleaned, "hex").toString("utf-8");
	if (globalOpts.json) {
		output({ hex: cleaned, string: str }, globalOpts);
	} else {
		output(str, globalOpts);
	}
}

export function registerFromHex(program: Command) {
	program
		.command("from-hex")
		.description("Convert hex to a UTF-8 string")
		.argument("<hex>", "Hex string to decode")
		.action((hex: string) =>
			decodeFromHex(hex, program.opts() as GlobalOptions),
		);
}

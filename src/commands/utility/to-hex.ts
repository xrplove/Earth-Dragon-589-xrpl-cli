import type { Command } from "commander";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerToHex(program: Command) {
	program
		.command("to-hex")
		.description("Convert a UTF-8 string to hex")
		.argument("<string>", "UTF-8 string to encode")
		.action(async (str: string) => {
			const globalOpts = program.opts() as GlobalOptions;
			const hex = Buffer.from(str, "utf-8").toString("hex").toUpperCase();
			if (globalOpts.json) {
				output({ input: str, hex }, globalOpts);
			} else {
				output(hex, globalOpts);
			}
		});
}

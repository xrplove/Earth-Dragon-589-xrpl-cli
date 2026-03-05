import type { Command } from "commander";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function encodeToHex(str: string, globalOpts: GlobalOptions) {
	const hex = Buffer.from(str, "utf-8").toString("hex").toUpperCase();
	if (globalOpts.json) {
		output({ input: str, hex }, globalOpts);
	} else {
		output(hex, globalOpts);
	}
}

export function registerToHex(program: Command) {
	program
		.command("to-hex")
		.description("Convert a UTF-8 string to hex")
		.argument("<string>", "UTF-8 string to encode")
		.action((str: string) => encodeToHex(str, program.opts() as GlobalOptions));
}

import type { Command } from "commander";
import { decode } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerDecodeTx(program: Command) {
	program
		.command("decode-tx")
		.description("Decode a raw transaction blob into readable JSON")
		.argument("<tx-blob>", "Hex-encoded transaction blob")
		.action(async (txBlob: string) => {
			const globalOpts = program.opts() as GlobalOptions;
			const decoded = decode(txBlob);
			output(decoded, globalOpts);
		});
}

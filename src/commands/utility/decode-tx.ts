import type { Command } from "commander";
import { decode } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function decodeTxBlob(txBlob: string, globalOpts: GlobalOptions) {
	const decoded = decode(txBlob);
	output(decoded, globalOpts);
}

export function registerDecodeTx(program: Command) {
	program
		.command("decode-tx")
		.description("Decode a raw transaction blob into readable JSON")
		.argument("<tx-blob>", "Hex-encoded transaction blob")
		.action((txBlob: string) =>
			decodeTxBlob(txBlob, program.opts() as GlobalOptions),
		);
}

import type { Command } from "commander";
import { removeKeystore } from "../../lib/keystore.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

interface RemoveOpts {
	keystoreDir?: string;
}

async function removeWallet(
	name: string,
	opts: RemoveOpts,
	globalOpts: GlobalOptions,
) {
	removeKeystore(name, opts.keystoreDir);
	if (globalOpts.json) {
		output({ removed: name }, globalOpts);
	} else {
		output(`Removed "${name}"`, globalOpts);
	}
}

export function registerRemove(wallet: Command, program: Command) {
	wallet
		.command("remove")
		.alias("rm")
		.description("Remove a wallet from the keystore")
		.argument("<name>", "Account name to remove")
		.option("--keystore-dir <dir>", "Custom keystore directory")
		.action((name: string, opts: RemoveOpts) =>
			removeWallet(name, opts, program.opts() as GlobalOptions),
		);
}

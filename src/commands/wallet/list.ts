import type { Command } from "commander";
import { listKeystores } from "../../lib/keystore.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

interface ListOpts {
	dir?: string;
}

async function listWallets(opts: ListOpts, globalOpts: GlobalOptions) {
	const keystores = listKeystores(opts.dir);

	if (keystores.length === 0) {
		if (!globalOpts.json) {
			output("No wallets found.", globalOpts);
		} else {
			output([], globalOpts);
		}
		return;
	}

	if (globalOpts.json) {
		output(
			keystores.map((k) => ({ name: k.name, address: k.address })),
			globalOpts,
		);
	} else {
		const lines = keystores.map((k) => `${k.name} (${k.address})`);
		output(lines.join("\n"), globalOpts);
	}
}

export function registerList(wallet: Command, program: Command) {
	wallet
		.command("list")
		.alias("ls")
		.description("List all wallets in the keystore")
		.option("--dir <dir>", "Custom keystore directory")
		.action((opts: ListOpts) =>
			listWallets(opts, program.opts() as GlobalOptions),
		);
}

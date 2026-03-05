import type { Command } from "commander";
import type { SetRegularKey } from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

interface SetRegularKeyOpts extends TxOptions {
	key?: string;
}

async function setRegularKey(
	opts: SetRegularKeyOpts,
	globalOpts: GlobalOptions,
) {
	const wallet = loadWalletForTx(opts, globalOpts);

	const tx: Omit<SetRegularKey, "Account"> = {
		TransactionType: "SetRegularKey",
	};

	if (opts.key != null) tx.RegularKey = opts.key;

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerSetRegularKey(program: Command) {
	const cmd = program
		.command("set-regular-key")
		.description("Add, remove, or change the regular key pair for an account")
		.option(
			"--key <address>",
			"Regular key address to assign (omit to remove)",
		);
	withTxOptions(cmd).action((opts: SetRegularKeyOpts) =>
		setRegularKey(opts, program.opts() as GlobalOptions),
	);
}

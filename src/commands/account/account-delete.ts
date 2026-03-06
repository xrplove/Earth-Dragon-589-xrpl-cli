import type { Command } from "commander";
import type { AccountDelete } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { withWalletOptions } from "../../lib/wallet-options.js";

interface AccountDeleteOpts extends TxOptions {
	to: string;
	tag?: number;
}

async function accountDelete(
	opts: AccountDeleteOpts,
	globalOpts: GlobalOptions,
) {
	const wallet = await loadWalletForTx(opts, globalOpts);

	const tx: Omit<AccountDelete, "Account"> = {
		TransactionType: "AccountDelete",
		Destination: resolve(opts.to),
	};

	if (opts.tag != null) tx.DestinationTag = opts.tag;

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerAccountDelete(program: Command) {
	const cmd = program
		.command("account-delete")
		.description("Delete an account, sending remaining XRP to a destination")
		.requiredOption(
			"--to <destination>",
			"Destination account to receive remaining XRP",
		)
		.option("--tag <tag>", "Destination tag", Number);
	withWalletOptions(withTxOptions(cmd)).action((opts: AccountDeleteOpts) =>
		accountDelete(opts, cmd.optsWithGlobals() as GlobalOptions),
	);
}

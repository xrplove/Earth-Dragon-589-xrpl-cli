import type { Command } from "commander";
import type { DelegateSet } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

interface DelegateSetOpts extends TxOptions {
	permission: string[];
}

async function delegateSet(
	authorize: string,
	opts: DelegateSetOpts,
	globalOpts: GlobalOptions,
) {
	const tx: Omit<DelegateSet, "Account"> = {
		TransactionType: "DelegateSet",
		Authorize: resolve(authorize),
		Permissions: opts.permission.map((p) => ({
			Permission: { PermissionValue: p },
		})),
	};

	const wallet = await loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerDelegateSet(program: Command) {
	const cmd = program
		.command("delegate-set")
		.description("Delegate permissions to another account")
		.argument("<authorize>", "Account to delegate to (address or alias)")
		.requiredOption(
			"--permission <value...>",
			"Permission value(s) to grant (repeatable)",
		);
	withTxOptions(cmd).action((authorize: string, opts: DelegateSetOpts) =>
		delegateSet(authorize, opts, program.opts() as GlobalOptions),
	);
}

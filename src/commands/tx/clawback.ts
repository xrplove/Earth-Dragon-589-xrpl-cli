import type { Command } from "commander";
import type { Clawback, ClawbackAmount } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { parseToken, toXrplAmount } from "../../lib/tokens.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

interface ClawbackOpts extends TxOptions {
	amount: string;
	token: string;
	holder?: string;
}

async function clawback(opts: ClawbackOpts, globalOpts: GlobalOptions) {
	const tx: Omit<Clawback, "Account"> = {
		TransactionType: "Clawback",
		Amount: toXrplAmount(parseToken(opts.token), opts.amount) as ClawbackAmount,
	};

	if (opts.holder) tx.Holder = resolve(opts.holder);

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerClawback(program: Command) {
	const cmd = program
		.command("clawback")
		.description("Clawback issued currency or MPT from a holder")
		.requiredOption("--amount <amount>", "Amount to claw back")
		.requiredOption("--token <token>", "Token: <currency>.<issuer> or mpt:<id>")
		.option("--holder <address>", "Holder account (for MPT clawback)");
	withTxOptions(cmd).action((opts: ClawbackOpts) =>
		clawback(opts, program.opts() as GlobalOptions),
	);
}

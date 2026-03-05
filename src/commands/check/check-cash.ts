import { type Command, Option } from "commander";
import type { Amount, CheckCash } from "xrpl";
import { withClient } from "../../lib/client.js";
import { parseToken, toXrplAmount } from "../../lib/tokens.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validateHex64 } from "../../lib/validate.js";

interface CheckCashOpts extends TxOptions {
	amount?: string;
	token?: string;
	deliverMinAmount?: string;
	deliverMinToken?: string;
}

async function checkCash(
	checkId: string,
	opts: CheckCashOpts,
	globalOpts: GlobalOptions,
) {
	validateHex64(checkId, "check ID");

	const tx: Omit<CheckCash, "Account"> = {
		TransactionType: "CheckCash",
		CheckID: checkId,
	};

	if (opts.amount && opts.token) {
		tx.Amount = toXrplAmount(parseToken(opts.token), opts.amount) as Amount;
	}
	if (opts.deliverMinAmount && opts.deliverMinToken) {
		tx.DeliverMin = toXrplAmount(
			parseToken(opts.deliverMinToken),
			opts.deliverMinAmount,
		) as Amount;
	}

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerCheckCash(program: Command) {
	const cmd = program
		.command("check-cash")
		.description("Cash a check")
		.argument("<check-id>", "Check ID (64-char hex)")
		.addOption(
			new Option("--amount <amount>", "Exact amount to cash")
				.conflicts("deliverMinAmount"),
		)
		.addOption(
			new Option("--token <token>", "Token for --amount")
				.conflicts("deliverMinToken"),
		)
		.addOption(
			new Option("--deliver-min-amount <amount>", "Minimum amount to deliver")
				.conflicts("amount"),
		)
		.addOption(
			new Option("--deliver-min-token <token>", "Token for --deliver-min-amount")
				.conflicts("token"),
		);
	withTxOptions(cmd).action((checkId: string, opts: CheckCashOpts) =>
		checkCash(checkId, opts, program.opts() as GlobalOptions),
	);
}

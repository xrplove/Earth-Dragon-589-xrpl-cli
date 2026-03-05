import type { Command } from "commander";
import type { AMMCreate, Amount } from "xrpl";
import { withClient } from "../../lib/client.js";
import { parseToken, toXrplAmount } from "../../lib/tokens.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validateRange } from "../../lib/validate.js";

interface AmmCreateOpts extends TxOptions {
	amount1: string;
	token1: string;
	amount2: string;
	token2: string;
	tradingFee: number;
}

async function ammCreate(opts: AmmCreateOpts, globalOpts: GlobalOptions) {
	validateRange(opts.tradingFee, 0, 1000, "trading-fee");

	const tx: Omit<AMMCreate, "Account"> = {
		TransactionType: "AMMCreate",
		Amount: toXrplAmount(parseToken(opts.token1), opts.amount1) as Amount,
		Amount2: toXrplAmount(parseToken(opts.token2), opts.amount2) as Amount,
		TradingFee: opts.tradingFee,
	};

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerAmmCreate(program: Command) {
	const cmd = program
		.command("amm-create")
		.description("Create a new AMM pool")
		.requiredOption("--amount1 <amount>", "Amount of first asset")
		.requiredOption("--token1 <token>", "First token: XRP or <currency>.<issuer>")
		.requiredOption("--amount2 <amount>", "Amount of second asset")
		.requiredOption("--token2 <token>", "Second token: XRP or <currency>.<issuer>")
		.requiredOption("--trading-fee <fee>", "Trading fee (0-1000, in 1/100000ths)", Number);
	withTxOptions(cmd).action((opts: AmmCreateOpts) =>
		ammCreate(opts, program.opts() as GlobalOptions),
	);
}

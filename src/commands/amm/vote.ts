import type { Command } from "commander";
import type { AMMVote } from "xrpl";
import { withClient } from "../../lib/client.js";
import { toCurrency } from "../../lib/currency.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validateRange } from "../../lib/validate.js";

interface AmmVoteOpts extends TxOptions {
	asset: string;
	asset2: string;
	tradingFee: number;
}

async function ammVote(opts: AmmVoteOpts, globalOpts: GlobalOptions) {
	validateRange(opts.tradingFee, 0, 1000, "trading-fee");

	const tx: Omit<AMMVote, "Account"> = {
		TransactionType: "AMMVote",
		Asset: toCurrency(opts.asset),
		Asset2: toCurrency(opts.asset2),
		TradingFee: opts.tradingFee,
	};

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerAmmVote(program: Command) {
	const cmd = program
		.command("amm-vote")
		.description("Vote on the trading fee for an AMM pool")
		.requiredOption("--asset <token>", "First pool asset: XRP or <currency>.<issuer>")
		.requiredOption("--asset2 <token>", "Second pool asset")
		.requiredOption("--trading-fee <fee>", "Proposed trading fee (0-1000)", Number);
	withTxOptions(cmd).action((opts: AmmVoteOpts) =>
		ammVote(opts, program.opts() as GlobalOptions),
	);
}

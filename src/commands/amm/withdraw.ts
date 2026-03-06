import type { Command } from "commander";
import {
	type AMMWithdraw,
	AMMWithdrawFlags,
	type Amount,
	type IssuedCurrencyAmount,
} from "xrpl";
import { withClient } from "../../lib/client.js";
import { toCurrency } from "../../lib/currency.js";
import { parseToken, toXrplAmount } from "../../lib/tokens.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

interface AmmWithdrawOpts extends TxOptions {
	asset: string;
	asset2: string;
	amount?: string;
	amountToken?: string;
	amount2?: string;
	amount2Token?: string;
	lpTokenIn?: string;
	lpTokenToken?: string;
	ePrice?: string;
	ePriceToken?: string;
	lpToken: boolean;
	withdrawAll: boolean;
	oneAssetWithdrawAll: boolean;
	singleAsset: boolean;
	twoAsset: boolean;
	oneAssetLpToken: boolean;
	limitLpToken: boolean;
}

async function ammWithdraw(opts: AmmWithdrawOpts, globalOpts: GlobalOptions) {
	const tx: Omit<AMMWithdraw, "Account"> = {
		TransactionType: "AMMWithdraw",
		Asset: toCurrency(opts.asset),
		Asset2: toCurrency(opts.asset2),
	};

	if (opts.amount && opts.amountToken) {
		tx.Amount = toXrplAmount(
			parseToken(opts.amountToken),
			opts.amount,
		) as Amount;
	}
	if (opts.amount2 && opts.amount2Token) {
		tx.Amount2 = toXrplAmount(
			parseToken(opts.amount2Token),
			opts.amount2,
		) as Amount;
	}
	if (opts.lpTokenIn && opts.lpTokenToken) {
		tx.LPTokenIn = toXrplAmount(
			parseToken(opts.lpTokenToken),
			opts.lpTokenIn,
		) as IssuedCurrencyAmount;
	}
	if (opts.ePrice && opts.ePriceToken) {
		tx.EPrice = toXrplAmount(
			parseToken(opts.ePriceToken),
			opts.ePrice,
		) as Amount;
	}

	let flags = 0;
	if (opts.lpToken) flags |= AMMWithdrawFlags.tfLPToken;
	if (opts.withdrawAll) flags |= AMMWithdrawFlags.tfWithdrawAll;
	if (opts.oneAssetWithdrawAll) flags |= AMMWithdrawFlags.tfOneAssetWithdrawAll;
	if (opts.singleAsset) flags |= AMMWithdrawFlags.tfSingleAsset;
	if (opts.twoAsset) flags |= AMMWithdrawFlags.tfTwoAsset;
	if (opts.oneAssetLpToken) flags |= AMMWithdrawFlags.tfOneAssetLPToken;
	if (opts.limitLpToken) flags |= AMMWithdrawFlags.tfLimitLPToken;
	if (flags) tx.Flags = flags;

	const wallet = await loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerAmmWithdraw(program: Command) {
	const cmd = program
		.command("amm-withdraw")
		.description("Withdraw assets from an AMM pool")
		.requiredOption(
			"--asset <token>",
			"First pool asset: XRP or <currency>.<issuer>",
		)
		.requiredOption("--asset2 <token>", "Second pool asset")
		.option("--amount <amount>", "Amount of first asset to withdraw")
		.option("--amount-token <token>", "Token for --amount")
		.option("--amount2 <amount>", "Amount of second asset to withdraw")
		.option("--amount2-token <token>", "Token for --amount2")
		.option("--lp-token-in <amount>", "LP tokens to redeem")
		.option("--lp-token-token <token>", "Token for --lp-token-in")
		.option("--e-price <amount>", "Effective price limit")
		.option("--e-price-token <token>", "Token for --e-price")
		.option("--lp-token", "Withdraw LP tokens only", false)
		.option("--withdraw-all", "Withdraw all assets", false)
		.option("--one-asset-withdraw-all", "Withdraw all of one asset", false)
		.option("--single-asset", "Withdraw a single asset", false)
		.option("--two-asset", "Withdraw both assets", false)
		.option(
			"--one-asset-lp-token",
			"Single asset with LP token constraint",
			false,
		)
		.option("--limit-lp-token", "Limit by LP token amount", false);
	withTxOptions(cmd).action((opts: AmmWithdrawOpts) =>
		ammWithdraw(opts, program.opts() as GlobalOptions),
	);
}

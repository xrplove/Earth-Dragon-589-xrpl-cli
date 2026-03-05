import type { Command } from "commander";
import {
	AMMDepositFlags,
	type AMMDeposit,
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

interface AmmDepositOpts extends TxOptions {
	asset: string;
	asset2: string;
	amount?: string;
	amountToken?: string;
	amount2?: string;
	amount2Token?: string;
	lpTokenOut?: string;
	lpTokenToken?: string;
	ePrice?: string;
	ePriceToken?: string;
	lpToken: boolean;
	singleAsset: boolean;
	twoAsset: boolean;
	oneAssetLpToken: boolean;
	limitLpToken: boolean;
	twoAssetIfEmpty: boolean;
}

async function ammDeposit(opts: AmmDepositOpts, globalOpts: GlobalOptions) {
	const tx: Omit<AMMDeposit, "Account"> = {
		TransactionType: "AMMDeposit",
		Asset: toCurrency(opts.asset),
		Asset2: toCurrency(opts.asset2),
	};

	if (opts.amount && opts.amountToken) {
		tx.Amount = toXrplAmount(parseToken(opts.amountToken), opts.amount) as Amount;
	}
	if (opts.amount2 && opts.amount2Token) {
		tx.Amount2 = toXrplAmount(parseToken(opts.amount2Token), opts.amount2) as Amount;
	}
	if (opts.lpTokenOut && opts.lpTokenToken) {
		tx.LPTokenOut = toXrplAmount(
			parseToken(opts.lpTokenToken),
			opts.lpTokenOut,
		) as IssuedCurrencyAmount;
	}
	if (opts.ePrice && opts.ePriceToken) {
		tx.EPrice = toXrplAmount(parseToken(opts.ePriceToken), opts.ePrice) as Amount;
	}

	let flags = 0;
	if (opts.lpToken) flags |= AMMDepositFlags.tfLPToken;
	if (opts.singleAsset) flags |= AMMDepositFlags.tfSingleAsset;
	if (opts.twoAsset) flags |= AMMDepositFlags.tfTwoAsset;
	if (opts.oneAssetLpToken) flags |= AMMDepositFlags.tfOneAssetLPToken;
	if (opts.limitLpToken) flags |= AMMDepositFlags.tfLimitLPToken;
	if (opts.twoAssetIfEmpty) flags |= AMMDepositFlags.tfTwoAssetIfEmpty;
	if (flags) tx.Flags = flags;

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerAmmDeposit(program: Command) {
	const cmd = program
		.command("amm-deposit")
		.description("Deposit assets into an AMM pool")
		.requiredOption("--asset <token>", "First pool asset: XRP or <currency>.<issuer>")
		.requiredOption("--asset2 <token>", "Second pool asset")
		.option("--amount <amount>", "Amount of first asset to deposit")
		.option("--amount-token <token>", "Token for --amount")
		.option("--amount2 <amount>", "Amount of second asset to deposit")
		.option("--amount2-token <token>", "Token for --amount2")
		.option("--lp-token-out <amount>", "LP tokens to receive")
		.option("--lp-token-token <token>", "Token for --lp-token-out")
		.option("--e-price <amount>", "Effective price limit")
		.option("--e-price-token <token>", "Token for --e-price")
		.option("--lp-token", "Deposit LP tokens only", false)
		.option("--single-asset", "Deposit a single asset", false)
		.option("--two-asset", "Deposit both assets", false)
		.option("--one-asset-lp-token", "Single asset with LP token constraint", false)
		.option("--limit-lp-token", "Limit by LP token amount", false)
		.option("--two-asset-if-empty", "Two-asset deposit for empty pool", false);
	withTxOptions(cmd).action((opts: AmmDepositOpts) =>
		ammDeposit(opts, program.opts() as GlobalOptions),
	);
}

import type { Command } from "commander";
import type { AMMBid, AuthAccount, IssuedCurrencyAmount } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { toCurrency } from "../../lib/currency.js";
import { parseToken, toXrplAmount } from "../../lib/tokens.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

interface AmmBidOpts extends TxOptions {
	asset: string;
	asset2: string;
	bidMinAmount?: string;
	bidMinToken?: string;
	bidMaxAmount?: string;
	bidMaxToken?: string;
	authAccounts?: string[];
}

async function ammBid(opts: AmmBidOpts, globalOpts: GlobalOptions) {
	const tx: Omit<AMMBid, "Account"> = {
		TransactionType: "AMMBid",
		Asset: toCurrency(opts.asset),
		Asset2: toCurrency(opts.asset2),
	};

	if (opts.bidMinAmount && opts.bidMinToken) {
		tx.BidMin = toXrplAmount(
			parseToken(opts.bidMinToken),
			opts.bidMinAmount,
		) as IssuedCurrencyAmount;
	}
	if (opts.bidMaxAmount && opts.bidMaxToken) {
		tx.BidMax = toXrplAmount(
			parseToken(opts.bidMaxToken),
			opts.bidMaxAmount,
		) as IssuedCurrencyAmount;
	}
	if (opts.authAccounts?.length) {
		tx.AuthAccounts = opts.authAccounts.map(
			(a): AuthAccount => ({ AuthAccount: { Account: resolve(a) } }),
		);
	}

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerAmmBid(program: Command) {
	const cmd = program
		.command("amm-bid")
		.description("Bid for the auction slot on an AMM pool")
		.requiredOption(
			"--asset <token>",
			"First pool asset: XRP or <currency>.<issuer>",
		)
		.requiredOption("--asset2 <token>", "Second pool asset")
		.option("--bid-min-amount <amount>", "Minimum bid amount")
		.option("--bid-min-token <token>", "Token for --bid-min-amount")
		.option("--bid-max-amount <amount>", "Maximum bid amount")
		.option("--bid-max-token <token>", "Token for --bid-max-amount")
		.option(
			"--auth-accounts <addresses...>",
			"Authorized accounts for discounted trading",
		);
	withTxOptions(cmd).action((opts: AmmBidOpts) =>
		ammBid(opts, program.opts() as GlobalOptions),
	);
}

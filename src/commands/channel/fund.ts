import type { Command } from "commander";
import { type PaymentChannelFund, xrpToDrops } from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validateHex64, validateXrpAmount } from "../../lib/validate.js";
import { withWalletOptions } from "../../lib/wallet-options.js";

interface ChannelFundOpts extends TxOptions {
	amount: string;
	expiration?: number;
}

async function channelFund(
	channelId: string,
	opts: ChannelFundOpts,
	globalOpts: GlobalOptions,
) {
	validateHex64(channelId, "channel ID");
	validateXrpAmount(opts.amount, "amount");

	const tx: Omit<PaymentChannelFund, "Account"> = {
		TransactionType: "PaymentChannelFund",
		Channel: channelId,
		Amount: xrpToDrops(opts.amount),
	};

	if (opts.expiration != null) tx.Expiration = opts.expiration;

	const wallet = await loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerChannelFund(program: Command) {
	const cmd = program
		.command("channel-fund")
		.description("Add XRP to an existing payment channel")
		.argument("<channel-id>", "Channel ID (64-char hex)")
		.requiredOption("--amount <xrp>", "Amount of XRP to add")
		.option(
			"--expiration <ripple-time>",
			"New expiration (Ripple epoch)",
			Number,
		);
	withWalletOptions(withTxOptions(cmd)).action(
		(channelId: string, opts: ChannelFundOpts) =>
			channelFund(channelId, opts, cmd.optsWithGlobals() as GlobalOptions),
	);
}

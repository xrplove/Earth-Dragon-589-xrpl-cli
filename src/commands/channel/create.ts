import type { Command } from "commander";
import { type PaymentChannelCreate, xrpToDrops } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validateXrpAmount } from "../../lib/validate.js";

interface ChannelCreateOpts extends TxOptions {
	destination: string;
	amount: string;
	settleDelay: number;
	publicKey: string;
	cancelAfter?: number;
	tag?: number;
}

async function channelCreate(
	opts: ChannelCreateOpts,
	globalOpts: GlobalOptions,
) {
	validateXrpAmount(opts.amount, "amount");

	const tx: Omit<PaymentChannelCreate, "Account"> = {
		TransactionType: "PaymentChannelCreate",
		Destination: resolve(opts.destination),
		Amount: xrpToDrops(opts.amount),
		SettleDelay: opts.settleDelay,
		PublicKey: opts.publicKey,
	};

	if (opts.cancelAfter != null) tx.CancelAfter = opts.cancelAfter;
	if (opts.tag != null) tx.DestinationTag = opts.tag;

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerChannelCreate(program: Command) {
	const cmd = program
		.command("channel-create")
		.description("Create a payment channel")
		.requiredOption("--destination <address>", "Destination address or alias")
		.requiredOption("--amount <xrp>", "Amount of XRP to fund the channel")
		.requiredOption(
			"--settle-delay <seconds>",
			"Settlement delay in seconds",
			Number,
		)
		.requiredOption("--public-key <hex>", "Public key for claim verification")
		.option(
			"--cancel-after <ripple-time>",
			"Channel expiration (Ripple epoch)",
			Number,
		)
		.option("--tag <tag>", "Destination tag", Number);
	withTxOptions(cmd).action((opts: ChannelCreateOpts) =>
		channelCreate(opts, program.opts() as GlobalOptions),
	);
}

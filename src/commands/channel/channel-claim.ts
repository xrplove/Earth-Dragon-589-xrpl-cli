import { type Command, Option } from "commander";
import {
	PaymentChannelClaimFlags,
	xrpToDrops,
	type PaymentChannelClaim,
} from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

interface ChannelClaimOpts extends TxOptions {
	balance?: string;
	amount?: string;
	signature?: string;
	publicKey?: string;
	renew: boolean;
	close: boolean;
}

async function channelClaim(
	channelId: string,
	opts: ChannelClaimOpts,
	globalOpts: GlobalOptions,
) {
	const tx: Omit<PaymentChannelClaim, "Account"> = {
		TransactionType: "PaymentChannelClaim",
		Channel: channelId,
	};

	if (opts.balance) tx.Balance = xrpToDrops(opts.balance);
	if (opts.amount) tx.Amount = xrpToDrops(opts.amount);
	if (opts.signature) tx.Signature = opts.signature;
	if (opts.publicKey) tx.PublicKey = opts.publicKey;

	let flags = 0;
	if (opts.renew) flags |= PaymentChannelClaimFlags.tfRenew;
	if (opts.close) flags |= PaymentChannelClaimFlags.tfClose;
	if (flags) tx.Flags = flags;

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerChannelClaim(program: Command) {
	const cmd = program
		.command("channel-claim")
		.description("Claim XRP from a payment channel")
		.argument("<channel-id>", "Channel ID (64-char hex)")
		.option("--balance <xrp>", "New balance after claim")
		.option("--amount <xrp>", "Amount of XRP authorized by signature")
		.option("--signature <hex>", "Authorization signature")
		.option("--public-key <hex>", "Public key for signature verification")
		.addOption(
			new Option("--renew", "Reset the channel's settle delay").default(false),
		)
		.addOption(
			new Option("--close", "Request channel closure").default(false),
		);
	withTxOptions(cmd).action((channelId: string, opts: ChannelClaimOpts) =>
		channelClaim(channelId, opts, program.opts() as GlobalOptions),
	);
}

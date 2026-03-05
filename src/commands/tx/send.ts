import { type Command, Option } from "commander";
import { type Payment, PaymentFlags } from "xrpl";
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
import { validateHex64 } from "../../lib/validate.js";

interface SendOpts extends TxOptions {
	to: string;
	amount: string;
	token: string;
	tag?: number;
	sendMaxAmount?: string;
	sendMaxToken?: string;
	deliverMinAmount?: string;
	deliverMinToken?: string;
	paths?: string;
	invoiceId?: string;
	partial: boolean;
	noDirect: boolean;
	limitQuality: boolean;
}

async function sendPayment(opts: SendOpts, globalOpts: GlobalOptions) {
	if (opts.invoiceId) validateHex64(opts.invoiceId, "invoice ID");

	const token = parseToken(opts.token);
	const destination = resolve(opts.to);

	const tx: Omit<Payment, "Account"> = {
		TransactionType: "Payment",
		Destination: destination,
		Amount: toXrplAmount(token, opts.amount),
	};

	if (opts.tag != null) tx.DestinationTag = opts.tag;
	if (opts.sendMaxAmount && opts.sendMaxToken) {
		tx.SendMax = toXrplAmount(
			parseToken(opts.sendMaxToken),
			opts.sendMaxAmount,
		);
	}
	if (opts.deliverMinAmount && opts.deliverMinToken) {
		tx.DeliverMin = toXrplAmount(
			parseToken(opts.deliverMinToken),
			opts.deliverMinAmount,
		);
	}
	if (opts.paths) tx.Paths = JSON.parse(opts.paths);
	if (opts.invoiceId) tx.InvoiceID = opts.invoiceId;

	let flags = 0;
	if (opts.partial) flags |= PaymentFlags.tfPartialPayment;
	if (opts.noDirect) flags |= PaymentFlags.tfNoRippleDirect;
	if (opts.limitQuality) flags |= PaymentFlags.tfLimitQuality;
	if (flags) tx.Flags = flags;

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerSendCommand(program: Command) {
	const cmd = program
		.command("send")
		.alias("pay")
		.alias("payment")
		.description("Send a payment (XRP, IOU, or MPT)")
		.requiredOption(
			"--to <destination>",
			"Destination account address or alias",
		)
		.requiredOption("--amount <amount>", "Amount to send")
		.requiredOption(
			"--token <token>",
			"Token: XRP, <currency>.<issuer>, or mpt:<id>",
		)
		.option("--tag <tag>", "Destination tag", Number)
		.option(
			"--send-max-amount <amount>",
			"Max source amount for cross-currency",
		)
		.option("--send-max-token <token>", "Token for --send-max-amount")
		.addOption(
			new Option(
				"--deliver-min-amount <amount>",
				"Min delivered amount",
			).implies({ partial: true }),
		)
		.option("--deliver-min-token <token>", "Token for --deliver-min-amount")
		.option("--paths <json>", "Payment paths as JSON array")
		.option("--invoice-id <hex>", "256-bit invoice ID (64-char hex)")
		.option("--partial", "Allow partial payments", false)
		.option("--no-direct", "Only use explicit paths", false)
		.option("--limit-quality", "Only take equal-quality paths", false);
	withTxOptions(cmd).action((opts: SendOpts) =>
		sendPayment(opts, program.opts() as GlobalOptions),
	);
}

import type { Command } from "commander";
import type { Transaction } from "xrpl";
import { withClient } from "../lib/client.js";
import { resolve } from "../lib/config.js";
import { output } from "../lib/output.js";
import { parseToken, toXrplAmount } from "../lib/tokens.js";
import { submitOrPrepare } from "../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../lib/types.js";
import { loadWallet } from "../lib/wallet.js";

const TF_PARTIAL_PAYMENT = 0x00020000;
const TF_NO_RIPPLE_DIRECT = 0x00010000;
const TF_LIMIT_QUALITY = 0x00040000;

interface SendOpts extends TxOptions {
	to: string;
	amount: string;
	token: string;
	tag?: number;
	sendMax?: string[];
	deliverMin?: string[];
	paths?: string;
	invoiceId?: string;
	partial: boolean;
	noDirect: boolean;
	limitQuality: boolean;
}

async function sendPayment(opts: SendOpts, globalOpts: GlobalOptions) {
	const token = parseToken(opts.token);
	const destination = resolve(opts.to);

	const tx: Record<string, unknown> = {
		TransactionType: "Payment",
		Destination: destination,
		Amount: toXrplAmount(token, opts.amount),
	};

	if (opts.tag != null) {
		tx.DestinationTag = opts.tag;
	}

	if (opts.sendMax) {
		const sendMaxToken = parseToken(opts.sendMax[1]);
		tx.SendMax = toXrplAmount(sendMaxToken, opts.sendMax[0]);
	}

	if (opts.deliverMin) {
		const deliverMinToken = parseToken(opts.deliverMin[1]);
		tx.DeliverMin = toXrplAmount(deliverMinToken, opts.deliverMin[0]);
	}

	if (opts.paths) {
		tx.Paths = JSON.parse(opts.paths);
	}

	if (opts.invoiceId) {
		tx.InvoiceID = opts.invoiceId;
	}

	let flags = 0;
	if (opts.partial) flags |= TF_PARTIAL_PAYMENT;
	if (opts.noDirect) flags |= TF_NO_RIPPLE_DIRECT;
	if (opts.limitQuality) flags |= TF_LIMIT_QUALITY;
	if (flags) tx.Flags = flags;

	const wallet =
		opts.prepare || opts.signers != null ? null : loadWallet(globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(
			client,
			wallet,
			tx as unknown as Transaction,
			opts,
			globalOpts,
		);
		if (outcome.mode === "prepared") {
			output(outcome.tx, globalOpts);
		} else {
			output(outcome.result, globalOpts);
		}
	});
}

export function registerSendCommand(program: Command) {
	program
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
			"--send-max <amount> <token>",
			"Max source amount for cross-currency",
		)
		.option(
			"--deliver-min <amount> <token>",
			"Min delivered amount (requires --partial)",
		)
		.option("--paths <json>", "Payment paths as JSON array")
		.option("--invoice-id <hex>", "256-bit invoice ID (64-char hex)")
		.option("--partial", "Allow partial payments", false)
		.option("--no-direct", "Only use explicit paths", false)
		.option("--limit-quality", "Only take equal-quality paths", false)
		.option("--prepare", "Output unsigned JSON instead of submitting", false)
		.option("--signers <n>", "Number of signers for multi-sign fee", Number)
		.option("--memo <memo...>", "Memo in type:data format (repeatable)")
		.option("--ticket <n>", "Use a ticket instead of sequence number", Number)
		.action((opts: SendOpts) =>
			sendPayment(opts, program.opts() as GlobalOptions),
		);
}

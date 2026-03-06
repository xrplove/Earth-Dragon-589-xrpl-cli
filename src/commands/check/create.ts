import type { Command } from "commander";
import type { Amount, CheckCreate } from "xrpl";
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
import { withWalletOptions } from "../../lib/wallet-options.js";

interface CheckCreateOpts extends TxOptions {
	destination: string;
	sendMaxAmount: string;
	sendMaxToken: string;
	expiration?: number;
	invoiceId?: string;
	tag?: number;
}

async function checkCreate(opts: CheckCreateOpts, globalOpts: GlobalOptions) {
	if (opts.invoiceId) validateHex64(opts.invoiceId, "invoice ID");

	const token = parseToken(opts.sendMaxToken);

	const tx: Omit<CheckCreate, "Account"> = {
		TransactionType: "CheckCreate",
		Destination: resolve(opts.destination),
		SendMax: toXrplAmount(token, opts.sendMaxAmount) as Amount,
	};

	if (opts.expiration != null) tx.Expiration = opts.expiration;
	if (opts.invoiceId) tx.InvoiceID = opts.invoiceId;
	if (opts.tag != null) tx.DestinationTag = opts.tag;

	const wallet = await loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerCheckCreate(program: Command) {
	const cmd = program
		.command("check-create")
		.description("Create a check")
		.requiredOption("--destination <address>", "Recipient address or alias")
		.requiredOption(
			"--send-max-amount <amount>",
			"Maximum amount the check can debit",
		)
		.requiredOption(
			"--send-max-token <token>",
			"Token: XRP, <currency>.<issuer>, or mpt:<id>",
		)
		.option(
			"--expiration <ripple-time>",
			"Check expiration (Ripple epoch)",
			Number,
		)
		.option("--invoice-id <hex>", "256-bit invoice ID (64-char hex)")
		.option("--tag <tag>", "Destination tag", Number);
	withWalletOptions(withTxOptions(cmd)).action((opts: CheckCreateOpts) =>
		checkCreate(opts, cmd.optsWithGlobals() as GlobalOptions),
	);
}

import type { Command } from "commander";
import type { Transaction } from "xrpl";
import { withClient } from "../lib/client.js";
import { resolve } from "../lib/config.js";
import { output } from "../lib/output.js";
import { submitOrPrepare } from "../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../lib/types.js";
import { loadWallet } from "../lib/wallet.js";

const TF_SET_NO_RIPPLE = 0x00020000;
const TF_CLEAR_NO_RIPPLE = 0x00040000;
const TF_SET_FREEZE = 0x00100000;
const TF_CLEAR_FREEZE = 0x00200000;
const TF_SET_DEEP_FREEZE = 0x01000000;
const TF_CLEAR_DEEP_FREEZE = 0x02000000;
const TF_SET_AUTH = 0x00010000;

interface TrustSetOpts extends TxOptions {
	limit: string;
	qualityIn?: number;
	qualityOut?: number;
	noRipple: boolean;
	clearNoRipple: boolean;
	freeze: boolean;
	clearFreeze: boolean;
	deepFreeze: boolean;
	clearDeepFreeze: boolean;
	auth: boolean;
}

async function setTrustLine(
	currency: string,
	issuer: string,
	opts: TrustSetOpts,
	globalOpts: GlobalOptions,
) {
	const resolvedIssuer = resolve(issuer);

	const tx: Record<string, unknown> = {
		TransactionType: "TrustSet",
		LimitAmount: {
			currency,
			issuer: resolvedIssuer,
			value: opts.limit,
		},
	};

	if (opts.qualityIn != null) tx.QualityIn = opts.qualityIn;
	if (opts.qualityOut != null) tx.QualityOut = opts.qualityOut;

	let flags = 0;
	if (opts.noRipple) flags |= TF_SET_NO_RIPPLE;
	if (opts.clearNoRipple) flags |= TF_CLEAR_NO_RIPPLE;
	if (opts.freeze) flags |= TF_SET_FREEZE;
	if (opts.clearFreeze) flags |= TF_CLEAR_FREEZE;
	if (opts.deepFreeze) flags |= TF_SET_DEEP_FREEZE;
	if (opts.clearDeepFreeze) flags |= TF_CLEAR_DEEP_FREEZE;
	if (opts.auth) flags |= TF_SET_AUTH;
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

export function registerTrustSetCommand(program: Command) {
	program
		.command("trust-set")
		.description("Create or modify a trust line")
		.argument("<currency>", "Currency code (3-char or 40-char hex)")
		.argument("<issuer>", "Issuer account address or alias")
		.option("--limit <limit>", "Trust line limit", "0")
		.option("--quality-in <n>", "Incoming quality ratio", Number)
		.option("--quality-out <n>", "Outgoing quality ratio", Number)
		.option("--no-ripple", "Set No Ripple flag", false)
		.option("--clear-no-ripple", "Clear No Ripple flag", false)
		.option("--freeze", "Freeze this trust line", false)
		.option("--clear-freeze", "Unfreeze this trust line", false)
		.option("--deep-freeze", "Deep-freeze this trust line", false)
		.option("--clear-deep-freeze", "Clear deep-freeze", false)
		.option("--auth", "Authorize counterparty to hold currency", false)
		.option("--prepare", "Output unsigned JSON instead of submitting", false)
		.option("--signers <n>", "Number of signers for multi-sign fee", Number)
		.option("--memo <memo...>", "Memo in type:data format (repeatable)")
		.option("--ticket <n>", "Use a ticket instead of sequence number", Number)
		.action((currency: string, issuer: string, opts: TrustSetOpts) =>
			setTrustLine(currency, issuer, opts, program.opts() as GlobalOptions),
		);
}

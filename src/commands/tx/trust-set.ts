import { type Command, Option } from "commander";
import { type TrustSet, TrustSetFlags } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

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

	const tx: Omit<TrustSet, "Account"> = {
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
	if (opts.noRipple) flags |= TrustSetFlags.tfSetNoRipple;
	if (opts.clearNoRipple) flags |= TrustSetFlags.tfClearNoRipple;
	if (opts.freeze) flags |= TrustSetFlags.tfSetFreeze;
	if (opts.clearFreeze) flags |= TrustSetFlags.tfClearFreeze;
	if (opts.deepFreeze) flags |= TrustSetFlags.tfSetDeepFreeze;
	if (opts.clearDeepFreeze) flags |= TrustSetFlags.tfClearDeepFreeze;
	if (opts.auth) flags |= TrustSetFlags.tfSetfAuth;
	if (flags) tx.Flags = flags;

	const wallet = await loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerTrustSetCommand(program: Command) {
	const cmd = program
		.command("trust-set")
		.description("Create or modify a trust line")
		.argument("<currency>", "Currency code (3-char or 40-char hex)")
		.argument("<issuer>", "Issuer account address or alias")
		.option("--limit <limit>", "Trust line limit", "0")
		.option("--quality-in <n>", "Incoming quality ratio", Number)
		.option("--quality-out <n>", "Outgoing quality ratio", Number)
		.addOption(
			new Option("--no-ripple", "Set No Ripple flag").conflicts(
				"clearNoRipple",
			),
		)
		.addOption(
			new Option("--clear-no-ripple", "Clear No Ripple flag").conflicts(
				"noRipple",
			),
		)
		.addOption(
			new Option("--freeze", "Freeze this trust line").conflicts("clearFreeze"),
		)
		.addOption(
			new Option("--clear-freeze", "Unfreeze this trust line").conflicts(
				"freeze",
			),
		)
		.addOption(
			new Option("--deep-freeze", "Deep-freeze this trust line").conflicts(
				"clearDeepFreeze",
			),
		)
		.addOption(
			new Option("--clear-deep-freeze", "Clear deep-freeze").conflicts(
				"deepFreeze",
			),
		)
		.option("--auth", "Authorize counterparty to hold currency", false);
	withTxOptions(cmd).action(
		(currency: string, issuer: string, opts: TrustSetOpts) =>
			setTrustLine(currency, issuer, opts, program.opts() as GlobalOptions),
	);
}

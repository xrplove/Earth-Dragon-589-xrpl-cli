import type { Command } from "commander";
import { type MPTokenAuthorize, MPTokenAuthorizeFlags } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validateMptId } from "../../lib/validate.js";
import { withWalletOptions } from "../../lib/wallet-options.js";

interface MptAuthorizeOpts extends TxOptions {
	holder?: string;
	unauthorize: boolean;
}

async function mptAuthorize(
	mptIssuanceId: string,
	opts: MptAuthorizeOpts,
	globalOpts: GlobalOptions,
) {
	validateMptId(mptIssuanceId, "MPT issuance ID");

	const tx: Omit<MPTokenAuthorize, "Account"> = {
		TransactionType: "MPTokenAuthorize",
		MPTokenIssuanceID: mptIssuanceId,
	};

	if (opts.holder) tx.Holder = resolve(opts.holder);
	if (opts.unauthorize) tx.Flags = MPTokenAuthorizeFlags.tfMPTUnauthorize;

	const wallet = await loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerMptAuthorize(program: Command) {
	const cmd = program
		.command("mpt-authorize")
		.description("Authorize or unauthorize an MPT holder")
		.argument("<mpt-issuance-id>", "MPT issuance ID (48-char hex)")
		.option("--holder <address>", "Holder account to authorize (issuer only)")
		.option("--unauthorize", "Revoke authorization", false);
	withWalletOptions(withTxOptions(cmd)).action(
		(mptIssuanceId: string, opts: MptAuthorizeOpts) =>
			mptAuthorize(mptIssuanceId, opts, cmd.optsWithGlobals() as GlobalOptions),
	);
}

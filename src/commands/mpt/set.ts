import { type Command, Option } from "commander";
import { type MPTokenIssuanceSet, MPTokenIssuanceSetFlags } from "xrpl";
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

interface MptSetOpts extends TxOptions {
	holder?: string;
	lock: boolean;
	unlock: boolean;
}

async function mptSet(
	mptIssuanceId: string,
	opts: MptSetOpts,
	globalOpts: GlobalOptions,
) {
	validateMptId(mptIssuanceId, "MPT issuance ID");

	const tx: Omit<MPTokenIssuanceSet, "Account"> = {
		TransactionType: "MPTokenIssuanceSet",
		MPTokenIssuanceID: mptIssuanceId,
	};

	if (opts.holder) tx.Holder = resolve(opts.holder);

	let flags = 0;
	if (opts.lock) flags |= MPTokenIssuanceSetFlags.tfMPTLock;
	if (opts.unlock) flags |= MPTokenIssuanceSetFlags.tfMPTUnlock;
	if (flags) tx.Flags = flags;

	const wallet = await loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerMptSet(program: Command) {
	const cmd = program
		.command("mpt-set")
		.description("Modify MPT issuance properties")
		.argument("<mpt-issuance-id>", "MPT issuance ID (48-char hex)")
		.option("--holder <address>", "Lock/unlock a specific holder")
		.addOption(
			new Option("--lock", "Lock the token or holder")
				.default(false)
				.conflicts("unlock"),
		)
		.addOption(
			new Option("--unlock", "Unlock the token or holder")
				.default(false)
				.conflicts("lock"),
		);
	withTxOptions(cmd).action((mptIssuanceId: string, opts: MptSetOpts) =>
		mptSet(mptIssuanceId, opts, program.opts() as GlobalOptions),
	);
}

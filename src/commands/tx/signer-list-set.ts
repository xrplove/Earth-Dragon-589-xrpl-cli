import type { Command } from "commander";
import type { SignerListSet } from "xrpl";
import { withClient } from "../../lib/client.js";
import { signerEntry } from "../../lib/schemas.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

interface SignerListSetOpts extends TxOptions {
	quorum: number;
	signer: string[];
}

async function setSignerList(
	opts: SignerListSetOpts,
	globalOpts: GlobalOptions,
) {
	const wallet = loadWalletForTx(opts, globalOpts);
	const signerEntries = opts.signer.map((s) => signerEntry.parse(s));

	const tx: Omit<SignerListSet, "Account"> = {
		TransactionType: "SignerListSet",
		SignerQuorum: opts.quorum,
		SignerEntries: signerEntries,
	};

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerSignerListSet(program: Command) {
	const cmd = program
		.command("signer-list-set")
		.description("Set or update the signer list on an account")
		.requiredOption("--quorum <quorum>", "Target weight threshold", Number)
		.requiredOption(
			"--signer <address:weight>",
			"Signer entry (repeatable)",
			(val: string, prev: string[]) => [...prev, val],
			[] as string[],
		);
	withTxOptions(cmd).action((opts: SignerListSetOpts) =>
		setSignerList(opts, program.opts() as GlobalOptions),
	);
}

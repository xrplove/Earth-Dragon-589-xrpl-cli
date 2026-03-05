import type { Command } from "commander";
import type { Transaction } from "xrpl";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import { signerEntry } from "../../lib/schemas.js";
import { submitOrPrepare } from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { loadWallet } from "../../lib/wallet.js";

interface SignerListSetOpts extends TxOptions {
	quorum: number;
	signer: string[];
}

async function setSignerList(
	opts: SignerListSetOpts,
	globalOpts: GlobalOptions,
) {
	const wallet = opts.prepare ? null : loadWallet(globalOpts);
	const signerEntries = opts.signer.map((s) => signerEntry.parse(s));

	const tx: Transaction = {
		TransactionType: "SignerListSet",
		Account: wallet?.address ?? "",
		SignerQuorum: opts.quorum,
		SignerEntries: signerEntries,
	} as unknown as Transaction;

	await withClient(globalOpts, async (client) => {
		if (!tx.Account) {
			throw new Error(
				"Account is required in --prepare mode. Use --seed, --keyfile, or set XRPL_SEED.",
			);
		}
		const result = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		output(result.mode === "prepared" ? result.tx : result.result, globalOpts);
	});
}

export function registerSignerListSet(program: Command) {
	program
		.command("signer-list-set")
		.description("Set or update the signer list on an account")
		.requiredOption("--quorum <quorum>", "Target weight threshold", Number)
		.requiredOption(
			"--signer <address:weight>",
			"Signer entry (repeatable)",
			(val: string, prev: string[]) => [...prev, val],
			[] as string[],
		)
		.option(
			"--prepare",
			"Output unsigned transaction JSON instead of submitting",
			false,
		)
		.option("--signers <n>", "Number of signers for multi-sign fee", Number)
		.option(
			"--memo <memo>",
			"Attach memo (repeatable)",
			(val: string, prev: string[]) => [...prev, val],
			[] as string[],
		)
		.option("--ticket <seq>", "Use a ticket instead of sequence number", Number)
		.action((opts: SignerListSetOpts) =>
			setSignerList(opts, program.opts() as GlobalOptions),
		);
}

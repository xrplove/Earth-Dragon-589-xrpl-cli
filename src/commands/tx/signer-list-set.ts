import type { Command } from "commander";
import type { Transaction } from "xrpl";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import { submitOrPrepare } from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { loadWallet } from "../../lib/wallet.js";

interface SignerListSetOpts extends TxOptions {
	quorum: number;
	signer: string[];
}

function parseSignerEntry(entry: string) {
	const [address, weightStr] = entry.split(":");
	if (!address || !weightStr) {
		throw new Error(
			`Invalid signer format: "${entry}". Expected <address>:<weight>.`,
		);
	}
	const weight = Number(weightStr);
	if (!Number.isInteger(weight) || weight < 1) {
		throw new Error(
			`Invalid signer weight: "${weightStr}". Must be a positive integer.`,
		);
	}
	return { SignerEntry: { Account: address, SignerWeight: weight } };
}

async function setSignerList(
	opts: SignerListSetOpts,
	globalOpts: GlobalOptions,
) {
	const wallet = opts.prepare ? null : loadWallet(globalOpts);
	const signerEntries = opts.signer.map(parseSignerEntry);

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

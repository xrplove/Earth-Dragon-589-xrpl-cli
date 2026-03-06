import { readFileSync } from "node:fs";
import type { Command } from "commander";
import type { Signer } from "xrpl";
import { decodeAccountID } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

interface SignedTx {
	Signers?: Signer[];
	[key: string]: unknown;
}

function collectSigners(
	txJsonArgs: string[],
	files: string[] | undefined,
): { baseTx: SignedTx; signers: Signer[] } {
	const txs: SignedTx[] = [];

	for (const arg of txJsonArgs) {
		txs.push(JSON.parse(arg));
	}

	if (files) {
		for (const file of files) {
			txs.push(JSON.parse(readFileSync(file, "utf-8")));
		}
	}

	if (txs.length === 0) {
		throw new Error("Provide signed transactions as arguments or use --files.");
	}

	const signers: Signer[] = [];
	for (const tx of txs) {
		if (!tx.Signers?.length) {
			throw new Error("Each signed transaction must have a Signers array.");
		}
		signers.push(...tx.Signers);
	}

	// Sort by numeric account ID (protocol requirement)
	signers.sort((a, b) => {
		const aId = Buffer.from(decodeAccountID(a.Signer.Account));
		const bId = Buffer.from(decodeAccountID(b.Signer.Account));
		return Buffer.compare(aId, bId);
	});

	// Use the first tx as the base, replacing Signers with the merged set
	const { Signers: _, ...baseTx } = txs[0];
	return { baseTx: baseTx as SignedTx, signers };
}

async function combineSignatures(
	txJsonArgs: string[],
	opts: { files?: string[] },
	globalOpts: GlobalOptions,
) {
	const { baseTx, signers } = collectSigners(txJsonArgs, opts.files);
	output({ ...baseTx, Signers: signers }, globalOpts);
}

export { collectSigners };

export function registerMultisignCombine(program: Command) {
	program
		.command("multisign-combine")
		.description("Combine multiple individually-signed transactions into one")
		.argument("[signed-tx-json...]", "Signed transaction JSON strings")
		.option(
			"--files <paths...>",
			"Paths to JSON files containing signed transactions",
		)
		.action((txJsonArgs: string[], opts: { files?: string[] }) =>
			combineSignatures(txJsonArgs, opts, program.opts() as GlobalOptions),
		);
}

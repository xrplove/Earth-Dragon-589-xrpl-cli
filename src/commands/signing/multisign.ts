import type { Command } from "commander";
import { decode } from "xrpl";
import { output } from "../../lib/output.js";
import { readTx } from "../../lib/tx-input.js";
import type { GlobalOptions } from "../../lib/types.js";
import { loadWallet } from "../../lib/wallet.js";
import { withWalletOptions } from "../../lib/wallet-options.js";

async function multisignTransaction(
	txJson: string | undefined,
	opts: { file?: string; multisigAccount: string },
	globalOpts: GlobalOptions,
) {
	const wallet = await loadWallet(globalOpts);
	const tx = readTx(txJson, opts.file);

	if (tx.SigningPubKey !== "") {
		throw new Error(
			'Transaction must have SigningPubKey: "" for multi-signing. Use --prepare or build.',
		);
	}

	const signed = wallet.sign(tx, true);
	const decoded = decode(signed.tx_blob) as Record<string, unknown>;
	const signers = decoded.Signers;

	output({ ...tx, Signers: signers }, globalOpts);
}

export function registerMultisign(program: Command) {
	const cmd = program
		.command("multisign")
		.description("Add a signer's signature to a transaction for multi-signing")
		.argument("[tx-json]", "Transaction JSON as a string argument")
		.option("--file <path>", "Path to a JSON file containing the transaction")
		.requiredOption(
			"--multisig-account <address>",
			"The multisig account address this signature is for",
		);
	withWalletOptions(cmd).action(
		(
			txJson: string | undefined,
			opts: { file?: string; multisigAccount: string },
		) =>
			multisignTransaction(
				txJson,
				opts,
				cmd.optsWithGlobals() as GlobalOptions,
			),
	);
}

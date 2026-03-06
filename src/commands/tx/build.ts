import type { Command } from "commander";
import type { SubmittableTransaction } from "xrpl";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import { parseFields } from "../../lib/parsing.js";
import { calcSignersFee } from "../../lib/tx.js";
import type { GlobalOptions } from "../../lib/types.js";
import { loadWallet } from "../../lib/wallet.js";

async function buildTransaction(
	txType: string,
	opts: { signers?: number },
	cmd: Command,
	globalOpts: GlobalOptions,
) {
	const rawArgs = cmd.parseOptions(cmd.args).unknown;
	const fields: Record<string, unknown> = {
		TransactionType: txType,
		...parseFields(rawArgs),
	};

	if (!fields.Account) {
		try {
			fields.Account = (await loadWallet(globalOpts)).address;
		} catch {
			// Account must be in the fields
		}
	}

	await withClient(globalOpts, async (client) => {
		const tx = fields as unknown as SubmittableTransaction;

		if (opts.signers != null) {
			tx.Fee = await calcSignersFee(client, tx.Fee, opts.signers);
		}

		const autofilled = (await client.autofill(tx)) as Record<string, unknown>;
		autofilled.SigningPubKey = "";

		output(autofilled, globalOpts);
	});
}

export function registerBuild(program: Command) {
	program
		.command("build")
		.description(
			"Build a transaction: autofill sequence/fee/ledger, output unsigned JSON",
		)
		.argument("<TransactionType>", "XRPL transaction type (e.g. Payment)")
		.option("--signers <n>", "Number of signers for multi-sign fee", Number)
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action((txType: string, opts: { signers?: number }, cmd: Command) =>
			buildTransaction(txType, opts, cmd, program.opts() as GlobalOptions),
		);
}

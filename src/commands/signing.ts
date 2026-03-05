import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { decode, type Transaction } from "xrpl";
import { withClient } from "../lib/client.js";
import { output } from "../lib/output.js";
import type { GlobalOptions } from "../lib/types.js";
import { loadWallet } from "../lib/wallet.js";

export function registerSigningCommands(program: Command) {
	program
		.command("sign")
		.description("Sign a transaction (from JSON) without submitting")
		.argument("[tx-json]", "Transaction JSON as a string argument")
		.option("--file <path>", "Path to a JSON file containing the transaction")
		.option(
			"--multisign [account]",
			"Sign for multi-signing, optionally specify the multisig account",
		)
		.action(
			async (
				txJson: string | undefined,
				opts: { file?: string; multisign?: string | true },
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				const wallet = loadWallet(globalOpts);

				let tx: Transaction;
				if (opts.file) {
					const raw = readFileSync(opts.file, "utf-8");
					tx = JSON.parse(raw);
				} else if (txJson) {
					tx = JSON.parse(txJson);
				} else {
					throw new Error(
						"Provide transaction JSON as an argument or use --file.",
					);
				}

				const multisign = opts.multisign != null;
				const signed = wallet.sign(tx, multisign);

				output(
					{
						tx_blob: signed.tx_blob,
						hash: signed.hash,
					},
					globalOpts,
				);
			},
		);

	program
		.command("submit")
		.description("Submit a raw signed transaction blob")
		.argument("<tx-blob>", "Hex-encoded signed transaction blob")
		.option(
			"--fail-hard",
			"Fail immediately with tec-class errors instead of queuing",
			false,
		)
		.action(async (txBlob: string, opts: { failHard: boolean }) => {
			const globalOpts = program.opts() as GlobalOptions;
			await withClient(globalOpts, async (client) => {
				const resp = await client.request({
					command: "submit",
					tx_blob: txBlob,
					fail_hard: opts.failHard || undefined,
				});
				output(resp.result, globalOpts);
			});
		});

	program
		.command("build")
		.description(
			"Build a transaction: autofill sequence/fee/ledger, output unsigned JSON",
		)
		.argument("<TransactionType>", "XRPL transaction type (e.g. Payment)")
		.option("--signers <n>", "Number of signers for multi-sign fee", Number)
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action(
			async (txType: string, opts: { signers?: number }, cmd: Command) => {
				const globalOpts = program.opts() as GlobalOptions;

				// Parse remaining unknown options as transaction fields
				const rawArgs = cmd.parseOptions(cmd.args).unknown;

				const fields: Record<string, unknown> = {
					TransactionType: txType,
				};

				// We need an Account for autofill — try from wallet
				try {
					const wallet = loadWallet(globalOpts);
					fields.Account = wallet.address;
				} catch {
					// Account must be in the fields
				}

				// Parse --Key value pairs from unknown args
				for (let i = 0; i < rawArgs.length; i++) {
					const arg = rawArgs[i];
					if (arg.startsWith("--")) {
						const key = arg.slice(2);
						const value = rawArgs[i + 1];
						if (value === undefined || value.startsWith("--")) {
							fields[key] = true;
						} else {
							// Parse JSON objects/arrays; keep everything else as strings
							if (
								value.startsWith("{") ||
								value.startsWith("[") ||
								value === "true" ||
								value === "false"
							) {
								try {
									fields[key] = JSON.parse(value);
								} catch {
									fields[key] = value;
								}
							} else {
								fields[key] = value;
							}
							i++;
						}
					}
				}

				await withClient(globalOpts, async (client) => {
					const tx = fields as unknown as Transaction;

					if (opts.signers != null) {
						const baseFee = Number(
							(await client.request({ command: "fee" })).result.drops
								.base_fee ?? "10",
						);
						tx.Fee = String(baseFee * (opts.signers + 1));
					}

					const autofilled = (await client.autofill(tx as never)) as Record<
						string,
						unknown
					>;
					autofilled.SigningPubKey = "";

					output(autofilled, globalOpts);
				});
			},
		);

	program
		.command("decode-tx")
		.description("Decode a raw transaction blob into readable JSON")
		.argument("<tx-blob>", "Hex-encoded transaction blob")
		.action(async (txBlob: string) => {
			const globalOpts = program.opts() as GlobalOptions;
			const decoded = decode(txBlob);
			output(decoded, globalOpts);
		});
}

import type { Command } from "commander";
import type { Client, Transaction, Wallet } from "xrpl";
import { parseMemos } from "./memo.js";
import { info, output } from "./output.js";
import type { GlobalOptions, TxOptions } from "./types.js";
import { EXIT_CODES } from "./types.js";
import { loadWallet } from "./wallet.js";

export function withTxOptions(cmd: Command): Command {
	return cmd
		.option("--prepare", "Output unsigned JSON instead of submitting", false)
		.option("--signers <n>", "Number of signers for multi-sign fee", Number)
		.option("--memo <memo...>", "Memo in type:data format (repeatable)")
		.option("--ticket <n>", "Use a ticket instead of sequence number", Number);
}

export async function calcSignersFee(
	client: Client,
	existingFee: string | undefined,
	signers: number,
): Promise<string> {
	const baseFee = Number(
		existingFee ??
			(await client.request({ command: "fee" })).result.drops.base_fee ??
			"10",
	);
	return String(baseFee * (signers + 1));
}

/**
 * Apply shared transaction options (--prepare, --signers, --memo, --ticket)
 * to a transaction object before signing/submitting.
 */
export function applyTxOptions(
	tx: Transaction,
	txOpts: TxOptions,
): Transaction {
	if (txOpts.memo?.length) {
		tx.Memos = parseMemos(txOpts.memo);
	}

	if (txOpts.ticket != null) {
		tx.TicketSequence = txOpts.ticket;
		tx.Sequence = 0;
	}

	if (txOpts.prepare || txOpts.signers != null) {
		tx.SigningPubKey = "";
	}

	return tx;
}

/**
 * Autofill, then either prepare (output JSON) or sign & submit.
 */
export type TxOutcome =
	| { mode: "prepared"; tx: Transaction }
	| { mode: "submitted"; result: unknown };

export async function submitOrPrepare(
	client: Client,
	wallet: Wallet | null,
	tx: Transaction,
	txOpts: TxOptions,
	globalOpts: GlobalOptions,
): Promise<TxOutcome> {
	if (txOpts.signers != null) {
		tx.Fee = await calcSignersFee(client, tx.Fee, txOpts.signers);
	}

	const autofilled = await client.autofill(tx);
	applyTxOptions(autofilled, txOpts);

	if (txOpts.prepare || txOpts.signers != null) {
		return { mode: "prepared", tx: autofilled };
	}

	if (!wallet) {
		throw new Error(
			"Wallet required for signing. Use --seed, --keyfile, or set XRPL_SEED.",
		);
	}

	info("Signing and submitting transaction...", globalOpts);
	const response = await client.submitAndWait(autofilled, { wallet });
	const resultCode =
		response.result.meta &&
		typeof response.result.meta === "object" &&
		"TransactionResult" in response.result.meta
			? (response.result.meta as { TransactionResult: string })
					.TransactionResult
			: undefined;

	if (resultCode && resultCode !== "tesSUCCESS") {
		process.exitCode = resultCode.startsWith("tec")
			? EXIT_CODES.TX_REJECTED
			: EXIT_CODES.GENERAL_ERROR;
	}

	return { mode: "submitted", result: response.result };
}

export function outputResult(outcome: TxOutcome, globalOpts: GlobalOptions) {
	output(outcome.mode === "prepared" ? outcome.tx : outcome.result, globalOpts);
}

export function loadWalletForTx(
	txOpts: TxOptions,
	globalOpts: GlobalOptions,
): Wallet | null {
	return txOpts.prepare || txOpts.signers != null
		? null
		: loadWallet(globalOpts);
}

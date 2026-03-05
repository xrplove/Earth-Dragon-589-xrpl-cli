import type { Client, Transaction, Wallet } from "xrpl";
import { parseMemos } from "./memo.js";
import { info } from "./output.js";
import type { GlobalOptions, TxOptions } from "./types.js";
import { EXIT_CODES } from "./types.js";

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
export async function submitOrPrepare(
	client: Client,
	wallet: Wallet | null,
	tx: Transaction,
	txOpts: TxOptions,
	globalOpts: GlobalOptions,
): Promise<{ prepared?: Transaction; result?: unknown }> {
	if (txOpts.signers != null) {
		tx.Fee = await calcSignersFee(client, tx.Fee, txOpts.signers);
	}

	const autofilled = await client.autofill(tx);
	applyTxOptions(autofilled, txOpts);

	if (txOpts.prepare || txOpts.signers != null) {
		return { prepared: autofilled };
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
		const code = resultCode.startsWith("tec")
			? EXIT_CODES.TX_REJECTED
			: EXIT_CODES.GENERAL_ERROR;
		return { result: { ...response.result, _exitCode: code } };
	}

	return { result: response.result };
}

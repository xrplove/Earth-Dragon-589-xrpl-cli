import { readFileSync } from "node:fs";
import type { Transaction } from "xrpl";

export function readTx(
	txJson: string | undefined,
	file: string | undefined,
): Transaction {
	if (file) {
		return JSON.parse(readFileSync(file, "utf-8"));
	}
	if (txJson) {
		return JSON.parse(txJson);
	}
	throw new Error("Provide transaction JSON as an argument or use --file.");
}

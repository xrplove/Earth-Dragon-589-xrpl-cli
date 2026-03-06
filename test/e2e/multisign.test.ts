import { describe, expect, it } from "vitest";
import { fundWallet, runJson, TESTNET_ARGS } from "./helpers.js";

describe("e2e: multi-signing", () => {
	it("2-of-3 multisig: signer-list-set → send --prepare → multisign → multisign-submit", async () => {
		// Fund the multisig account and 3 signer accounts
		const multisig = await fundWallet();
		const signer1 = await fundWallet();
		const signer2 = await fundWallet();
		const signer3 = await fundWallet();
		const receiver = await fundWallet();

		// Set up a 2-of-3 signer list (each signer has weight 1, quorum is 2)
		const signerListResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			multisig.seed,
			"signer-list-set",
			"--quorum",
			"2",
			"--signer",
			`${signer1.address}:1`,
			"--signer",
			`${signer2.address}:1`,
			"--signer",
			`${signer3.address}:1`,
		);
		expect(signerListResult).toBeDefined();

		// Prepare an unsigned payment from the multisig account (--signers 2 sets the fee)
		const unsigned = await runJson(
			...TESTNET_ARGS,
			"-s",
			multisig.seed,
			"send",
			"--to",
			receiver.address,
			"--amount",
			"5",
			"--token",
			"XRP",
			"--prepare",
			"--signers",
			"2",
		);
		expect(unsigned.SigningPubKey).toBe("");
		expect(unsigned.TransactionType).toBe("Payment");

		const unsignedJson = JSON.stringify(unsigned);

		// Sign with signer1
		const sig1 = await runJson(
			"-s",
			signer1.seed,
			"multisign",
			unsignedJson,
			"--account",
			multisig.address,
		);
		expect(sig1.Signers).toBeDefined();
		const signers1 = sig1.Signers as Array<Record<string, unknown>>;
		expect(signers1).toHaveLength(1);

		// Sign with signer2
		const sig2 = await runJson(
			"-s",
			signer2.seed,
			"multisign",
			unsignedJson,
			"--account",
			multisig.address,
		);
		expect(sig2.Signers).toBeDefined();

		// Combine and submit both signatures
		const submitResult = await runJson(
			...TESTNET_ARGS,
			"multisign-submit",
			JSON.stringify(sig1),
			JSON.stringify(sig2),
		);
		expect(submitResult).toBeDefined();
		const engineResult =
			(submitResult.engine_result as string) ??
			(submitResult as Record<string, unknown>).engine_result;
		expect(engineResult).toBe("tesSUCCESS");

		// Wait for the transaction to be validated, then verify receiver got the 5 XRP
		const hash = (submitResult.tx_json as Record<string, unknown>)
			?.hash as string;
		expect(hash).toBeTypeOf("string");

		// Poll tx until validated (up to 15s)
		let validated = false;
		for (let i = 0; i < 15; i++) {
			try {
				const txResult = await runJson(...TESTNET_ARGS, "tx", hash);
				if (txResult.validated) {
					validated = true;
					break;
				}
			} catch {
				// tx not found yet
			}
			await new Promise((r) => setTimeout(r, 1000));
		}
		expect(validated).toBe(true);

		const afterBalance = await runJson(
			...TESTNET_ARGS,
			"balance",
			receiver.address,
		);
		const after = Number(afterBalance.balance);
		// Receiver was funded with some XRP + should have received 5 XRP
		expect(after).toBeGreaterThan(5_000_000);
	});
});

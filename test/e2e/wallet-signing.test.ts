import { describe, expect, it } from "vitest";
import { fundWallet, runJson, TESTNET_ARGS } from "./helpers.js";

describe("e2e: wallet & signing", () => {
	it.concurrent("wallet generate produces valid keypair", async () => {
		const result = await runJson("wallet", "generate");
		expect(result.address).toBeTypeOf("string");
		expect((result.address as string).startsWith("r")).toBe(true);
		expect(result.seed).toBeTypeOf("string");
		expect((result.seed as string).startsWith("s")).toBe(true);
		expect(result.publicKey).toBeTypeOf("string");
		expect(result.privateKey).toBeTypeOf("string");
	});

	it.concurrent("wallet generate --algorithm secp256k1 works", async () => {
		const result = await runJson(
			"wallet",
			"generate",
			"--algorithm",
			"secp256k1",
		);
		expect(result.address).toBeTypeOf("string");
		// secp256k1 public keys don't start with ED
		expect((result.publicKey as string).startsWith("ED")).toBe(false);
	});

	it.concurrent("wallet from-seed reproduces the same address", async () => {
		const generated = await runJson("wallet", "generate");
		const derived = await runJson(
			"wallet",
			"from-seed",
			generated.seed as string,
		);
		expect(derived.address).toBe(generated.address);
		expect(derived.publicKey).toBe(generated.publicKey);
	});

	it.concurrent("wallet fund creates and funds a new account on testnet", async () => {
		const result = await fundWallet();
		expect(result.address).toBeTypeOf("string");
		expect(result.seed).toBeTypeOf("string");
	});

	it.concurrent("wallet fund → balance round-trip", async () => {
		const funded = await fundWallet();

		// Verify balance via the balance command
		const balance = await runJson(...TESTNET_ARGS, "balance", funded.address);
		expect(balance.currency).toBe("XRP");
		expect(Number(balance.balance)).toBeGreaterThan(0);
	});

	it.concurrent("build → sign → submit round-trip on testnet", async () => {
		const sender = await fundWallet();
		const receiver = await fundWallet();

		// Build a Payment transaction
		const built = await runJson(
			...TESTNET_ARGS,
			"build",
			"-s",
			sender.seed,
			"Payment",
			"--Destination",
			receiver.address,
			"--Amount",
			"1000000",
		);
		expect(built.TransactionType).toBe("Payment");
		expect(built.SigningPubKey).toBe("");

		// Sign the transaction
		const signed = await runJson(
			"sign",
			"-s",
			sender.seed,
			JSON.stringify(built),
		);
		expect(signed.tx_blob).toBeTypeOf("string");
		expect(signed.hash).toBeTypeOf("string");

		// Submit the signed blob
		const submitted = await runJson(
			...TESTNET_ARGS,
			"submit",
			signed.tx_blob as string,
		);
		expect(submitted).toBeDefined();
	});

	it.concurrent("decode-tx decodes a signed blob", async () => {
		// Generate a wallet and sign a minimal tx to get a blob
		const wallet = await runJson("wallet", "generate");
		const signed = await runJson(
			"sign",
			"-s",
			wallet.seed as string,
			JSON.stringify({
				TransactionType: "Payment",
				Account: wallet.address,
				Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
				Amount: "1000000",
				Sequence: 1,
				Fee: "12",
				LastLedgerSequence: 100,
			}),
		);

		const decoded = await runJson("decode-tx", signed.tx_blob as string);
		expect(decoded.TransactionType).toBe("Payment");
		expect(decoded.Account).toBe(wallet.address);
	});
});

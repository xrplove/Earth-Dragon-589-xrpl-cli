import { describe, expect, it } from "vitest";
import { run, runJson, TESTNET_ARGS } from "./helpers.js";

describe("e2e: wallet & signing", () => {
	it("wallet generate produces valid keypair", async () => {
		const result = await runJson("wallet", "generate");
		expect(result.address).toBeTypeOf("string");
		expect((result.address as string).startsWith("r")).toBe(true);
		expect(result.seed).toBeTypeOf("string");
		expect((result.seed as string).startsWith("s")).toBe(true);
		expect(result.publicKey).toBeTypeOf("string");
		expect(result.privateKey).toBeTypeOf("string");
	});

	it("wallet generate --algorithm secp256k1 works", async () => {
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

	it("wallet from-seed reproduces the same address", async () => {
		const generated = await runJson("wallet", "generate");
		const derived = await runJson(
			"wallet",
			"from-seed",
			generated.seed as string,
		);
		expect(derived.address).toBe(generated.address);
		expect(derived.publicKey).toBe(generated.publicKey);
	});

	it("wallet fund creates and funds a new account on testnet", async () => {
		const result = await runJson(...TESTNET_ARGS, "wallet", "fund");
		expect(result.address).toBeTypeOf("string");
		expect(result.seed).toBeTypeOf("string");
		expect(result.balance).toBeTypeOf("number");
		expect(result.balance as number).toBeGreaterThan(0);
	}, 30_000);

	it("wallet generate → fund → balance round-trip", async () => {
		// Fund a fresh wallet and check balance
		const funded = await runJson(...TESTNET_ARGS, "wallet", "fund");
		const address = funded.address as string;

		// Verify balance via the balance command
		const balance = await runJson(...TESTNET_ARGS, "balance", address);
		expect(balance.currency).toBe("XRP");
		expect(Number(balance.balance)).toBeGreaterThan(0);
	}, 30_000);

	it("build → sign → submit round-trip on testnet", async () => {
		// Fund two wallets
		const sender = await runJson(...TESTNET_ARGS, "wallet", "fund");
		const receiver = await runJson(...TESTNET_ARGS, "wallet", "fund");

		// Build a Payment transaction
		const built = await runJson(
			...TESTNET_ARGS,
			"-s",
			sender.seed as string,
			"build",
			"Payment",
			"--Destination",
			receiver.address as string,
			"--Amount",
			"1000000",
		);
		expect(built.TransactionType).toBe("Payment");
		expect(built.SigningPubKey).toBe("");

		// Sign the transaction
		const signed = await runJson(
			"-s",
			sender.seed as string,
			"sign",
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
	}, 60_000);

	it("decode-tx decodes a signed blob", async () => {
		// Generate a wallet and sign a minimal tx to get a blob
		const wallet = await runJson("wallet", "generate");
		const signed = await runJson(
			"-s",
			wallet.seed as string,
			"sign",
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

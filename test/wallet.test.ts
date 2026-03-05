import { describe, expect, it } from "vitest";
import { Wallet } from "xrpl";
import { formatWallet, parseAlgorithm } from "../src/commands/wallet/shared.js";
import { algorithm, entropy } from "../src/lib/schemas.js";

describe("parseAlgorithm", () => {
	it("returns ed25519 ECDSA constant", () => {
		expect(parseAlgorithm("ed25519")).toBe("ed25519");
	});

	it("returns ecdsa-secp256k1 ECDSA constant", () => {
		expect(parseAlgorithm("secp256k1")).toBe("ecdsa-secp256k1");
	});

	it("rejects invalid algorithm", () => {
		expect(() => parseAlgorithm("rsa")).toThrow();
	});
});

describe("formatWallet", () => {
	it("formats wallet fields into a plain object", () => {
		const wallet = Wallet.generate("ed25519");
		const formatted = formatWallet(wallet);
		expect(formatted).toEqual({
			address: wallet.address,
			publicKey: wallet.publicKey,
			privateKey: wallet.privateKey,
			seed: wallet.seed,
		});
	});

	it("uses empty string when seed is undefined", () => {
		const wallet = Wallet.generate("ed25519");
		// Simulate a wallet without a seed
		const noSeedWallet = { ...wallet, seed: undefined } as unknown as Wallet;
		const formatted = formatWallet(noSeedWallet);
		expect(formatted.seed).toBe("");
	});
});

describe("algorithm schema", () => {
	it("accepts ed25519", () => {
		expect(algorithm.parse("ed25519")).toBe("ed25519");
	});

	it("accepts secp256k1", () => {
		expect(algorithm.parse("secp256k1")).toBe("secp256k1");
	});

	it("rejects invalid values", () => {
		expect(() => algorithm.parse("invalid")).toThrow();
	});
});

describe("entropy schema", () => {
	it("accepts valid 32-char hex", () => {
		expect(entropy.parse("0102030405060708090a0b0c0d0e0f10")).toBe(
			"0102030405060708090a0b0c0d0e0f10",
		);
	});

	it("rejects wrong length", () => {
		expect(() => entropy.parse("0102")).toThrow();
	});

	it("rejects non-hex characters", () => {
		expect(() => entropy.parse("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz")).toThrow();
	});
});

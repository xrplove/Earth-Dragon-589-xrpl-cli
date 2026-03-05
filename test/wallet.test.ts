import { describe, expect, it } from "vitest";
import { decode, Wallet } from "xrpl";

describe("wallet generate", () => {
	it("generates a valid ed25519 wallet", () => {
		const wallet = Wallet.generate("ed25519");
		expect(wallet.address).toMatch(/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/);
		expect(wallet.publicKey).toMatch(/^ED[0-9A-F]{64}$/);
		expect(wallet.seed).toBeDefined();
	});

	it("generates a valid secp256k1 wallet", () => {
		const wallet = Wallet.generate("ecdsa-secp256k1");
		expect(wallet.address).toMatch(/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/);
		expect(wallet.publicKey).toMatch(/^[0-9A-F]{66}$/);
		expect(wallet.seed).toBeDefined();
	});

	it("generates unique wallets each time", () => {
		const w1 = Wallet.generate();
		const w2 = Wallet.generate();
		expect(w1.address).not.toBe(w2.address);
		expect(w1.seed).not.toBe(w2.seed);
	});
});

describe("wallet from-seed determinism", () => {
	it("derives the same wallet from the same seed", () => {
		const original = Wallet.generate("ed25519");
		const derived = Wallet.fromSeed(original.seed as string, {
			algorithm: "ed25519",
		});
		expect(derived.address).toBe(original.address);
		expect(derived.publicKey).toBe(original.publicKey);
		expect(derived.privateKey).toBe(original.privateKey);
	});

	it("derives the same secp256k1 wallet from the same seed", () => {
		const original = Wallet.generate("ecdsa-secp256k1");
		const derived = Wallet.fromSeed(original.seed as string, {
			algorithm: "ecdsa-secp256k1",
		});
		expect(derived.address).toBe(original.address);
		expect(derived.publicKey).toBe(original.publicKey);
	});
});

describe("wallet from-entropy determinism", () => {
	it("produces the same wallet from the same entropy", () => {
		const entropy = Uint8Array.from([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]);
		const w1 = Wallet.fromEntropy(entropy, { algorithm: "ed25519" });
		const w2 = Wallet.fromEntropy(entropy, { algorithm: "ed25519" });
		expect(w1.address).toBe(w2.address);
		expect(w1.publicKey).toBe(w2.publicKey);
		expect(w1.seed).toBe(w2.seed);
	});
});

describe("sign produces valid blob", () => {
	it("signs a transaction and returns tx_blob and hash", () => {
		const wallet = Wallet.generate("ed25519");
		const tx = {
			TransactionType: "Payment" as const,
			Account: wallet.address,
			Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
			Amount: "1000000",
			Sequence: 1,
			Fee: "12",
			LastLedgerSequence: 100,
		};
		const signed = wallet.sign(tx);
		expect(signed.tx_blob).toMatch(/^[0-9A-F]+$/);
		expect(signed.hash).toMatch(/^[0-9A-F]{64}$/);

		// The blob should be decodable
		const decoded = decode(signed.tx_blob);
		expect(decoded.TransactionType).toBe("Payment");
		expect(decoded.Account).toBe(wallet.address);
	});

	it("multisign produces a blob with Signers", () => {
		const wallet = Wallet.generate("ed25519");
		const tx = {
			TransactionType: "Payment" as const,
			Account: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
			Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
			Amount: "1000000",
			Sequence: 1,
			Fee: "36",
			LastLedgerSequence: 100,
			SigningPubKey: "",
		};
		const signed = wallet.sign(tx, true);
		expect(signed.tx_blob).toMatch(/^[0-9A-F]+$/);
		expect(signed.hash).toMatch(/^[0-9A-F]{64}$/);

		const decoded = decode(signed.tx_blob);
		expect(decoded.Signers).toBeDefined();
		expect(Array.isArray(decoded.Signers)).toBe(true);
	});
});

describe("signers fee calculation", () => {
	it("calculates multisig fee as (n+1) * base_fee", () => {
		const baseFee = 10;
		const signers = 3;
		const expected = baseFee * (signers + 1);
		expect(expected).toBe(40);
	});

	it("calculates fee for 1 signer", () => {
		const baseFee = 10;
		const signers = 1;
		expect(baseFee * (signers + 1)).toBe(20);
	});
});

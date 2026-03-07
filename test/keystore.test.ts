import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Wallet } from "xrpl";
import {
	decryptSecret,
	encryptKeypair,
	encryptSeed,
	listKeystores,
	loadKeystore,
	removeKeystore,
	saveKeystore,
} from "../src/lib/keystore.js";

function generateSeed(): { seed: string; address: string; wallet: Wallet } {
	const wallet = Wallet.generate();
	return {
		seed: wallet.seed as string,
		address: wallet.classicAddress,
		wallet,
	};
}

describe("keystore", () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "xrpl-keystore-"));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("encrypts and decrypts a seed round-trip", () => {
		const { seed, address, wallet } = generateSeed();
		const password = "test-password-123";
		const keystore = encryptSeed("alice", seed, address, password);
		const secret = decryptSecret(keystore, password);
		expect(secret.type).toBe("seed");
		expect(secret.data).toBe(wallet.seed);
	});

	it("encrypts and decrypts a keypair round-trip", () => {
		const wallet = Wallet.generate();
		const password = "test-password-456";
		const keystore = encryptKeypair(
			"alice-kp",
			wallet.publicKey,
			wallet.privateKey,
			wallet.classicAddress,
			password,
		);
		const secret = decryptSecret(keystore, password);
		expect(secret.type).toBe("keypair");
		const { publicKey, privateKey } = JSON.parse(secret.data);
		expect(publicKey).toBe(wallet.publicKey);
		expect(privateKey).toBe(wallet.privateKey);
	});

	it("decryptSecret handles both types", () => {
		const { seed, address, wallet } = generateSeed();
		const pw = "pw";

		const seedKs = encryptSeed("s", seed, address, pw);
		const kpKs = encryptKeypair(
			"k",
			wallet.publicKey,
			wallet.privateKey,
			wallet.classicAddress,
			pw,
		);

		const seedSecret = decryptSecret(seedKs, pw);
		expect(seedSecret.type).toBe("seed");
		expect(seedSecret.data).toBe(wallet.seed);

		const kpSecret = decryptSecret(kpKs, pw);
		expect(kpSecret.type).toBe("keypair");
		const parsed = JSON.parse(kpSecret.data);
		expect(parsed.publicKey).toBe(wallet.publicKey);
	});

	it("fails to decrypt with wrong password", () => {
		const { seed, address } = generateSeed();
		const keystore = encryptSeed("bob", seed, address, "correct");
		expect(() => decryptSecret(keystore, "wrong")).toThrow();
	});

	it("stores the correct address", () => {
		const { seed, address } = generateSeed();
		const keystore = encryptSeed("charlie", seed, address, "pw");
		expect(keystore.address).toBe(address);
	});

	it("saves, loads, lists, and removes keystores", () => {
		const { seed, address } = generateSeed();
		const keystore = encryptSeed("dave", seed, address, "pw");

		saveKeystore(keystore, dir);
		const loaded = loadKeystore("dave", dir);
		expect(loaded.address).toBe(address);

		const list = listKeystores(dir);
		expect(list).toHaveLength(1);
		expect(list[0].name).toBe("dave");

		removeKeystore("dave", dir);
		expect(readdirSync(dir)).toHaveLength(0);
	});

	it("throws when loading a non-existent keystore", () => {
		expect(() => loadKeystore("nonexistent", dir)).toThrow();
	});

	it("throws when saving a duplicate name", () => {
		const { seed, address } = generateSeed();
		const keystore = encryptSeed("dup", seed, address, "pw");
		saveKeystore(keystore, dir);
		expect(() => saveKeystore(keystore, dir)).toThrow(/already exists/);
	});
});

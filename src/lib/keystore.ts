import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
	scryptSync,
} from "node:crypto";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

interface CryptoParams {
	cipher: "aes-128-ctr";
	ciphertext: string;
	cipherparams: { iv: string };
	kdf: "scrypt";
	kdfparams: {
		n: number;
		r: number;
		p: number;
		dklen: number;
		salt: string;
	};
	mac: string;
}

export type SecretType = "seed" | "keypair";

export interface KeystoreFile {
	version: 1;
	name: string;
	address: string;
	type: SecretType;
	crypto: CryptoParams;
}

const SCRYPT_N = 131072;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const DKLEN = 32;

function getKeystoreDir(): string {
	const xdgConfig = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
	return join(xdgConfig, "xrpl", "keystores");
}

function deriveKey(password: string, salt: Buffer): Buffer {
	return scryptSync(password, salt, DKLEN, {
		N: SCRYPT_N,
		r: SCRYPT_R,
		p: SCRYPT_P,
		maxmem: 256 * 1024 * 1024,
	}) as Buffer;
}

function computeMac(derivedKey: Buffer, ciphertext: Buffer): string {
	return createHash("sha256")
		.update(Buffer.concat([derivedKey.subarray(16, 32), ciphertext]))
		.digest("hex");
}

function encrypt(
	plaintext: string,
	password: string,
): { crypto: CryptoParams } {
	const salt = randomBytes(32);
	const iv = randomBytes(16);
	const derivedKey = deriveKey(password, salt);

	const cipher = createCipheriv("aes-128-ctr", derivedKey.subarray(0, 16), iv);
	const buf = Buffer.from(plaintext, "utf-8");
	const ciphertext = Buffer.concat([cipher.update(buf), cipher.final()]);

	const mac = computeMac(derivedKey, ciphertext);

	return {
		crypto: {
			cipher: "aes-128-ctr",
			ciphertext: ciphertext.toString("hex"),
			cipherparams: { iv: iv.toString("hex") },
			kdf: "scrypt",
			kdfparams: {
				n: SCRYPT_N,
				r: SCRYPT_R,
				p: SCRYPT_P,
				dklen: DKLEN,
				salt: salt.toString("hex"),
			},
			mac,
		},
	};
}

function decrypt(crypto: CryptoParams, password: string): string {
	const { kdfparams } = crypto;
	const salt = Buffer.from(kdfparams.salt, "hex");
	const derivedKey = deriveKey(password, salt);
	const ciphertext = Buffer.from(crypto.ciphertext, "hex");

	const mac = computeMac(derivedKey, ciphertext);
	if (mac !== crypto.mac) {
		throw new Error("Wrong password or corrupted keystore.");
	}

	const iv = Buffer.from(crypto.cipherparams.iv, "hex");
	const decipher = createDecipheriv(
		"aes-128-ctr",
		derivedKey.subarray(0, 16),
		iv,
	);
	const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	return plain.toString("utf-8");
}

export function encryptSeed(
	name: string,
	seed: string,
	address: string,
	password: string,
): KeystoreFile {
	return {
		version: 1,
		name,
		address,
		type: "seed",
		...encrypt(seed, password),
	};
}

export function encryptKeypair(
	name: string,
	publicKey: string,
	privateKey: string,
	address: string,
	password: string,
): KeystoreFile {
	const secret = JSON.stringify({ publicKey, privateKey });
	return {
		version: 1,
		name,
		address,
		type: "keypair",
		...encrypt(secret, password),
	};
}

export function decryptSecret(
	keystore: KeystoreFile,
	password: string,
): { type: SecretType; data: string } {
	const data = decrypt(keystore.crypto, password);
	return { type: keystore.type ?? "seed", data };
}

export function saveKeystore(keystore: KeystoreFile, dir?: string): string {
	const keystoreDir = dir ?? getKeystoreDir();
	mkdirSync(keystoreDir, { recursive: true });
	const filePath = join(keystoreDir, keystore.name);
	if (existsSync(filePath)) {
		throw new Error(
			`Keystore "${keystore.name}" already exists at ${filePath}`,
		);
	}
	writeFileSync(filePath, JSON.stringify(keystore, null, 2), "utf-8");
	return filePath;
}

export function loadKeystore(name: string, dir?: string): KeystoreFile {
	const keystoreDir = dir ?? getKeystoreDir();
	const filePath = join(keystoreDir, name);
	if (!existsSync(filePath)) {
		throw new Error(`Keystore "${name}" not found in ${keystoreDir}`);
	}
	return JSON.parse(readFileSync(filePath, "utf-8")) as KeystoreFile;
}

export function listKeystores(dir?: string): KeystoreFile[] {
	const keystoreDir = dir ?? getKeystoreDir();
	if (!existsSync(keystoreDir)) return [];
	return readdirSync(keystoreDir)
		.filter((f) => !f.startsWith("."))
		.map((f) => {
			const content = readFileSync(join(keystoreDir, f), "utf-8");
			return JSON.parse(content) as KeystoreFile;
		});
}

export function removeKeystore(name: string, dir?: string): void {
	const keystoreDir = dir ?? getKeystoreDir();
	const filePath = join(keystoreDir, name);
	if (!existsSync(filePath)) {
		throw new Error(`Keystore "${name}" not found in ${keystoreDir}`);
	}
	unlinkSync(filePath);
}

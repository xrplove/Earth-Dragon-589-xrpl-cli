import { existsSync, readFileSync } from "node:fs";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { Wallet } from "xrpl";
import { decryptSecret, loadKeystore } from "./keystore.js";
import { prompt } from "./prompt.js";
import type { GlobalOptions } from "./types.js";

export async function loadWallet(opts: GlobalOptions): Promise<Wallet> {
	const accountName = opts.account ?? opts.from;

	if (accountName) {
		return await loadFromKeystore(accountName, opts);
	}

	if (opts.mnemonic) {
		return walletFromMnemonic(opts.mnemonic, opts);
	}

	if (opts.interactive) {
		const seed = await prompt("Enter seed: ", true);
		if (!seed) throw new Error("No seed provided.");
		return Wallet.fromSeed(seed);
	}

	const seed = opts.seed ?? readSeedFromKeyfile(opts);

	if (!seed) {
		throw new Error(
			"No wallet seed provided. Use --seed, --keyfile, --account, --mnemonic, -i, or set XRPL_SEED.",
		);
	}

	return Wallet.fromSeed(seed);
}

async function loadFromKeystore(
	name: string,
	opts: GlobalOptions,
): Promise<Wallet> {
	const keystore = loadKeystore(name);
	const password = await getKeystorePassword(opts);
	const secret = decryptSecret(keystore, password);
	if (secret.type === "keypair") {
		const { publicKey, privateKey } = JSON.parse(secret.data) as {
			publicKey: string;
			privateKey: string;
		};
		return new Wallet(publicKey, privateKey);
	}
	return Wallet.fromSeed(secret.data);
}

async function getKeystorePassword(opts: GlobalOptions): Promise<string> {
	if (opts.password) return opts.password;
	if (opts.passwordFile) {
		return readFileSync(opts.passwordFile, "utf-8").trim();
	}
	return await prompt("Enter password: ", true);
}

function walletFromMnemonic(
	mnemonicInput: string,
	opts: GlobalOptions,
): Wallet {
	const mnemonic = existsSync(mnemonicInput)
		? readFileSync(mnemonicInput, "utf-8").trim()
		: mnemonicInput;

	if (!validateMnemonic(mnemonic, wordlist)) {
		throw new Error("Invalid BIP39 mnemonic phrase.");
	}

	const passphrase = opts.mnemonicPassphrase ?? "";
	const seed = mnemonicToSeedSync(mnemonic, passphrase);
	const masterNode = HDKey.fromMasterSeed(seed);

	let derivationPath = opts.mnemonicDerivationPath;
	if (opts.mnemonicIndex != null) {
		const parts = derivationPath.split("/");
		parts[parts.length - 1] = String(opts.mnemonicIndex);
		derivationPath = parts.join("/");
	}

	const node = masterNode.derive(derivationPath);
	if (!node.publicKey || !node.privateKey) {
		throw new Error(
			`Unable to derive keys from mnemonic at path ${derivationPath}`,
		);
	}

	const publicKey = Buffer.from(node.publicKey).toString("hex").toUpperCase();
	const privateKey = `00${Buffer.from(node.privateKey).toString("hex").toUpperCase()}`;
	return new Wallet(publicKey, privateKey);
}

function readSeedFromKeyfile(
	opts: Pick<GlobalOptions, "keyfile">,
): string | undefined {
	if (!opts.keyfile) return undefined;
	const raw = readFileSync(opts.keyfile, "utf-8");
	const data = JSON.parse(raw) as { seed?: string };
	if (!data.seed) {
		throw new Error(`Keyfile ${opts.keyfile} does not contain a "seed" field.`);
	}
	return data.seed;
}

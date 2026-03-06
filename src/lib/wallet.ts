import { readFileSync } from "node:fs";
import { Wallet } from "xrpl";
import { decryptSecret, loadKeystore } from "./keystore.js";
import { walletFromMnemonic } from "./mnemonic.js";
import { prompt } from "./prompt.js";
import type { GlobalOptions } from "./types.js";

export async function loadWallet(opts: GlobalOptions): Promise<Wallet> {
	if ((opts.password || opts.passwordFile) && !opts.from) {
		throw new Error("--password/--password-file can only be used with --from.");
	}

	const accountName = opts.from;

	if (accountName) {
		return await loadFromKeystore(accountName, opts);
	}

	if (opts.mnemonic) {
		return walletFromMnemonic(opts.mnemonic, opts).wallet;
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

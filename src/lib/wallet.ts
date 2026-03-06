import { readFileSync } from "node:fs";
import { Wallet } from "xrpl";
import { decryptSecret, loadKeystore } from "./keystore.js";
import { prompt } from "./prompt.js";
import type { GlobalOptions } from "./types.js";

export async function loadWallet(opts: GlobalOptions): Promise<Wallet> {
	if (opts.account) {
		const keystore = loadKeystore(opts.account);
		const password = await prompt("Enter password: ", true);
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

	const seed = opts.seed ?? readSeedFromKeyfile(opts);

	if (!seed) {
		throw new Error(
			"No wallet seed provided. Use --seed, --keyfile, --account, or set XRPL_SEED env var.",
		);
	}

	return Wallet.fromSeed(seed);
}

function readSeedFromKeyfile(opts: GlobalOptions): string | undefined {
	if (!opts.keyfile) return undefined;
	const raw = readFileSync(opts.keyfile, "utf-8");
	const data = JSON.parse(raw) as { seed?: string };
	if (!data.seed) {
		throw new Error(`Keyfile ${opts.keyfile} does not contain a "seed" field.`);
	}
	return data.seed;
}

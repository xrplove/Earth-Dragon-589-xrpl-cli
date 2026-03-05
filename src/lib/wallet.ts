import { readFileSync } from "node:fs";
import { Wallet } from "xrpl";
import type { GlobalOptions } from "./types.js";

export function loadWallet(opts: GlobalOptions): Wallet {
	const seed = opts.seed ?? readSeedFromKeyfile(opts);

	if (!seed) {
		throw new Error(
			"No wallet seed provided. Use --seed, --keyfile, or set XRPL_SEED env var.",
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

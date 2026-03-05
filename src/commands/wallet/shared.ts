import type { ECDSA, Wallet } from "xrpl";
import { algorithm } from "../../lib/schemas.js";

const ALGORITHMS: Record<string, ECDSA> = {
	ed25519: "ed25519" as ECDSA,
	secp256k1: "ecdsa-secp256k1" as ECDSA,
};

export function parseAlgorithm(value: string): ECDSA {
	algorithm.parse(value);
	return ALGORITHMS[value];
}

export function formatWallet(wallet: Wallet): Record<string, string> {
	return {
		address: wallet.address,
		publicKey: wallet.publicKey,
		privateKey: wallet.privateKey,
		seed: wallet.seed ?? "",
	};
}

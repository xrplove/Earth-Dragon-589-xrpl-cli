import type { ECDSA, Wallet } from "xrpl";

const ALGORITHMS: Record<string, ECDSA> = {
	ed25519: "ed25519" as ECDSA,
	secp256k1: "ecdsa-secp256k1" as ECDSA,
};

export function parseAlgorithm(value: string): ECDSA {
	const algo = ALGORITHMS[value];
	if (!algo) {
		throw new Error(
			`Unknown algorithm "${value}". Expected: ed25519 or secp256k1`,
		);
	}
	return algo;
}

export function formatWallet(wallet: Wallet): Record<string, string> {
	return {
		address: wallet.address,
		publicKey: wallet.publicKey,
		privateKey: wallet.privateKey,
		seed: wallet.seed ?? "",
	};
}

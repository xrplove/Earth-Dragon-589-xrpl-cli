import { existsSync, readFileSync } from "node:fs";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { Wallet } from "xrpl";

interface MnemonicOpts {
	mnemonicPassphrase?: string;
	mnemonicDerivationPath?: string;
	mnemonicIndex?: number;
}

const DEFAULT_DERIVATION_PATH = "m/44'/144'/0'/0/0";

/**
 * Resolve a mnemonic input (file path or inline phrase) and derive a wallet.
 */
export function walletFromMnemonic(
	mnemonicInput: string,
	opts: MnemonicOpts,
): { wallet: Wallet; publicKey: string; privateKey: string } {
	const mnemonic = existsSync(mnemonicInput)
		? readFileSync(mnemonicInput, "utf-8").trim()
		: mnemonicInput;

	if (!validateMnemonic(mnemonic, wordlist)) {
		throw new Error("Invalid BIP39 mnemonic phrase.");
	}

	const passphrase = opts.mnemonicPassphrase ?? "";
	const seed = mnemonicToSeedSync(mnemonic, passphrase);
	const masterNode = HDKey.fromMasterSeed(seed);

	let derivationPath = opts.mnemonicDerivationPath ?? DEFAULT_DERIVATION_PATH;
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
	return { wallet: new Wallet(publicKey, privateKey), publicKey, privateKey };
}

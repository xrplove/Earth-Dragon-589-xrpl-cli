import { existsSync, readFileSync } from "node:fs";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import type { Command } from "commander";
import { Wallet } from "xrpl";
import {
	encryptKeypair,
	encryptSeed,
	saveKeystore,
} from "../../lib/keystore.js";
import { output } from "../../lib/output.js";
import { prompt } from "../../lib/prompt.js";
import type { GlobalOptions } from "../../lib/types.js";

const DEFAULT_DERIVATION_PATH = "m/44'/144'/0'/0/0";

interface ImportOpts {
	keystoreDir?: string;
	unsafePassword?: string;
	interactive?: boolean;
	seed?: string;
	mnemonic?: string;
	mnemonicPassphrase?: string;
	mnemonicDerivationPath?: string;
	mnemonicIndex?: number;
}

function walletFromMnemonic(
	mnemonic: string,
	opts: ImportOpts,
): { wallet: Wallet; publicKey: string; privateKey: string } {
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
	const wallet = new Wallet(publicKey, privateKey);

	return { wallet, publicKey, privateKey };
}

async function importWallet(
	name: string,
	opts: ImportOpts,
	globalOpts: GlobalOptions,
) {
	const hasMnemonic = opts.mnemonic != null;
	const hasSeed = opts.seed != null;
	const hasInteractive = opts.interactive === true;

	const sourceCount =
		Number(hasMnemonic) + Number(hasSeed) + Number(hasInteractive);
	if (sourceCount > 1) {
		throw new Error(
			"Specify only one of --seed, --mnemonic, or --interactive.",
		);
	}

	let keystore: ReturnType<typeof encryptSeed>;

	const password = await getPassword(opts);

	if (hasMnemonic) {
		const mnemonicInput = opts.mnemonic!;
		const mnemonic = existsSync(mnemonicInput)
			? readFileSync(mnemonicInput, "utf-8").trim()
			: mnemonicInput;

		const { wallet, publicKey, privateKey } = walletFromMnemonic(
			mnemonic,
			opts,
		);
		keystore = encryptKeypair(
			name,
			publicKey,
			privateKey,
			wallet.classicAddress,
			password,
		);
	} else {
		let seed: string;
		if (hasSeed) {
			seed = opts.seed!;
		} else {
			seed = await prompt("Enter seed: ", true);
		}

		if (!seed) {
			throw new Error("No seed provided.");
		}

		const wallet = Wallet.fromSeed(seed);
		keystore = encryptSeed(name, seed, wallet.classicAddress, password);
	}

	const filePath = saveKeystore(keystore, opts.keystoreDir);

	if (globalOpts.json) {
		output({ name, address: keystore.address, path: filePath }, globalOpts);
	} else {
		output(
			`Imported "${name}" (${keystore.address})\nKeystore: ${filePath}`,
			globalOpts,
		);
	}
}

async function getPassword(opts: ImportOpts): Promise<string> {
	if (opts.unsafePassword) {
		return opts.unsafePassword;
	}

	const password = await prompt("Enter password: ", true);
	if (!password) {
		throw new Error("No password provided.");
	}

	const confirm = await prompt("Confirm password: ", true);
	if (password !== confirm) {
		throw new Error("Passwords do not match.");
	}

	return password;
}

export function registerImport(wallet: Command, _program: Command) {
	const cmd = wallet
		.command("import")
		.description(
			"Import a wallet into an encrypted keystore (from seed or mnemonic)",
		)
		.argument("<name>", "Account name for the keystore")
		.option("-k, --keystore-dir <dir>", "Custom keystore directory")
		.option(
			"--unsafe-password <password>",
			"Password in cleartext (unsafe, prefer interactive prompt)",
		)
		.option("-i, --interactive", "Prompt interactively for the seed")
		.option("-s, --seed <seed>", "Seed to import")
		.option(
			"--mnemonic <mnemonic>",
			"BIP39 mnemonic phrase or path to a mnemonic file",
		)
		.option(
			"--mnemonic-passphrase <passphrase>",
			"BIP39 passphrase for the mnemonic",
		)
		.option(
			"--mnemonic-derivation-path <path>",
			"Wallet derivation path",
			DEFAULT_DERIVATION_PATH,
		)
		.option(
			"--mnemonic-index <index>",
			"Derive the key at this index (replaces last segment of derivation path)",
			Number,
		)
		.action((name: string, opts: ImportOpts) =>
			importWallet(name, opts, cmd.optsWithGlobals() as GlobalOptions),
		);
}

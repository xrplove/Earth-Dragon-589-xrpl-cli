import type { Command } from "commander";
import { Wallet } from "xrpl";
import {
	encryptKeypair,
	encryptSeed,
	saveKeystore,
} from "../../lib/keystore.js";
import { walletFromMnemonic } from "../../lib/mnemonic.js";
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
		const { wallet, publicKey, privateKey } = walletFromMnemonic(
			opts.mnemonic!,
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

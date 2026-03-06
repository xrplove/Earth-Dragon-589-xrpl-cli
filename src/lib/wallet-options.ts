import type { Command } from "commander";
import { Option } from "commander";

const DEFAULT_DERIVATION_PATH = "m/44'/144'/0'/0/0";

/**
 * Add wallet-related options to a command that needs signing.
 * Call on any command that uses loadWallet/loadWalletForTx.
 */
export function withWalletOptions(cmd: Command): Command {
	return cmd
		.addOption(
			new Option("-s, --seed <seed>", "Wallet seed for signing")
				.env("XRPL_SEED")
				.conflicts(["keyfile", "from", "mnemonic", "interactive"]),
		)
		.addOption(
			new Option(
				"--keyfile <path>",
				"Path to a JSON keyfile containing the seed",
			).conflicts(["seed", "from", "mnemonic", "interactive"]),
		)
		.addOption(
			new Option("-f, --from <name>", "Use a wallet from the keystore")
				.env("XRPL_FROM")
				.conflicts(["seed", "keyfile", "mnemonic", "interactive"]),
		)
		.addOption(
			new Option(
				"-i, --interactive",
				"Prompt interactively for the wallet seed",
			).conflicts(["seed", "keyfile", "from", "mnemonic"]),
		)
		.addOption(
			new Option(
				"--mnemonic <mnemonic>",
				"BIP39 mnemonic phrase or path to a mnemonic file",
			).conflicts(["seed", "keyfile", "from", "interactive"]),
		)
		.addOption(
			new Option(
				"--mnemonic-passphrase <passphrase>",
				"BIP39 passphrase for the mnemonic",
			),
		)
		.addOption(
			new Option(
				"--mnemonic-derivation-path <path>",
				"Wallet derivation path",
			).default(DEFAULT_DERIVATION_PATH),
		)
		.addOption(
			new Option(
				"--mnemonic-index <index>",
				"Derive at this mnemonic index",
			).argParser(Number),
		)
		.addOption(
			new Option(
				"--password <password>",
				"Keystore password (used with --from)",
			).conflicts("passwordFile"),
		)
		.addOption(
			new Option("--password-file <path>", "Path to keystore password file")
				.env("XRPL_PASSWORD_FILE")
				.conflicts("password"),
		);
}

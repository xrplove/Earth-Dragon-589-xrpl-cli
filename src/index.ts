import { createRequire } from "node:module";
import { Command, Option } from "commander";
import { ZodError } from "zod";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { name: string; version: string };

import { registerAccountCommands } from "./commands/account/index.js";
import { registerAmmCommands } from "./commands/amm/index.js";
import { registerChannelCommands } from "./commands/channel/index.js";
import { registerCheckCommands } from "./commands/check/index.js";
import { registerDexCommands } from "./commands/dex/index.js";
import { registerEscrowCommands } from "./commands/escrow/index.js";
import { registerLedgerCommands } from "./commands/ledger/index.js";
import { registerMptCommands } from "./commands/mpt/index.js";
import { registerNftCommands } from "./commands/nft/index.js";
import { registerSigningCommands } from "./commands/signing/index.js";
import { registerSubmitCommands } from "./commands/submit/index.js";
import { registerTxCommands } from "./commands/tx/index.js";
import { registerUtilityCommands } from "./commands/utility/index.js";
import { registerWalletCommands } from "./commands/wallet/index.js";
import { loadConfig } from "./lib/config.js";
import { EXIT_CODES } from "./lib/types.js";

const DEFAULT_DERIVATION_PATH = "m/44'/144'/0'/0/0";

const config = loadConfig();

const program = new Command()
	.name("xrpl")
	.description(
		"A Swiss Army knife for interacting with the XRP Ledger from the command line.",
	)
	.version(pkg.version)
	.addOption(
		new Option("-n, --network <network>", "Network to connect to")
			.choices(["mainnet", "testnet", "devnet"])
			.default(config.network ?? "mainnet")
			.env("XRPL_NETWORK"),
	)
	.addOption(
		new Option(
			"--rpc-url <url>",
			"Custom WebSocket RPC URL (overrides --network)",
		)
			.default(config.rpc_url)
			.env("XRPL_RPC_URL"),
	)
	.addOption(
		new Option("-s, --seed <seed>", "Wallet seed for signing")
			.env("XRPL_SEED")
			.conflicts(["keyfile", "account", "from", "mnemonic", "interactive"]),
	)
	.addOption(
		new Option(
			"--keyfile <path>",
			"Path to a JSON keyfile containing the seed",
		).conflicts(["seed", "account", "from", "mnemonic", "interactive"]),
	)
	.addOption(
		new Option("-a, --account <name>", "Use a wallet from the keystore")
			.env("XRPL_ACCOUNT")
			.conflicts(["seed", "keyfile", "from", "mnemonic", "interactive"]),
	)
	.addOption(
		new Option("-f, --from <name>", "Alias for --account")
			.env("XRPL_FROM")
			.conflicts(["seed", "keyfile", "account", "mnemonic", "interactive"])
			.hideHelp(),
	)
	.addOption(
		new Option(
			"-i, --interactive",
			"Prompt interactively for the wallet seed",
		).conflicts(["seed", "keyfile", "account", "from", "mnemonic"]),
	)
	.addOption(
		new Option(
			"--mnemonic <mnemonic>",
			"BIP39 mnemonic phrase or path to a mnemonic file",
		).conflicts(["seed", "keyfile", "account", "from", "interactive"]),
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
			"Keystore password (used with --account/--from)",
		).conflicts("passwordFile"),
	)
	.addOption(
		new Option("--password-file <path>", "Path to keystore password file")
			.env("XRPL_PASSWORD_FILE")
			.conflicts("password"),
	)
	.option("--json", "Output as JSON", false)
	.option("-q, --quiet", "Suppress non-essential output", false)
	.option("-y, --yes", "Skip confirmation prompts", false);

registerAccountCommands(program);
registerLedgerCommands(program);
registerWalletCommands(program);
registerTxCommands(program);
registerDexCommands(program);
registerMptCommands(program);
registerEscrowCommands(program);
registerChannelCommands(program);
registerCheckCommands(program);
registerNftCommands(program);
registerAmmCommands(program);
registerSigningCommands(program);
registerSubmitCommands(program);
registerUtilityCommands(program);

async function main() {
	try {
		await program.parseAsync(process.argv);
	} catch (err) {
		if (err instanceof ZodError) {
			for (const issue of err.issues) {
				console.error(`Error: ${issue.message}`);
			}
		} else {
			const message = err instanceof Error ? err.message : String(err);
			console.error(`Error: ${message}`);
		}
		process.exit(EXIT_CODES.GENERAL_ERROR);
	}
}

main();

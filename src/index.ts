import { createRequire } from "node:module";
import { Command, Option } from "commander";
import { ZodError } from "zod";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { name: string; version: string };

import { registerAccountCommands } from "./commands/account/index.js";
import { registerLedgerCommands } from "./commands/ledger/index.js";
import { registerSigningCommands } from "./commands/signing/index.js";
import { registerSubmitCommands } from "./commands/submit/index.js";
import { registerTxCommands } from "./commands/tx/index.js";
import { registerUtilityCommands } from "./commands/utility/index.js";
import { registerWalletCommands } from "./commands/wallet/index.js";
import { loadConfig } from "./lib/config.js";
import { EXIT_CODES } from "./lib/types.js";

const config = loadConfig();

const program = new Command()
	.name(pkg.name)
	.description(
		"A Swiss Army knife for interacting with the XRP Ledger from the command line.",
	)
	.version(pkg.version)
	.addOption(
		new Option("-n, --network <network>", "Network to connect to")
			.choices(["mainnet", "testnet", "devnet"])
			.default(config.network ?? process.env.XRPL_NETWORK ?? "mainnet"),
	)
	.option(
		"--rpc-url <url>",
		"Custom WebSocket RPC URL (overrides --network)",
		config.rpc_url ?? process.env.XRPL_RPC_URL,
	)
	.option("-s, --seed <seed>", "Wallet seed for signing")
	.option("--keyfile <path>", "Path to a JSON keyfile containing the seed")
	.option("--json", "Output as JSON", false)
	.option("-q, --quiet", "Suppress non-essential output", false)
	.option("-y, --yes", "Skip confirmation prompts", false);

registerAccountCommands(program);
registerLedgerCommands(program);
registerWalletCommands(program);
registerTxCommands(program);
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

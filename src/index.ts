import { Command } from "commander";
import { registerAccountCommands } from "./commands/account/index.js";
import { registerLedgerCommands } from "./commands/ledger.js";
import { registerSigningCommands } from "./commands/signing/index.js";
import { registerSubmitCommands } from "./commands/submit/index.js";
import { registerTxCommands } from "./commands/tx/index.js";
import { registerUtilityCommands } from "./commands/utility/index.js";
import { registerWalletCommands } from "./commands/wallet/index.js";
import { loadConfig } from "./lib/config.js";
import { EXIT_CODES } from "./lib/types.js";

const config = loadConfig();

const program = new Command()
	.name("xrpl")
	.description(
		"A Swiss Army knife for interacting with the XRP Ledger from the command line.",
	)
	.version("0.0.1")
	.option(
		"-n, --network <network>",
		"Network to connect to: mainnet, testnet, devnet",
		config.network ?? process.env.XRPL_NETWORK ?? "mainnet",
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
		const message = err instanceof Error ? err.message : String(err);
		console.error(`Error: ${message}`);
		process.exit(EXIT_CODES.GENERAL_ERROR);
	}
}

main();

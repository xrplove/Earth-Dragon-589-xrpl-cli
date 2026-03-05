import { Command } from "commander";
import { loadConfig } from "./lib/config.js";
import type { GlobalOptions } from "./lib/types.js";
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

export function getGlobalOptions(): GlobalOptions {
	return program.opts() as GlobalOptions;
}

export { program };

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

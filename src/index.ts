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

function classifyError(err: unknown): number {
	if (err instanceof ZodError) return EXIT_CODES.INVALID_ARGUMENTS;

	const message = err instanceof Error ? err.message : String(err);

	if (
		message.includes("ECONNREFUSED") ||
		message.includes("ENOTFOUND") ||
		message.includes("ETIMEDOUT") ||
		message.includes("WebSocket") ||
		message.includes("connect EHOSTUNREACH") ||
		message.includes("disconnected")
	) {
		return EXIT_CODES.NETWORK_ERROR;
	}

	if (
		message.includes("LastLedgerSequence") ||
		message.includes("Transaction has not been applied")
	) {
		return EXIT_CODES.TX_EXPIRED;
	}

	return EXIT_CODES.GENERAL_ERROR;
}

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
		process.exit(classifyError(err));
	}
}

main();

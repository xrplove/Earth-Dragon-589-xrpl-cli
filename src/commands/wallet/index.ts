import type { Command } from "commander";
import { registerFromEntropy } from "./from-entropy.js";
import { registerFromSeed } from "./from-seed.js";
import { registerFund } from "./fund.js";
import { registerGenerate } from "./generate.js";

export function registerWalletCommands(program: Command) {
	const wallet = program
		.command("wallet")
		.description("Wallet management commands");

	registerGenerate(wallet, program);
	registerFromSeed(wallet, program);
	registerFromEntropy(wallet, program);
	registerFund(wallet, program);
}

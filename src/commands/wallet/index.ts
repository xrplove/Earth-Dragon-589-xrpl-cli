import type { Command } from "commander";
import { registerFromEntropy } from "./from-entropy.js";
import { registerFromSeed } from "./from-seed.js";
import { registerFund } from "./fund.js";
import { registerGenerate } from "./generate.js";
import { registerImport } from "./import.js";
import { registerList } from "./list.js";
import { registerRemove } from "./remove.js";
import { registerSignMessage } from "./sign-message.js";
import { registerVanity } from "./vanity.js";
import { registerVerifyMessage } from "./verify-message.js";

export function registerWalletCommands(program: Command) {
	const wallet = program
		.command("wallet")
		.description("Wallet management commands");

	registerGenerate(wallet, program);
	registerFromSeed(wallet, program);
	registerFromEntropy(wallet, program);
	registerFund(wallet, program);
	registerImport(wallet, program);
	registerList(wallet, program);
	registerRemove(wallet, program);
	registerSignMessage(wallet, program);
	registerVanity(wallet, program);
	registerVerifyMessage(wallet, program);
}

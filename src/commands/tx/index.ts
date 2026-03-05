import type { Command } from "commander";
import { registerBuild } from "./build.js";
import { registerClawback } from "./clawback.js";
import { registerSendCommand } from "./send.js";
import { registerSignerListDelete } from "./signer-list-delete.js";
import { registerSignerListSet } from "./signer-list-set.js";
import { registerTrustSetCommand } from "./trust-set.js";

export function registerTxCommands(program: Command) {
	registerSendCommand(program);
	registerTrustSetCommand(program);
	registerSignerListSet(program);
	registerSignerListDelete(program);
	registerClawback(program);
	registerBuild(program);
}

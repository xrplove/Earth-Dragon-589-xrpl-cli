import type { Command } from "commander";
import { registerFeatureCommand } from "./features.js";
import { registerFeeCommand } from "./fee.js";
import { registerLedgerCommand } from "./ledger.js";
import { registerLedgerIndexCommand } from "./ledger-index.js";
import { registerPingCommand } from "./ping.js";
import { registerRpcCommand } from "./rpc.js";
import { registerServerInfoCommand } from "./server-info.js";
import { registerTxCommand } from "./tx.js";

export function registerLedgerCommands(program: Command) {
	registerLedgerCommand(program);
	registerLedgerIndexCommand(program);
	registerFeeCommand(program);
	registerServerInfoCommand(program);
	registerFeatureCommand(program);
	registerTxCommand(program);
	registerPingCommand(program);
	registerRpcCommand(program);
}

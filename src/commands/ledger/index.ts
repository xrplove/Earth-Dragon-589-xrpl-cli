import type { Command } from "commander";
import { registerFeatureCommand } from "./features.js";
import { registerFeeCommand } from "./fee.js";
import { registerLedgerCommand } from "./ledger.js";
import { registerLedgerData } from "./ledger-data.js";
import { registerLedgerEntry } from "./ledger-entry.js";
import { registerLedgerIndexCommand } from "./ledger-index.js";
import { registerPingCommand } from "./ping.js";
import { registerRpcCommand } from "./rpc.js";
import { registerServerInfoCommand } from "./server-info.js";
import { registerServerState } from "./server-state.js";
import { registerSubscribe } from "./subscribe.js";
import { registerTxCommand } from "./tx.js";

export function registerLedgerCommands(program: Command) {
	registerLedgerCommand(program);
	registerLedgerIndexCommand(program);
	registerLedgerData(program);
	registerLedgerEntry(program);
	registerFeeCommand(program);
	registerServerInfoCommand(program);
	registerServerState(program);
	registerFeatureCommand(program);
	registerTxCommand(program);
	registerPingCommand(program);
	registerRpcCommand(program);
	registerSubscribe(program);
}

import type { Command } from "commander";
import { registerEscrowCancel } from "./escrow-cancel.js";
import { registerEscrowCreate } from "./escrow-create.js";
import { registerEscrowFinish } from "./escrow-finish.js";

export function registerEscrowCommands(program: Command) {
	registerEscrowCreate(program);
	registerEscrowFinish(program);
	registerEscrowCancel(program);
}

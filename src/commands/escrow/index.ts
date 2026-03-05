import type { Command } from "commander";
import { registerEscrowCancel } from "./cancel.js";
import { registerEscrowCreate } from "./create.js";
import { registerEscrowFinish } from "./finish.js";

export function registerEscrowCommands(program: Command) {
	registerEscrowCreate(program);
	registerEscrowFinish(program);
	registerEscrowCancel(program);
}

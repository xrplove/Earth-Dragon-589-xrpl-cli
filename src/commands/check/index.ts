import type { Command } from "commander";
import { registerCheckCancel } from "./check-cancel.js";
import { registerCheckCash } from "./check-cash.js";
import { registerCheckCreate } from "./check-create.js";

export function registerCheckCommands(program: Command) {
	registerCheckCreate(program);
	registerCheckCash(program);
	registerCheckCancel(program);
}

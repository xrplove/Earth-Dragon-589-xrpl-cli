import type { Command } from "commander";
import { registerCheckCancel } from "./cancel.js";
import { registerCheckCash } from "./cash.js";
import { registerCheckCreate } from "./create.js";

export function registerCheckCommands(program: Command) {
	registerCheckCreate(program);
	registerCheckCash(program);
	registerCheckCancel(program);
}

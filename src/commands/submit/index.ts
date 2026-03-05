import type { Command } from "commander";
import { registerMultisignSubmit } from "./multisign-submit.js";
import { registerSubmit } from "./submit.js";

export function registerSubmitCommands(program: Command) {
	registerSubmit(program);
	registerMultisignSubmit(program);
}

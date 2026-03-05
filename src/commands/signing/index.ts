import type { Command } from "commander";
import { registerMultisign } from "./multisign.js";
import { registerMultisignCombine } from "./multisign-combine.js";
import { registerSign } from "./sign.js";

export function registerSigningCommands(program: Command) {
	registerSign(program);
	registerMultisign(program);
	registerMultisignCombine(program);
}

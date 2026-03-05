import type { Command } from "commander";
import { registerBuild } from "./build.js";
import { registerDecodeTx } from "./decode-tx.js";
import { registerMultisign } from "./multisign.js";
import { registerMultisignCombine } from "./multisign-combine.js";
import { registerSign } from "./sign.js";

export function registerSigningCommands(program: Command) {
	registerSign(program);
	registerBuild(program);
	registerDecodeTx(program);
	registerMultisign(program);
	registerMultisignCombine(program);
}

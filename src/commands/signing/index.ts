import type { Command } from "commander";
import { registerBuild } from "./build.js";
import { registerDecodeTx } from "./decode-tx.js";
import { registerSign } from "./sign.js";
import { registerSubmit } from "./submit.js";

export function registerSigningCommands(program: Command) {
	registerSign(program);
	registerSubmit(program);
	registerBuild(program);
	registerDecodeTx(program);
}

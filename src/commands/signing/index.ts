import type { Command } from "commander";
import { registerBuild } from "./build.js";
import { registerDecodeTx } from "./decode-tx.js";
import { registerMultisign } from "./multisign.js";
import { registerMultisignCombine } from "./multisign-combine.js";
import { registerMultisignSubmit } from "./multisign-submit.js";
import { registerSign } from "./sign.js";
import { registerSignerListDelete } from "./signer-list-delete.js";
import { registerSignerListSet } from "./signer-list-set.js";
import { registerSubmit } from "./submit.js";

export function registerSigningCommands(program: Command) {
	registerSign(program);
	registerSubmit(program);
	registerBuild(program);
	registerDecodeTx(program);
	registerSignerListSet(program);
	registerSignerListDelete(program);
	registerMultisign(program);
	registerMultisignCombine(program);
	registerMultisignSubmit(program);
}

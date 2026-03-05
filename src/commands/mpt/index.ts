import type { Command } from "commander";
import { registerMptAuthorize } from "./mpt-authorize.js";
import { registerMptCreate } from "./mpt-create.js";
import { registerMptDestroy } from "./mpt-destroy.js";
import { registerMptSet } from "./mpt-set.js";

export function registerMptCommands(program: Command) {
	registerMptCreate(program);
	registerMptAuthorize(program);
	registerMptSet(program);
	registerMptDestroy(program);
}

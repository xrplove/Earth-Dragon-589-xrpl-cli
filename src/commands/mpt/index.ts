import type { Command } from "commander";
import { registerMptAuthorize } from "./authorize.js";
import { registerMptCreate } from "./create.js";
import { registerMptDestroy } from "./destroy.js";
import { registerMptSet } from "./set.js";

export function registerMptCommands(program: Command) {
	registerMptCreate(program);
	registerMptAuthorize(program);
	registerMptSet(program);
	registerMptDestroy(program);
}

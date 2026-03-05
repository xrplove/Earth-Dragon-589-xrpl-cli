import type { Command } from "commander";
import { registerChannelClaim } from "./claim.js";
import { registerChannelCreate } from "./create.js";
import { registerChannelFund } from "./fund.js";
import { registerChannelVerify } from "./verify.js";

export function registerChannelCommands(program: Command) {
	registerChannelCreate(program);
	registerChannelFund(program);
	registerChannelClaim(program);
	registerChannelVerify(program);
}

import type { Command } from "commander";
import { registerChannelClaim } from "./channel-claim.js";
import { registerChannelCreate } from "./channel-create.js";
import { registerChannelFund } from "./channel-fund.js";
import { registerChannelVerify } from "./channel-verify.js";

export function registerChannelCommands(program: Command) {
	registerChannelCreate(program);
	registerChannelFund(program);
	registerChannelClaim(program);
	registerChannelVerify(program);
}

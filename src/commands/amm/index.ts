import type { Command } from "commander";
import { registerAmmBid } from "./bid.js";
import { registerAmmCreate } from "./create.js";
import { registerAmmDeposit } from "./deposit.js";
import { registerAmmInfo } from "./info.js";
import { registerAmmVote } from "./vote.js";
import { registerAmmWithdraw } from "./withdraw.js";

export function registerAmmCommands(program: Command) {
	registerAmmInfo(program);
	registerAmmCreate(program);
	registerAmmDeposit(program);
	registerAmmWithdraw(program);
	registerAmmVote(program);
	registerAmmBid(program);
}

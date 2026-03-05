import type { Command } from "commander";
import { registerAmmBid } from "./amm-bid.js";
import { registerAmmCreate } from "./amm-create.js";
import { registerAmmDeposit } from "./amm-deposit.js";
import { registerAmmInfo } from "./amm-info.js";
import { registerAmmVote } from "./amm-vote.js";
import { registerAmmWithdraw } from "./amm-withdraw.js";

export function registerAmmCommands(program: Command) {
	registerAmmInfo(program);
	registerAmmCreate(program);
	registerAmmDeposit(program);
	registerAmmWithdraw(program);
	registerAmmVote(program);
	registerAmmBid(program);
}

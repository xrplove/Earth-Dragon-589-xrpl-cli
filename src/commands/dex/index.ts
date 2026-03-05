import type { Command } from "commander";
import { registerBookOffers } from "./book-offers.js";
import { registerDepositAuthorized } from "./deposit-authorized.js";
import { registerOfferCancel } from "./offer-cancel.js";
import { registerOfferCreate } from "./offer-create.js";
import { registerPathFind } from "./path-find.js";

export function registerDexCommands(program: Command) {
	registerOfferCreate(program);
	registerOfferCancel(program);
	registerBookOffers(program);
	registerDepositAuthorized(program);
	registerPathFind(program);
}

import type { Command } from "commander";
import { registerNftBurn } from "./burn.js";
import { registerNftBuyOffers } from "./buy-offers.js";
import { registerNftMint } from "./mint.js";
import { registerNftOfferAccept } from "./offer-accept.js";
import { registerNftOfferCancel } from "./offer-cancel.js";
import { registerNftOfferCreate } from "./offer-create.js";
import { registerNftSellOffers } from "./sell-offers.js";

export function registerNftCommands(program: Command) {
	registerNftMint(program);
	registerNftBurn(program);
	registerNftOfferCreate(program);
	registerNftOfferAccept(program);
	registerNftOfferCancel(program);
	registerNftBuyOffers(program);
	registerNftSellOffers(program);
}

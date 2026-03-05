import type { Command } from "commander";
import { registerNftBurn } from "./nft-burn.js";
import { registerNftBuyOffers } from "./nft-buy-offers.js";
import { registerNftMint } from "./nft-mint.js";
import { registerNftOfferAccept } from "./nft-offer-accept.js";
import { registerNftOfferCancel } from "./nft-offer-cancel.js";
import { registerNftOfferCreate } from "./nft-offer-create.js";
import { registerNftSellOffers } from "./nft-sell-offers.js";

export function registerNftCommands(program: Command) {
	registerNftMint(program);
	registerNftBurn(program);
	registerNftOfferCreate(program);
	registerNftOfferAccept(program);
	registerNftOfferCancel(program);
	registerNftBuyOffers(program);
	registerNftSellOffers(program);
}

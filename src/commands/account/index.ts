import type { Command } from "commander";
import { registerAccountChannels } from "./channels.js";
import { registerAccountCurrencies } from "./currencies.js";
import { registerAccountInfo } from "./info.js";
import { registerAccountLines } from "./lines.js";
import { registerAccountNfts } from "./nfts.js";
import { registerAccountObjects } from "./objects.js";
import { registerAccountOffers } from "./offers.js";
import { registerAccountTx } from "./tx.js";
import { registerBalance } from "./balance.js";
import { registerGatewayBalances } from "./gateway-balances.js";
import { registerNonce } from "./nonce.js";
import { registerNorippleCheck } from "./noripple-check.js";

export function registerAccountCommands(program: Command) {
	registerBalance(program);
	registerAccountInfo(program);
	registerAccountObjects(program);
	registerAccountLines(program);
	registerAccountOffers(program);
	registerAccountTx(program);
	registerAccountNfts(program);
	registerNonce(program);
	registerGatewayBalances(program);
	registerAccountChannels(program);
	registerAccountCurrencies(program);
	registerNorippleCheck(program);
}

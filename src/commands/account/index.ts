import type { Command } from "commander";
import { registerAccountChannels } from "./account-channels.js";
import { registerAccountCurrencies } from "./account-currencies.js";
import { registerAccountInfo } from "./account-info.js";
import { registerAccountLines } from "./account-lines.js";
import { registerAccountNfts } from "./account-nfts.js";
import { registerAccountObjects } from "./account-objects.js";
import { registerAccountOffers } from "./account-offers.js";
import { registerAccountTx } from "./account-tx.js";
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

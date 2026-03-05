import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

interface GatewayBalancesOpts {
	hotWallet?: string[];
	ledgerIndex: string;
}

async function fetchGatewayBalances(
	account: string,
	opts: GatewayBalancesOpts,
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "gateway_balances",
			account: resolve(account),
			hotwallet: opts.hotWallet?.map(resolve),
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		});
		output(resp.result, globalOpts);
	});
}

export function registerGatewayBalances(program: Command) {
	program
		.command("gateway-balances")
		.description("Calculate total amounts of tokens issued by an account")
		.argument("<account>", "Account address or alias")
		.option("--hot-wallet <address...>", "Hot wallet addresses to exclude")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action((account: string, opts: GatewayBalancesOpts) =>
			fetchGatewayBalances(account, opts, program.opts() as GlobalOptions),
		);
}

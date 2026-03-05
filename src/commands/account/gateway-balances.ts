import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerGatewayBalances(program: Command) {
	program
		.command("gateway-balances")
		.description("Calculate total amounts of tokens issued by an account")
		.argument("<account>", "Account address or alias")
		.option("--hot-wallet <address...>", "Hot wallet addresses to exclude")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			async (
				account: string,
				opts: {
					hotWallet?: string[];
					ledgerIndex: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "gateway_balances",
						account: resolve(account),
						hotwallet: opts.hotWallet?.map(resolve),
						ledger_index: parseLedgerIndex(opts.ledgerIndex),
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);
}

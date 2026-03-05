import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { toCurrency } from "../../lib/currency.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

interface AmmInfoOpts {
	asset: string;
	asset2: string;
}

async function ammInfo(opts: AmmInfoOpts, globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "amm_info",
			asset: toCurrency(opts.asset),
			asset2: toCurrency(opts.asset2),
		});
		output(resp.result, globalOpts);
	});
}

export function registerAmmInfo(program: Command) {
	program
		.command("amm-info")
		.description("Get AMM pool information")
		.requiredOption(
			"--asset <token>",
			"First pool asset: XRP or <currency>.<issuer>",
		)
		.requiredOption("--asset2 <token>", "Second pool asset")
		.action((opts: AmmInfoOpts) =>
			ammInfo(opts, program.opts() as GlobalOptions),
		);
}

import type { Command } from "commander";
import type { Amount, RipplePathFindRequest } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseToken, toXrplAmount } from "../../lib/tokens.js";
import type { GlobalOptions } from "../../lib/types.js";

interface PathFindOpts {
	sendMaxAmount?: string;
	sendMaxToken?: string;
}

async function pathFind(
	source: string,
	destination: string,
	amount: string,
	token: string,
	opts: PathFindOpts,
	globalOpts: GlobalOptions,
) {
	const parsedToken = parseToken(token);

	const req: RipplePathFindRequest = {
		command: "ripple_path_find",
		source_account: resolve(source),
		destination_account: resolve(destination),
		destination_amount: toXrplAmount(parsedToken, amount) as Amount,
	};

	if (opts.sendMaxAmount && opts.sendMaxToken) {
		req.send_max = toXrplAmount(
			parseToken(opts.sendMaxToken),
			opts.sendMaxAmount,
		) as Amount;
	}

	await withClient(globalOpts, async (client) => {
		const resp = await client.request(req);
		output(resp.result, globalOpts);
	});
}

export function registerPathFind(program: Command) {
	program
		.command("path-find")
		.alias("paths")
		.description("Find payment paths between two accounts")
		.argument("<source>", "Source account address or alias")
		.argument("<destination>", "Destination account address or alias")
		.argument("<amount>", "Destination amount")
		.argument("<token>", "Token: XRP, <currency>.<issuer>, or mpt:<id>")
		.option("--send-max-amount <amount>", "Max source amount to spend")
		.option("--send-max-token <token>", "Token for --send-max-amount")
		.action(
			(
				source: string,
				destination: string,
				amount: string,
				token: string,
				opts: PathFindOpts,
			) =>
				pathFind(source, destination, amount, token, opts, program.opts() as GlobalOptions),
		);
}

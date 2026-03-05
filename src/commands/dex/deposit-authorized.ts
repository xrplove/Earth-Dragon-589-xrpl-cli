import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseLedgerIndex } from "../../lib/parsing.js";
import type { GlobalOptions } from "../../lib/types.js";

interface DepositAuthorizedOpts {
	ledgerIndex: string;
}

async function depositAuthorized(
	source: string,
	destination: string,
	opts: DepositAuthorizedOpts,
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "deposit_authorized",
			source_account: resolve(source),
			destination_account: resolve(destination),
			ledger_index: parseLedgerIndex(opts.ledgerIndex),
		});
		output(resp.result, globalOpts);
	});
}

export function registerDepositAuthorized(program: Command) {
	program
		.command("deposit-authorized")
		.description(
			"Check if a source account is authorized to send to a destination",
		)
		.argument("<source>", "Source account address or alias")
		.argument("<destination>", "Destination account address or alias")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			(source: string, destination: string, opts: DepositAuthorizedOpts) =>
				depositAuthorized(
					source,
					destination,
					opts,
					program.opts() as GlobalOptions,
				),
		);
}

import type { Command } from "commander";
import type { TicketCreate } from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validateRange } from "../../lib/validate.js";

async function ticketCreate(
	count: number,
	opts: TxOptions,
	globalOpts: GlobalOptions,
) {
	validateRange(count, 1, 250, "ticket count");

	const wallet = await loadWalletForTx(opts, globalOpts);

	const tx: Omit<TicketCreate, "Account"> = {
		TransactionType: "TicketCreate",
		TicketCount: count,
	};

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerTicketCreate(program: Command) {
	const cmd = program
		.command("ticket-create")
		.description("Create tickets for later use")
		.argument("<count>", "Number of tickets to create (1-250)", Number);
	withTxOptions(cmd).action((count: number, opts: TxOptions) =>
		ticketCreate(count, opts, program.opts() as GlobalOptions),
	);
}

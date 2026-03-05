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

async function ticketCreate(
	count: number,
	opts: TxOptions,
	globalOpts: GlobalOptions,
) {
	if (count < 1 || count > 250 || !Number.isInteger(count)) {
		throw new Error("Ticket count must be an integer between 1 and 250.");
	}

	const wallet = loadWalletForTx(opts, globalOpts);

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

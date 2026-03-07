import type { Command } from "commander";
import { Client, type SubscribeRequest } from "xrpl";
import { getRpcUrl } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

interface SubscribeOpts {
	accounts?: string[];
	streams?: string[];
}

async function subscribe(opts: SubscribeOpts, globalOpts: GlobalOptions) {
	const url = getRpcUrl(globalOpts);
	const client = new Client(url);

	await client.connect();

	const req: SubscribeRequest = { command: "subscribe" };
	if (opts.streams?.length)
		req.streams = opts.streams as SubscribeRequest["streams"];
	if (opts.accounts?.length) req.accounts = opts.accounts;

	await client.request(req);

	client.on("transaction", (tx) => {
		output(tx, globalOpts);
	});

	client.on("ledgerClosed", (ledger) => {
		output(ledger, globalOpts);
	});

	// Keep running until interrupted
	await new Promise<void>((resolve) => {
		process.on("SIGINT", () => {
			client.disconnect().then(() => resolve());
		});
		process.on("SIGTERM", () => {
			client.disconnect().then(() => resolve());
		});
	});
}

export function registerSubscribe(program: Command) {
	program
		.command("subscribe")
		.description("Subscribe to real-time ledger events (Ctrl+C to stop)")
		.option(
			"--streams <streams...>",
			"Streams to subscribe to (e.g. ledger, transactions)",
		)
		.option("--accounts <accounts...>", "Accounts to monitor")
		.action((opts: SubscribeOpts) =>
			subscribe(opts, program.opts() as GlobalOptions),
		);
}

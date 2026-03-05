import type { Command } from "commander";
import { Client, type SubscribeRequest } from "xrpl";
import { getRpcUrl } from "../../lib/client.js";
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
		console.log(JSON.stringify(tx, null, 2));
	});

	client.on("ledgerClosed", (ledger) => {
		console.log(JSON.stringify(ledger, null, 2));
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

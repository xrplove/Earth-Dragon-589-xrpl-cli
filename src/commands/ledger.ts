import type { Command } from "commander";
import { withClient } from "../lib/client.js";
import { output } from "../lib/output.js";
import { parseLedgerIndex } from "../lib/parsing.js";
import type { GlobalOptions } from "../lib/types.js";

interface LedgerOpts {
	index: string;
	hash?: string;
	transactions: boolean;
	expand: boolean;
}

async function fetchLedger(opts: LedgerOpts, globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const req: Record<string, unknown> = {
			command: "ledger",
			transactions: opts.transactions || undefined,
			expand: opts.expand || undefined,
		};
		if (opts.hash) {
			req.ledger_hash = opts.hash;
		} else {
			req.ledger_index = parseLedgerIndex(opts.index);
		}
		const resp = await client.request(req as never);
		output(resp.result, globalOpts);
	});
}

async function fetchLedgerIndex(globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "ledger",
			ledger_index: "validated",
		});
		const index = resp.result.ledger_index;
		if (globalOpts.json) {
			output({ ledger_index: index }, globalOpts);
		} else {
			output(String(index), globalOpts);
		}
	});
}

async function fetchFee(globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({ command: "fee" });
		if (globalOpts.json) {
			output(resp.result, globalOpts);
		} else {
			output(`${resp.result.drops.open_ledger_fee} drops`, globalOpts);
		}
	});
}

async function fetchServerInfo(globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({ command: "server_info" });
		output(resp.result, globalOpts);
	});
}

async function fetchAmendments(
	amendment: string | undefined,
	opts: { enabled: boolean; pending: boolean },
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "feature",
			feature: amendment,
		} as never);
		let features = resp.result as Record<string, Record<string, unknown>>;

		if (opts.enabled) {
			features = Object.fromEntries(
				Object.entries(features).filter(([, v]) => v.enabled === true),
			);
		} else if (opts.pending) {
			features = Object.fromEntries(
				Object.entries(features).filter(
					([, v]) => v.enabled === false && v.supported === true,
				),
			);
		}

		output(features, globalOpts);
	});
}

async function fetchTx(
	hash: string,
	opts: { ctid: boolean },
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const req: Record<string, unknown> = { command: "tx" };
		if (opts.ctid) {
			req.ctid = hash;
		} else {
			req.transaction = hash;
		}
		const resp = await client.request(req as never);
		output(resp.result, globalOpts);
	});
}

async function pingServer(globalOpts: GlobalOptions) {
	await withClient(globalOpts, async (client) => {
		await client.request({ command: "ping" });
		if (!globalOpts.quiet) {
			output("pong", globalOpts);
		}
	});
}

async function sendRpc(
	method: string,
	params: string,
	globalOpts: GlobalOptions,
) {
	const parsed = JSON.parse(params);
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: method,
			...parsed,
		} as never);
		output(resp.result, globalOpts);
	});
}

export function registerLedgerCommands(program: Command) {
	program
		.command("ledger")
		.description("Get information about a ledger")
		.option("--index <index>", "Ledger index or shortcut", "validated")
		.option("--hash <hash>", "Ledger hash (64-char hex)")
		.option("--transactions", "Include transaction hashes", false)
		.option("--expand", "Expand transactions to full JSON", false)
		.action((opts: LedgerOpts) =>
			fetchLedger(opts, program.opts() as GlobalOptions),
		);

	program
		.command("ledger-index")
		.description("Get the latest validated ledger index")
		.action(() => fetchLedgerIndex(program.opts() as GlobalOptions));

	program
		.command("fee")
		.description("Get the current transaction fee")
		.action(() => fetchFee(program.opts() as GlobalOptions));

	program
		.command("server-info")
		.description("Get the connected server's status and info")
		.action(() => fetchServerInfo(program.opts() as GlobalOptions));

	program
		.command("amendments")
		.description("List protocol amendments and their status")
		.argument("[amendment]", "Amendment name or hex ID to look up")
		.option("--enabled", "Show only enabled amendments", false)
		.option("--pending", "Show only pending amendments", false)
		.action(
			(
				amendment: string | undefined,
				opts: { enabled: boolean; pending: boolean },
			) => fetchAmendments(amendment, opts, program.opts() as GlobalOptions),
		);

	program
		.command("tx")
		.description("Get information about a transaction by hash")
		.argument("<hash>", "Transaction hash or CTID")
		.option("--ctid", "Treat the argument as a Compact Transaction ID", false)
		.action((hash: string, opts: { ctid: boolean }) =>
			fetchTx(hash, opts, program.opts() as GlobalOptions),
		);

	program
		.command("ping")
		.description("Confirm connectivity with the server")
		.action(() => pingServer(program.opts() as GlobalOptions));

	program
		.command("rpc")
		.description("Send a raw WebSocket API request")
		.argument("<method>", "API method name")
		.argument("[params]", "JSON object of method parameters", "{}")
		.action((method: string, params: string) =>
			sendRpc(method, params, program.opts() as GlobalOptions),
		);
}

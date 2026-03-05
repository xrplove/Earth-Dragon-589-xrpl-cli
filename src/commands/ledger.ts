import type { Command } from "commander";
import { withClient } from "../lib/client.js";
import { output } from "../lib/output.js";
import type { GlobalOptions } from "../lib/types.js";

export function registerLedgerCommands(program: Command) {
	program
		.command("ledger")
		.description("Get information about a ledger")
		.option("--index <index>", "Ledger index or shortcut", "validated")
		.option("--hash <hash>", "Ledger hash (64-char hex)")
		.option("--transactions", "Include transaction hashes", false)
		.option("--expand", "Expand transactions to full JSON", false)
		.action(
			async (opts: {
				index: string;
				hash?: string;
				transactions: boolean;
				expand: boolean;
			}) => {
				const globalOpts = program.opts() as GlobalOptions;
				await withClient(globalOpts, async (client) => {
					const req: Record<string, unknown> = {
						command: "ledger",
						transactions: opts.transactions || undefined,
						expand: opts.expand || undefined,
					};
					if (opts.hash) {
						req.ledger_hash = opts.hash;
					} else {
						const idx = opts.index;
						if (["validated", "closed", "current"].includes(idx)) {
							req.ledger_index = idx;
						} else {
							req.ledger_index = Number(idx);
						}
					}
					const resp = await client.request(req as never);
					output(resp.result, globalOpts);
				});
			},
		);

	program
		.command("ledger-index")
		.description("Get the latest validated ledger index")
		.action(async () => {
			const globalOpts = program.opts() as GlobalOptions;
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
		});

	program
		.command("fee")
		.description("Get the current transaction fee")
		.action(async () => {
			const globalOpts = program.opts() as GlobalOptions;
			await withClient(globalOpts, async (client) => {
				const resp = await client.request({ command: "fee" });
				if (globalOpts.json) {
					output(resp.result, globalOpts);
				} else {
					output(`${resp.result.drops.open_ledger_fee} drops`, globalOpts);
				}
			});
		});

	program
		.command("server-info")
		.description("Get the connected server's status and info")
		.action(async () => {
			const globalOpts = program.opts() as GlobalOptions;
			await withClient(globalOpts, async (client) => {
				const resp = await client.request({
					command: "server_info",
				});
				output(resp.result, globalOpts);
			});
		});

	program
		.command("amendments")
		.description("List protocol amendments and their status")
		.argument("[amendment]", "Amendment name or hex ID to look up")
		.option("--enabled", "Show only enabled amendments", false)
		.option("--pending", "Show only pending amendments", false)
		.action(
			async (
				amendment: string | undefined,
				opts: { enabled: boolean; pending: boolean },
			) => {
				const globalOpts = program.opts() as GlobalOptions;
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
			},
		);

	program
		.command("tx")
		.description("Get information about a transaction by hash")
		.argument("<hash>", "Transaction hash or CTID")
		.option("--ctid", "Treat the argument as a Compact Transaction ID", false)
		.action(async (hash: string, opts: { ctid: boolean }) => {
			const globalOpts = program.opts() as GlobalOptions;
			await withClient(globalOpts, async (client) => {
				const req: Record<string, unknown> = {
					command: "tx",
				};
				if (opts.ctid) {
					req.ctid = hash;
				} else {
					req.transaction = hash;
				}
				const resp = await client.request(req as never);
				output(resp.result, globalOpts);
			});
		});

	program
		.command("ping")
		.description("Confirm connectivity with the server")
		.action(async () => {
			const globalOpts = program.opts() as GlobalOptions;
			await withClient(globalOpts, async (client) => {
				await client.request({ command: "ping" });
				if (!globalOpts.quiet) {
					output("pong", globalOpts);
				}
			});
		});

	program
		.command("rpc")
		.description("Send a raw WebSocket API request")
		.argument("<method>", "API method name")
		.argument("[params]", "JSON object of method parameters", "{}")
		.action(async (method: string, params: string) => {
			const globalOpts = program.opts() as GlobalOptions;
			const parsed = JSON.parse(params);
			await withClient(globalOpts, async (client) => {
				const resp = await client.request({
					command: method,
					...parsed,
				} as never);
				output(resp.result, globalOpts);
			});
		});
}

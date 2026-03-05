import type { Command } from "commander";
import { withClient } from "../lib/client.js";
import { loadConfig, resolveAlias } from "../lib/config.js";
import { output } from "../lib/output.js";
import { parseLedgerIndex } from "../lib/parsing.js";
import { parseToken } from "../lib/tokens.js";
import type { GlobalOptions } from "../lib/types.js";

const { aliases } = loadConfig();

function resolve(address: string): string {
	return resolveAlias(address, aliases);
}

export function registerAccountCommands(program: Command) {
	program
		.command("balance")
		.description("Get the balance of an account")
		.argument("<account>", "Account address or alias")
		.option("--token <token>", "Token to query", "XRP")
		.action(async (account: string, opts: { token: string }) => {
			const globalOpts = program.opts() as GlobalOptions;
			const addr = resolve(account);
			const token = parseToken(opts.token);

			await withClient(globalOpts, async (client) => {
				if (token.type === "xrp") {
					const resp = await client.request({
						command: "account_info",
						account: addr,
						ledger_index: "validated",
					});
					const drops = resp.result.account_data.Balance;
					if (globalOpts.json) {
						output({ balance: drops, currency: "XRP" }, globalOpts);
					} else {
						output(`${Number(drops) / 1_000_000} XRP`, globalOpts);
					}
				} else if (token.type === "iou") {
					const resp = await client.request({
						command: "account_lines",
						account: addr,
						peer: token.issuer,
						ledger_index: "validated",
					});
					const line = resp.result.lines.find(
						(l: { currency: string }) => l.currency === token.currency,
					);
					const balance = line?.balance ?? "0";
					if (globalOpts.json) {
						output(
							{
								balance,
								currency: token.currency,
								issuer: token.issuer,
							},
							globalOpts,
						);
					} else {
						output(`${balance} ${token.currency}`, globalOpts);
					}
				} else {
					// MPT — query account_objects filtered by mptoken
					const resp = await client.request({
						command: "account_objects",
						account: addr,
						type: "mptoken" as never,
						ledger_index: "validated",
					});
					const mpt = (
						resp.result.account_objects as Array<{
							MPTokenIssuanceID?: string;
							MPTAmount?: string;
						}>
					).find((o) => o.MPTokenIssuanceID === token.mpt_issuance_id);
					const balance = mpt?.MPTAmount ?? "0";
					if (globalOpts.json) {
						output(
							{
								balance,
								mpt_issuance_id: token.mpt_issuance_id,
							},
							globalOpts,
						);
					} else {
						output(`${balance} mpt:${token.mpt_issuance_id}`, globalOpts);
					}
				}
			});
		});

	program
		.command("account-info")
		.alias("info")
		.description("Get full account info")
		.argument("<account>", "Account address or alias")
		.option("--signer-lists", "Include SignerList objects", false)
		.option("--queue", "Include queued transaction info", false)
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			async (
				account: string,
				opts: {
					signerLists: boolean;
					queue: boolean;
					ledgerIndex: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "account_info",
						account: resolve(account),
						signer_lists: opts.signerLists || undefined,
						queue: opts.queue || undefined,
						ledger_index: parseLedgerIndex(opts.ledgerIndex),
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);

	program
		.command("account-objects")
		.alias("objects")
		.description("Get objects owned by an account")
		.argument("<account>", "Account address or alias")
		.option("--type <type>", "Filter by object type")
		.option("--limit <n>", "Max objects to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			async (
				account: string,
				opts: {
					type?: string;
					limit?: number;
					marker?: string;
					ledgerIndex: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "account_objects",
						account: resolve(account),
						type: opts.type,
						limit: opts.limit,
						marker: opts.marker,
						ledger_index: parseLedgerIndex(opts.ledgerIndex),
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);

	program
		.command("account-lines")
		.alias("lines")
		.description("Get trust lines for an account")
		.argument("<account>", "Account address or alias")
		.option(
			"--counterparty <address>",
			"Filter by counterparty (alias: --peer)",
		)
		.option("--peer <address>", "Alias for --counterparty")
		.option("--limit <n>", "Max lines to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			async (
				account: string,
				opts: {
					counterparty?: string;
					peer?: string;
					limit?: number;
					marker?: string;
					ledgerIndex: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				const peer = opts.counterparty ?? opts.peer;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "account_lines",
						account: resolve(account),
						peer: peer ? resolve(peer) : undefined,
						limit: opts.limit,
						marker: opts.marker,
						ledger_index: parseLedgerIndex(opts.ledgerIndex),
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);

	program
		.command("account-offers")
		.alias("offers")
		.description("Get open DEX offers for an account")
		.argument("<account>", "Account address or alias")
		.option("--limit <n>", "Max offers to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			async (
				account: string,
				opts: {
					limit?: number;
					marker?: string;
					ledgerIndex: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "account_offers",
						account: resolve(account),
						limit: opts.limit,
						marker: opts.marker,
						ledger_index: parseLedgerIndex(opts.ledgerIndex),
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);

	program
		.command("account-tx")
		.description("Get transaction history for an account")
		.argument("<account>", "Account address or alias")
		.option("--limit <n>", "Max transactions to return", Number)
		.option("--forward", "Return results oldest first", false)
		.option("--ledger-index-min <n>", "Earliest ledger to search", Number)
		.option("--ledger-index-max <n>", "Latest ledger to search", Number)
		.option("--marker <marker>", "Pagination marker")
		.action(
			async (
				account: string,
				opts: {
					limit?: number;
					forward: boolean;
					ledgerIndexMin?: number;
					ledgerIndexMax?: number;
					marker?: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "account_tx",
						account: resolve(account),
						limit: opts.limit,
						forward: opts.forward || undefined,
						ledger_index_min: opts.ledgerIndexMin,
						ledger_index_max: opts.ledgerIndexMax,
						marker: opts.marker,
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);

	program
		.command("account-nfts")
		.alias("nfts")
		.description("Get NFTs owned by an account")
		.argument("<account>", "Account address or alias")
		.option("--limit <n>", "Max NFTs to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			async (
				account: string,
				opts: {
					limit?: number;
					marker?: string;
					ledgerIndex: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "account_nfts",
						account: resolve(account),
						limit: opts.limit,
						marker: opts.marker,
						ledger_index: parseLedgerIndex(opts.ledgerIndex),
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);

	program
		.command("nonce")
		.description("Get the current sequence number for an account")
		.argument("<account>", "Account address or alias")
		.action(async (account: string) => {
			const globalOpts = program.opts() as GlobalOptions;
			await withClient(globalOpts, async (client) => {
				const resp = await client.request({
					command: "account_info",
					account: resolve(account),
					ledger_index: "validated",
				});
				const seq = resp.result.account_data.Sequence;
				if (globalOpts.json) {
					output({ sequence: seq }, globalOpts);
				} else {
					output(String(seq), globalOpts);
				}
			});
		});

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

	program
		.command("account-channels")
		.alias("channels")
		.description("Get payment channels where the account is the source")
		.argument("<account>", "Account address or alias")
		.option("--destination <address>", "Filter by destination account")
		.option("--limit <n>", "Max channels to return", Number)
		.option("--marker <marker>", "Pagination marker")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			async (
				account: string,
				opts: {
					destination?: string;
					limit?: number;
					marker?: string;
					ledgerIndex: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "account_channels",
						account: resolve(account),
						destination_account: opts.destination
							? resolve(opts.destination)
							: undefined,
						limit: opts.limit,
						marker: opts.marker,
						ledger_index: parseLedgerIndex(opts.ledgerIndex),
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);

	program
		.command("account-currencies")
		.alias("currencies")
		.description("Get currencies an account can send or receive")
		.argument("<account>", "Account address or alias")
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(async (account: string, opts: { ledgerIndex: string }) => {
			const globalOpts = program.opts() as GlobalOptions;
			await withClient(globalOpts, async (client) => {
				const resp = await client.request({
					command: "account_currencies",
					account: resolve(account),
					ledger_index: parseLedgerIndex(opts.ledgerIndex),
				} as never);
				output(resp.result, globalOpts);
			});
		});

	program
		.command("noripple-check")
		.description("Get recommended changes to NoRipple settings")
		.argument("<account>", "Account address or alias")
		.option("--role <role>", "Account role: gateway or user", "user")
		.option("--transactions", "Include suggested fix transactions", false)
		.option("--limit <n>", "Max trust line problems to include", Number)
		.option("--ledger-index <index>", "Ledger version", "validated")
		.action(
			async (
				account: string,
				opts: {
					role: string;
					transactions: boolean;
					limit?: number;
					ledgerIndex: string;
				},
			) => {
				const globalOpts = program.opts() as GlobalOptions;
				await withClient(globalOpts, async (client) => {
					const resp = await client.request({
						command: "noripple_check",
						account: resolve(account),
						role: opts.role,
						transactions: opts.transactions || undefined,
						limit: opts.limit,
						ledger_index: parseLedgerIndex(opts.ledgerIndex),
					} as never);
					output(resp.result, globalOpts);
				});
			},
		);
}

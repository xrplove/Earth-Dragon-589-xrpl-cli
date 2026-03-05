import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import { output } from "../../lib/output.js";
import { parseToken } from "../../lib/tokens.js";
import type { GlobalOptions } from "../../lib/types.js";

async function fetchBalance(
	account: string,
	opts: { token: string },
	globalOpts: GlobalOptions,
) {
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
					{ balance, currency: token.currency, issuer: token.issuer },
					globalOpts,
				);
			} else {
				output(`${balance} ${token.currency}`, globalOpts);
			}
		} else {
			const resp = await client.request({
				command: "account_objects",
				account: addr,
				type: "mptoken",
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
				output({ balance, mpt_issuance_id: token.mpt_issuance_id }, globalOpts);
			} else {
				output(`${balance} mpt:${token.mpt_issuance_id}`, globalOpts);
			}
		}
	});
}

export function registerBalance(program: Command) {
	program
		.command("balance")
		.description("Get the balance of an account")
		.argument("<account>", "Account address or alias")
		.option("--token <token>", "Token to query", "XRP")
		.action((account: string, opts: { token: string }) =>
			fetchBalance(account, opts, program.opts() as GlobalOptions),
		);
}

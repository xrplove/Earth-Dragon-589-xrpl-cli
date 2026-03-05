import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import { BASE_RESERVE_XRP, type GlobalOptions } from "../../lib/types.js";

interface FundOpts {
	account?: string;
	amount?: string;
	faucetHost?: string;
	faucetPath?: string;
}

async function fundWallet(opts: FundOpts, globalOpts: GlobalOptions) {
	if (globalOpts.network !== "testnet" && globalOpts.network !== "devnet") {
		throw new Error(
			"Faucet is only available on testnet and devnet. Use --network testnet or --network devnet.",
		);
	}

	await withClient(globalOpts, async (client) => {
		const faucetOpts: Record<string, unknown> = {};
		if (opts.amount) faucetOpts.amount = opts.amount;
		if (opts.faucetHost) faucetOpts.faucetHost = opts.faucetHost;
		if (opts.faucetPath) faucetOpts.faucetPath = opts.faucetPath;

		const result = await client.fundWallet(null, faucetOpts);

		if (opts.account) {
			await client.submitAndWait(
				{
					TransactionType: "Payment",
					Account: result.wallet.address,
					Destination: opts.account,
					Amount: String(
						Math.floor((result.balance - BASE_RESERVE_XRP) * 1_000_000),
					),
				},
				{ autofill: true, wallet: result.wallet },
			);
			const balance = await client.getXrpBalance(opts.account);
			if (globalOpts.json) {
				output({ address: opts.account, balance }, globalOpts);
			} else {
				output(`Funded ${opts.account}\nBalance: ${balance} XRP`, globalOpts);
			}
		} else {
			if (globalOpts.json) {
				output(
					{
						address: result.wallet.address,
						seed: result.wallet.seed,
						balance: result.balance,
					},
					globalOpts,
				);
			} else {
				const lines = [
					`Address: ${result.wallet.address}`,
					`Seed:    ${result.wallet.seed}`,
					`Balance: ${result.balance} XRP`,
				];
				output(lines.join("\n"), globalOpts);
			}
		}
	});
}

export function registerFund(wallet: Command, program: Command) {
	wallet
		.command("fund")
		.description(
			"Fund a wallet using the testnet/devnet faucet. Generates a new wallet if no account is given.",
		)
		.option("--account <account>", "Account to fund")
		.option("--amount <amount>", "Amount of XRP to request")
		.option("--faucet-host <host>", "Custom faucet hostname")
		.option("--faucet-path <path>", "Custom faucet API path")
		.action((opts: FundOpts) =>
			fundWallet(opts, program.opts() as GlobalOptions),
		);
}

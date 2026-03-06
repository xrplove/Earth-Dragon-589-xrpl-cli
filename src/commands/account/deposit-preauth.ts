import { type Command, Option } from "commander";
import type { AuthorizeCredential, DepositPreauth } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { withWalletOptions } from "../../lib/wallet-options.js";

interface DepositPreauthOpts extends TxOptions {
	authorize?: string;
	unauthorize?: string;
	authorizeCredentials?: string[];
	unauthorizeCredentials?: string[];
}

export function parseCredentials(entries: string[]): AuthorizeCredential[] {
	return entries.map((entry) => {
		const colonIdx = entry.lastIndexOf(":");
		if (colonIdx === -1) {
			throw new Error(
				`Invalid credential format "${entry}". Expected <issuer>:<credential-type>.`,
			);
		}
		return {
			Credential: {
				Issuer: resolve(entry.slice(0, colonIdx)),
				CredentialType: entry.slice(colonIdx + 1),
			},
		};
	});
}

async function depositPreauth(
	opts: DepositPreauthOpts,
	globalOpts: GlobalOptions,
) {
	const wallet = await loadWalletForTx(opts, globalOpts);

	const tx: Omit<DepositPreauth, "Account"> = {
		TransactionType: "DepositPreauth",
	};

	if (opts.authorize) tx.Authorize = resolve(opts.authorize);
	if (opts.unauthorize) tx.Unauthorize = resolve(opts.unauthorize);
	if (opts.authorizeCredentials)
		tx.AuthorizeCredentials = parseCredentials(opts.authorizeCredentials);
	if (opts.unauthorizeCredentials)
		tx.UnauthorizeCredentials = parseCredentials(opts.unauthorizeCredentials);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerDepositPreauth(program: Command) {
	const cmd = program
		.command("deposit-preauth")
		.description("Preauthorize an account to send payments to you")
		.addOption(
			new Option(
				"--authorize <address>",
				"Preauthorize this account",
			).conflicts([
				"unauthorize",
				"authorizeCredentials",
				"unauthorizeCredentials",
			]),
		)
		.addOption(
			new Option(
				"--unauthorize <address>",
				"Revoke preauthorization",
			).conflicts([
				"authorize",
				"authorizeCredentials",
				"unauthorizeCredentials",
			]),
		)
		.addOption(
			new Option(
				"--authorize-credentials <issuer:type...>",
				"Preauthorize by credential(s)",
			).conflicts(["authorize", "unauthorize", "unauthorizeCredentials"]),
		)
		.addOption(
			new Option(
				"--unauthorize-credentials <issuer:type...>",
				"Revoke credential-based preauthorization",
			).conflicts(["authorize", "unauthorize", "authorizeCredentials"]),
		);
	withWalletOptions(withTxOptions(cmd)).action((opts: DepositPreauthOpts) =>
		depositPreauth(opts, cmd.optsWithGlobals() as GlobalOptions),
	);
}

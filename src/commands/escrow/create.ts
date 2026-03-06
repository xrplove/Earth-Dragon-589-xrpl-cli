import type { Command } from "commander";
import { type EscrowCreate, xrpToDrops } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validateOptionalHex, validateXrpAmount } from "../../lib/validate.js";
import { withWalletOptions } from "../../lib/wallet-options.js";

interface EscrowCreateOpts extends TxOptions {
	destination: string;
	amount: string;
	cancelAfter?: string;
	finishAfter?: string;
	condition?: string;
	tag?: number;
}

async function escrowCreate(opts: EscrowCreateOpts, globalOpts: GlobalOptions) {
	validateXrpAmount(opts.amount, "amount");
	validateOptionalHex(opts.condition, "condition");

	const tx: Omit<EscrowCreate, "Account"> = {
		TransactionType: "EscrowCreate",
		Destination: resolve(opts.destination),
		Amount: xrpToDrops(opts.amount),
	};

	if (opts.cancelAfter) tx.CancelAfter = toRippleTime(opts.cancelAfter);
	if (opts.finishAfter) tx.FinishAfter = toRippleTime(opts.finishAfter);
	if (opts.condition) tx.Condition = opts.condition;
	if (opts.tag != null) tx.DestinationTag = opts.tag;

	const wallet = await loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

/** Accept ISO 8601 string or Ripple epoch integer. */
function toRippleTime(value: string): number {
	const num = Number(value);
	if (Number.isFinite(num) && num > 0) return num;
	const ms = Date.parse(value);
	if (Number.isNaN(ms))
		throw new Error(`Invalid time "${value}". Use ISO 8601 or Ripple epoch.`);
	// Ripple epoch starts 2000-01-01T00:00:00Z = 946684800 Unix
	return Math.floor(ms / 1000) - 946684800;
}

export function registerEscrowCreate(program: Command) {
	const cmd = program
		.command("escrow-create")
		.description("Create an XRP escrow")
		.requiredOption("--destination <address>", "Recipient address or alias")
		.requiredOption("--amount <xrp>", "Amount of XRP to escrow")
		.option("--cancel-after <time>", "Expiration (ISO 8601 or Ripple epoch)")
		.option(
			"--finish-after <time>",
			"Earliest finish (ISO 8601 or Ripple epoch)",
		)
		.option("--condition <hex>", "Crypto-condition (hex)")
		.option("--tag <tag>", "Destination tag", Number);
	withWalletOptions(withTxOptions(cmd)).action((opts: EscrowCreateOpts) =>
		escrowCreate(opts, cmd.optsWithGlobals() as GlobalOptions),
	);
}

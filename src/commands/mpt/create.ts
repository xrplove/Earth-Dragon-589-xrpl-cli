import type { Command } from "commander";
import { type MPTokenIssuanceCreate, MPTokenIssuanceCreateFlags } from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import {
	validateOptionalHex,
	validateOptionalRange,
} from "../../lib/validate.js";
import { withWalletOptions } from "../../lib/wallet-options.js";

interface MptCreateOpts extends TxOptions {
	assetScale?: number;
	maxAmount?: string;
	transferFee?: number;
	metadata?: string;
	canLock: boolean;
	requireAuth: boolean;
	canEscrow: boolean;
	canTrade: boolean;
	canTransfer: boolean;
	canClawback: boolean;
}

async function mptCreate(opts: MptCreateOpts, globalOpts: GlobalOptions) {
	validateOptionalRange(opts.assetScale, 0, 255, "asset-scale");
	validateOptionalRange(opts.transferFee, 0, 50000, "transfer-fee");
	validateOptionalHex(opts.metadata, "metadata");

	const tx: Omit<MPTokenIssuanceCreate, "Account"> = {
		TransactionType: "MPTokenIssuanceCreate",
	};

	if (opts.assetScale != null) tx.AssetScale = opts.assetScale;
	if (opts.maxAmount != null) tx.MaximumAmount = opts.maxAmount;
	if (opts.transferFee != null) tx.TransferFee = opts.transferFee;
	if (opts.metadata != null) tx.MPTokenMetadata = opts.metadata;

	let flags = 0;
	if (opts.canLock) flags |= MPTokenIssuanceCreateFlags.tfMPTCanLock;
	if (opts.requireAuth) flags |= MPTokenIssuanceCreateFlags.tfMPTRequireAuth;
	if (opts.canEscrow) flags |= MPTokenIssuanceCreateFlags.tfMPTCanEscrow;
	if (opts.canTrade) flags |= MPTokenIssuanceCreateFlags.tfMPTCanTrade;
	if (opts.canTransfer) flags |= MPTokenIssuanceCreateFlags.tfMPTCanTransfer;
	if (opts.canClawback) flags |= MPTokenIssuanceCreateFlags.tfMPTCanClawback;
	if (flags) tx.Flags = flags;

	const wallet = await loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerMptCreate(program: Command) {
	const cmd = program
		.command("mpt-create")
		.description("Create a new Multi-Purpose Token issuance")
		.option("--asset-scale <n>", "Decimal places (0-255)", Number)
		.option("--max-amount <amount>", "Maximum token supply")
		.option(
			"--transfer-fee <fee>",
			"Transfer fee (0-50000, in 1/100000ths)",
			Number,
		)
		.option("--metadata <hex>", "Metadata as hex string")
		.option("--can-lock", "Allow issuer to lock tokens", false)
		.option("--require-auth", "Require authorization for holders", false)
		.option("--can-escrow", "Allow tokens in escrow", false)
		.option("--can-trade", "Allow tokens on the DEX", false)
		.option("--can-transfer", "Allow transfers between holders", false)
		.option("--can-clawback", "Allow issuer to clawback tokens", false);
	withWalletOptions(withTxOptions(cmd)).action((opts: MptCreateOpts) =>
		mptCreate(opts, cmd.optsWithGlobals() as GlobalOptions),
	);
}

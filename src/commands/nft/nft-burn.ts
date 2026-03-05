import type { Command } from "commander";
import type { NFTokenBurn } from "xrpl";
import { withClient } from "../../lib/client.js";
import { resolve } from "../../lib/config.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";
import { validateHex64, validateOptionalAddress } from "../../lib/validate.js";

interface NftBurnOpts extends TxOptions {
	owner?: string;
}

async function nftBurn(
	nftokenId: string,
	opts: NftBurnOpts,
	globalOpts: GlobalOptions,
) {
	validateHex64(nftokenId, "NFToken ID");
	validateOptionalAddress(opts.owner, "owner");

	const tx: Omit<NFTokenBurn, "Account"> = {
		TransactionType: "NFTokenBurn",
		NFTokenID: nftokenId,
	};

	if (opts.owner) tx.Owner = resolve(opts.owner);

	const wallet = loadWalletForTx(opts, globalOpts);

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerNftBurn(program: Command) {
	const cmd = program
		.command("nft-burn")
		.description("Burn (destroy) an NFT")
		.argument("<nftoken-id>", "NFToken ID (64-char hex)")
		.option("--owner <address>", "Owner account (if burning on behalf of)");
	withTxOptions(cmd).action((nftokenId: string, opts: NftBurnOpts) =>
		nftBurn(nftokenId, opts, program.opts() as GlobalOptions),
	);
}

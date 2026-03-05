import { type Command, Option } from "commander";
import { AccountSetAsfFlags, type AccountSet } from "xrpl";
import { withClient } from "../../lib/client.js";
import {
	loadWalletForTx,
	outputResult,
	submitOrPrepare,
	withTxOptions,
} from "../../lib/tx.js";
import type { GlobalOptions, TxOptions } from "../../lib/types.js";

const ASF_FLAGS: Record<string, number> = {};
for (const [name, value] of Object.entries(AccountSetAsfFlags)) {
	if (typeof value === "number") {
		ASF_FLAGS[name] = value;
	}
}

export function parseAsfFlag(value: string): number {
	const num = Number(value);
	if (Number.isInteger(num) && num > 0) return num;
	const flag = ASF_FLAGS[value];
	if (flag != null) return flag;
	const valid = Object.keys(ASF_FLAGS).join(", ");
	throw new Error(`Unknown flag "${value}". Valid flags: ${valid}`);
}

interface AccountSetOpts extends TxOptions {
	flag?: string;
	clearFlag?: string;
	domain?: string;
	transferRate?: number;
	tickSize?: number;
	emailHash?: string;
	messageKey?: string;
	nftokenMinter?: string;
}

async function accountSet(opts: AccountSetOpts, globalOpts: GlobalOptions) {
	const wallet = loadWalletForTx(opts, globalOpts);

	const tx: Omit<AccountSet, "Account"> = {
		TransactionType: "AccountSet",
	};

	if (opts.flag != null) tx.SetFlag = parseAsfFlag(opts.flag);
	if (opts.clearFlag != null) tx.ClearFlag = parseAsfFlag(opts.clearFlag);
	if (opts.domain != null)
		tx.Domain = Buffer.from(opts.domain, "ascii").toString("hex").toUpperCase();
	if (opts.transferRate != null) tx.TransferRate = opts.transferRate;
	if (opts.tickSize != null) tx.TickSize = opts.tickSize;
	if (opts.emailHash != null) tx.EmailHash = opts.emailHash;
	if (opts.messageKey != null) tx.MessageKey = opts.messageKey;
	if (opts.nftokenMinter != null) tx.NFTokenMinter = opts.nftokenMinter;

	await withClient(globalOpts, async (client) => {
		const outcome = await submitOrPrepare(client, wallet, tx, opts, globalOpts);
		outputResult(outcome, globalOpts);
	});
}

export function registerAccountSet(program: Command) {
	const cmd = program
		.command("account-set")
		.description("Modify account properties")
		.addOption(
			new Option(
				"--flag <flag>",
				"Enable an account flag (name or number)",
			).conflicts("clearFlag"),
		)
		.addOption(
			new Option(
				"--clear-flag <flag>",
				"Disable an account flag (name or number)",
			).conflicts("flag"),
		)
		.option("--domain <domain>", "Domain that owns this account (ASCII)")
		.option(
			"--transfer-rate <rate>",
			"Fee for transferring issued currencies (billionths)",
			Number,
		)
		.option("--tick-size <size>", "Tick size for offers (3-15, or 0)", Number)
		.option("--email-hash <hash>", "128-bit MD5 hash of email (hex)")
		.option("--message-key <key>", "Public key for encrypted messages")
		.option(
			"--nftoken-minter <address>",
			"Allow this account to mint NFTs on your behalf",
		);
	withTxOptions(cmd).action((opts: AccountSetOpts) =>
		accountSet(opts, program.opts() as GlobalOptions),
	);
}

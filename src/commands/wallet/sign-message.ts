import type { Command } from "commander";
import { sign } from "ripple-keypairs";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";
import { loadWallet } from "../../lib/wallet.js";

async function signMessage(message: string, globalOpts: GlobalOptions) {
	const wallet = loadWallet(globalOpts);
	const msgHex = Buffer.from(message, "utf-8").toString("hex").toUpperCase();
	const signature = sign(msgHex, wallet.privateKey);
	if (globalOpts.json) {
		output(
			{
				message,
				publicKey: wallet.publicKey,
				signature,
			},
			globalOpts,
		);
	} else {
		output(signature, globalOpts);
	}
}

export function registerSignMessage(wallet: Command, program: Command) {
	wallet
		.command("sign-message")
		.description(
			"Sign an arbitrary message with your wallet's private key. Offline",
		)
		.argument("<message>", "UTF-8 message to sign")
		.action((message: string) =>
			signMessage(message, program.opts() as GlobalOptions),
		);
}

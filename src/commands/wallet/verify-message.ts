import type { Command } from "commander";
import { verifyKeypairSignature } from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function verifyMessage(
	message: string,
	signature: string,
	publicKey: string,
	globalOpts: GlobalOptions,
) {
	const msgHex = Buffer.from(message, "utf-8").toString("hex").toUpperCase();
	const valid = verifyKeypairSignature(msgHex, signature, publicKey);
	if (globalOpts.json) {
		output({ message, publicKey, signature, valid }, globalOpts);
	} else {
		output(valid ? "Valid" : "Invalid", globalOpts);
	}
}

export function registerVerifyMessage(wallet: Command, program: Command) {
	wallet
		.command("verify-message")
		.description("Verify a signed message against a public key. Offline")
		.argument("<message>", "Original UTF-8 message")
		.argument("<signature>", "Hex-encoded signature")
		.argument("<public-key>", "Hex-encoded public key")
		.action((message: string, signature: string, publicKey: string) =>
			verifyMessage(
				message,
				signature,
				publicKey,
				program.opts() as GlobalOptions,
			),
		);
}

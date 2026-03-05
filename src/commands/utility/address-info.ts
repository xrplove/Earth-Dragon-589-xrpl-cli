import type { Command } from "commander";
import {
	classicAddressToXAddress,
	decodeAccountID,
	isValidClassicAddress,
	isValidXAddress,
	xAddressToClassicAddress,
} from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

export function registerAddressInfo(program: Command) {
	program
		.command("address-info")
		.description("Validate and decode an XRPL address")
		.argument("<address>", "Classic r-address or X-address")
		.action(async (address: string) => {
			const globalOpts = program.opts() as GlobalOptions;

			if (isValidXAddress(address)) {
				const { classicAddress, tag, test } = xAddressToClassicAddress(address);
				const accountId = Buffer.from(decodeAccountID(classicAddress))
					.toString("hex")
					.toUpperCase();
				const info: Record<string, unknown> = {
					valid: true,
					type: "x-address",
					classic: classicAddress,
					accountId,
					tag: tag !== false ? tag : null,
					network: test ? "testnet" : "mainnet",
				};
				if (globalOpts.json) {
					output(info, globalOpts);
				} else {
					const lines = [
						"Valid: true",
						"Type: x-address",
						`Classic: ${classicAddress}`,
						`Account ID: ${accountId}`,
						`Tag: ${tag !== false ? tag : "none"}`,
						`Network: ${test ? "testnet" : "mainnet"}`,
					];
					output(lines.join("\n"), globalOpts);
				}
			} else if (isValidClassicAddress(address)) {
				const accountId = Buffer.from(decodeAccountID(address))
					.toString("hex")
					.toUpperCase();
				const xAddress = classicAddressToXAddress(address, false, false);
				const info: Record<string, unknown> = {
					valid: true,
					type: "classic",
					accountId,
					xAddress,
					network: "any",
				};
				if (globalOpts.json) {
					output(info, globalOpts);
				} else {
					const lines = [
						"Valid: true",
						"Type: classic",
						`Account ID: ${accountId}`,
						`X-Address: ${xAddress}`,
						"Network: any",
					];
					output(lines.join("\n"), globalOpts);
				}
			} else {
				const info = { valid: false, address };
				if (globalOpts.json) {
					output(info, globalOpts);
				} else {
					output("Valid: false", globalOpts);
				}
			}
		});
}

import type { Command } from "commander";
import {
	classicAddressToXAddress,
	decodeAccountID,
	dropsToXrp,
	isoTimeToRippleTime,
	isValidClassicAddress,
	isValidXAddress,
	rippleTimeToISOTime,
	xAddressToClassicAddress,
	xrpToDrops,
} from "xrpl";
import { output } from "../lib/output.js";
import type { GlobalOptions } from "../lib/types.js";

export function registerUtilityCommands(program: Command) {
	program
		.command("xrp-to-drops")
		.description("Convert XRP to drops (1 XRP = 1,000,000 drops)")
		.argument("<amount>", "XRP amount")
		.action(async (amount: string) => {
			const globalOpts = program.opts() as GlobalOptions;
			const drops = xrpToDrops(amount);
			if (globalOpts.json) {
				output({ xrp: amount, drops }, globalOpts);
			} else {
				output(drops, globalOpts);
			}
		});

	program
		.command("drops-to-xrp")
		.description("Convert drops to XRP")
		.argument("<drops>", "Amount in drops")
		.action(async (drops: string) => {
			const globalOpts = program.opts() as GlobalOptions;
			const xrp = String(dropsToXrp(drops));
			if (globalOpts.json) {
				output({ drops, xrp }, globalOpts);
			} else {
				output(xrp, globalOpts);
			}
		});

	program
		.command("ripple-time")
		.description("Convert between XRPL epoch and ISO 8601 timestamps")
		.option("--to-iso <timestamp>", "Ripple epoch timestamp to ISO 8601")
		.option("--to-ripple <iso>", "ISO 8601 string to Ripple epoch timestamp")
		.action(async (opts: { toIso?: string; toRipple?: string }) => {
			const globalOpts = program.opts() as GlobalOptions;
			if (opts.toIso != null) {
				const iso = rippleTimeToISOTime(Number(opts.toIso));
				if (globalOpts.json) {
					output({ rippleTime: Number(opts.toIso), iso }, globalOpts);
				} else {
					output(iso, globalOpts);
				}
			} else if (opts.toRipple != null) {
				const rippleTime = isoTimeToRippleTime(opts.toRipple);
				if (globalOpts.json) {
					output({ iso: opts.toRipple, rippleTime }, globalOpts);
				} else {
					output(String(rippleTime), globalOpts);
				}
			} else {
				throw new Error("Provide exactly one of --to-iso or --to-ripple.");
			}
		});

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
						`Valid: true`,
						`Type: x-address`,
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
						`Valid: true`,
						`Type: classic`,
						`Account ID: ${accountId}`,
						`X-Address: ${xAddress}`,
						`Network: any`,
					];
					output(lines.join("\n"), globalOpts);
				}
			} else {
				const info = { valid: false, address };
				if (globalOpts.json) {
					output(info, globalOpts);
				} else {
					output(`Valid: false`, globalOpts);
				}
			}
		});

	program
		.command("to-hex")
		.description("Convert a UTF-8 string to hex")
		.argument("<string>", "UTF-8 string to encode")
		.action(async (str: string) => {
			const globalOpts = program.opts() as GlobalOptions;
			const hex = Buffer.from(str, "utf-8").toString("hex").toUpperCase();
			if (globalOpts.json) {
				output({ input: str, hex }, globalOpts);
			} else {
				output(hex, globalOpts);
			}
		});

	program
		.command("from-hex")
		.description("Convert hex to a UTF-8 string")
		.argument("<hex>", "Hex string to decode")
		.action(async (hex: string) => {
			const globalOpts = program.opts() as GlobalOptions;
			const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
			const str = Buffer.from(cleaned, "hex").toString("utf-8");
			if (globalOpts.json) {
				output({ hex: cleaned, string: str }, globalOpts);
			} else {
				output(str, globalOpts);
			}
		});
}

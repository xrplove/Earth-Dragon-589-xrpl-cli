import type { Command } from "commander";
import {
	classicAddressToXAddress,
	decodeAccountID,
	encodeAccountID,
	isValidClassicAddress,
	isValidXAddress,
	xAddressToClassicAddress,
} from "xrpl";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function inspectFromHex(hex: string, globalOpts: GlobalOptions) {
	const bytes = Buffer.from(hex, "hex");
	if (bytes.length !== 20) {
		throw new Error("Account ID must be exactly 20 bytes (40 hex characters).");
	}
	const classicAddress = encodeAccountID(bytes);
	const xAddress = classicAddressToXAddress(classicAddress, false, false);
	const info = {
		accountId: hex.toUpperCase(),
		classic: classicAddress,
		xAddress,
	};
	if (globalOpts.json) {
		output(info, globalOpts);
	} else {
		output(
			[
				`Account ID: ${info.accountId}`,
				`Classic: ${classicAddress}`,
				`X-Address: ${xAddress}`,
			].join("\n"),
			globalOpts,
		);
	}
}

async function inspectAddress(address: string, globalOpts: GlobalOptions) {
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
}

export function registerAddressInfo(program: Command) {
	program
		.command("address-info")
		.description("Validate and decode an XRPL address")
		.argument(
			"<address>",
			"Classic r-address, X-address, or 40-char hex account ID with --from-hex",
		)
		.option("--from-hex", "Treat input as a hex-encoded 20-byte account ID")
		.action((address: string, opts: { fromHex?: boolean }) => {
			const globalOpts = program.opts() as GlobalOptions;
			return opts.fromHex
				? inspectFromHex(address, globalOpts)
				: inspectAddress(address, globalOpts);
		});
}

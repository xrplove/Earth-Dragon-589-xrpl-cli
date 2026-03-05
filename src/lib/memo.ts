import type { Memo } from "xrpl/dist/npm/models/common/index.js";

function toHex(value: string): string {
	if (value.startsWith("hex:")) {
		return value.slice(4);
	}
	return Buffer.from(value, "utf-8").toString("hex").toUpperCase();
}

/**
 * Parse a memo string in the format "type:data".
 * Both type and data are UTF-8 by default, hex-encoded automatically.
 * Prefix a value with "hex:" to pass raw hex through as-is.
 *
 * Examples:
 *   "type:interchain_transfer"          → both UTF-8 encoded
 *   "hex:74797065:hex:696e74657263..."   → both raw hex passthrough
 *   "hex:74797065:interchain_transfer"   → hex type, UTF-8 data
 */
export function parseMemo(raw: string): Memo {
	let rawType: string;
	let rawData: string;

	if (raw.startsWith("hex:")) {
		// Type is hex-prefixed — find the separator after the hex value
		const rest = raw.slice(4); // after "hex:"
		const colonIndex = rest.indexOf(":");
		if (colonIndex === -1) {
			throw new Error(
				`Invalid memo format "${raw}". Expected "type:data" (e.g. "type:interchain_transfer").`,
			);
		}
		rawType = `hex:${rest.slice(0, colonIndex)}`;
		rawData = rest.slice(colonIndex + 1);
	} else {
		const colonIndex = raw.indexOf(":");
		if (colonIndex === -1) {
			throw new Error(
				`Invalid memo format "${raw}". Expected "type:data" (e.g. "type:interchain_transfer").`,
			);
		}
		rawType = raw.slice(0, colonIndex);
		rawData = raw.slice(colonIndex + 1);
	}

	return {
		Memo: {
			MemoType: toHex(rawType),
			MemoData: toHex(rawData),
		},
	};
}

export function parseMemos(raws: string[]): Memo[] {
	return raws.map(parseMemo);
}

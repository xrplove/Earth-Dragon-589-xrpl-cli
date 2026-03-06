import type { Memo } from "xrpl";

const MEMO_RE = /^(hex:)?([^:]+):(hex:)?(.+)$/s;

function encodeField(raw: string, isHex: boolean): string {
	if (isHex) return raw;
	return Buffer.from(raw, "utf-8").toString("hex").toUpperCase();
}

/**
 * Parse a memo string in the format "[hex:]type:[hex:]data".
 * Both type and data are UTF-8 by default, hex-encoded automatically.
 * Prefix either side with "hex:" to pass raw hex through as-is.
 *
 * Examples:
 *   "type:interchain_transfer"          → both UTF-8 encoded
 *   "hex:74797065:hex:696e74657263..."   → both raw hex passthrough
 *   "hex:74797065:interchain_transfer"   → hex type, UTF-8 data
 */
export function parseMemo(raw: string): Memo {
	const match = MEMO_RE.exec(raw);
	if (!match) {
		throw new Error(
			`Invalid memo format "${raw}". Expected "type:data" (e.g. "type:interchain_transfer").`,
		);
	}

	const [, hexType, type, hexData, data] = match;

	return {
		Memo: {
			MemoType: encodeField(type, !!hexType),
			MemoData: encodeField(data, !!hexData),
		},
	};
}

export function parseMemos(raws: string[]): Memo[] {
	return raws.map(parseMemo);
}

import { describe, expect, it } from "vitest";
import { parseMemo, parseMemos } from "../src/lib/memo.js";

describe("parseMemo", () => {
	it("hex-encodes UTF-8 type and data", () => {
		const result = parseMemo("type:interchain_transfer");
		expect(result).toEqual({
			Memo: {
				MemoType: "74797065",
				MemoData: "696E746572636861696E5F7472616E73666572",
			},
		});
	});

	it("passes raw hex through with hex: prefix", () => {
		const result = parseMemo("hex:74797065:hex:696e746572636861696e");
		expect(result).toEqual({
			Memo: {
				MemoType: "74797065",
				MemoData: "696e746572636861696e",
			},
		});
	});

	it("handles mixed: hex type, UTF-8 data", () => {
		const result = parseMemo("hex:74797065:interchain_transfer");
		expect(result).toEqual({
			Memo: {
				MemoType: "74797065",
				MemoData: "696E746572636861696E5F7472616E73666572",
			},
		});
	});

	it("handles 0x-prefixed data correctly (not treated as hex)", () => {
		const result = parseMemo(
			"destination_address:0x0A90c0Af1B07f6AC34f3520348Dbfae73BDa358E",
		);
		expect(result.Memo.MemoType).toBe(
			Buffer.from("destination_address").toString("hex").toUpperCase(),
		);
		// The 0x value is treated as UTF-8 string, not raw hex
		expect(result.Memo.MemoData).toBe(
			Buffer.from("0x0A90c0Af1B07f6AC34f3520348Dbfae73BDa358E")
				.toString("hex")
				.toUpperCase(),
		);
	});

	it("throws on missing colon separator", () => {
		expect(() => parseMemo("nocolon")).toThrow("Invalid memo format");
	});

	it("handles data containing colons", () => {
		const result = parseMemo("url:https://example.com:8080/path");
		expect(result.Memo.MemoType).toBe(
			Buffer.from("url").toString("hex").toUpperCase(),
		);
		expect(result.Memo.MemoData).toBe(
			Buffer.from("https://example.com:8080/path")
				.toString("hex")
				.toUpperCase(),
		);
	});
});

describe("parseMemos", () => {
	it("parses multiple memos", () => {
		const result = parseMemos(["type:transfer", "chain:ethereum"]);
		expect(result).toHaveLength(2);
		expect(result[0].Memo.MemoType).toBe(
			Buffer.from("type").toString("hex").toUpperCase(),
		);
		expect(result[1].Memo.MemoType).toBe(
			Buffer.from("chain").toString("hex").toUpperCase(),
		);
	});
});

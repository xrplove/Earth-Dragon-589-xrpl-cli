import { describe, expect, it } from "vitest";
import { parseToken, toXrplAmount } from "../src/lib/tokens.js";

describe("parseToken", () => {
	it("parses XRP (case-insensitive)", () => {
		expect(parseToken("XRP")).toEqual({ type: "xrp", drops: "0" });
		expect(parseToken("xrp")).toEqual({ type: "xrp", drops: "0" });
		expect(parseToken("Xrp")).toEqual({ type: "xrp", drops: "0" });
	});

	it("parses standard IOU currency.issuer", () => {
		const result = parseToken("USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B");
		expect(result).toEqual({
			type: "iou",
			currency: "USD",
			issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
		});
	});

	it("parses hex currency code IOU", () => {
		const hexCurrency = "0158415500000000C1F76FF6ECB0BAC600000000";
		const result = parseToken(
			`${hexCurrency}.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B`,
		);
		expect(result).toEqual({
			type: "iou",
			currency: hexCurrency,
			issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
		});
	});

	it("parses MPT token", () => {
		const id = "00064D1C63CEBEB49FC20032206CE0F203138BFC59F1AC57";
		const result = parseToken(`mpt:${id}`);
		expect(result).toEqual({ type: "mpt", mpt_issuance_id: id });
	});

	it("rejects invalid currency code", () => {
		expect(() =>
			parseToken("TOOLONG.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"),
		).toThrow("Invalid currency code");
	});

	it("rejects completely invalid notation", () => {
		expect(() => parseToken("nonsense")).toThrow("Invalid token notation");
	});

	it("rejects mpt with wrong length", () => {
		expect(() => parseToken("mpt:ABC123")).toThrow("Invalid token notation");
	});
});

describe("toXrplAmount", () => {
	it("converts XRP to drops", () => {
		const token = parseToken("XRP");
		expect(toXrplAmount(token, "10")).toBe("10000000");
	});

	it("converts IOU to amount object", () => {
		const token = parseToken("USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B");
		expect(toXrplAmount(token, "100")).toEqual({
			currency: "USD",
			issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
			value: "100",
		});
	});

	it("converts MPT to amount object", () => {
		const id = "00064D1C63CEBEB49FC20032206CE0F203138BFC59F1AC57";
		const token = parseToken(`mpt:${id}`);
		expect(toXrplAmount(token, "50")).toEqual({
			mpt_issuance_id: id,
			value: "50",
		});
	});
});

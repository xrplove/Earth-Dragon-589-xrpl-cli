import { describe, expect, it } from "vitest";
import { tokenSpec } from "../src/lib/schemas.js";
import { parseToken, toXrplAmount } from "../src/lib/tokens.js";

describe("parseToken + toXrplAmount", () => {
	it("builds correct XRP amount (drops)", () => {
		const token = parseToken("XRP");
		const amount = toXrplAmount(token, "10");
		expect(amount).toBe("10000000");
	});

	it("builds correct IOU amount object", () => {
		const token = parseToken("USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B");
		const amount = toXrplAmount(token, "100");
		expect(amount).toEqual({
			currency: "USD",
			issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
			value: "100",
		});
	});

	it("builds correct MPT amount object", () => {
		const token = parseToken(
			"mpt:0006C4F1C1F15A0924816FB85A5F5A3AD73B0000A69B63A9",
		);
		const amount = toXrplAmount(token, "50");
		expect(amount).toEqual({
			mpt_issuance_id: "0006C4F1C1F15A0924816FB85A5F5A3AD73B0000A69B63A9",
			value: "50",
		});
	});
});

describe("tokenSpec schema", () => {
	it("accepts XRP (case-insensitive)", () => {
		expect(tokenSpec.parse("XRP")).toBe("XRP");
	});

	it("accepts IOU notation", () => {
		expect(tokenSpec.parse("USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B")).toBe(
			"USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
		);
	});

	it("accepts MPT notation", () => {
		const mpt = "mpt:0006C4F1C1F15A0924816FB85A5F5A3AD73B0000A69B63A9";
		expect(tokenSpec.parse(mpt)).toBe(mpt);
	});

	it("rejects invalid token", () => {
		expect(() => tokenSpec.parse("INVALID")).toThrow("Invalid token");
	});
});

describe("memo encoding integration", () => {
	it("parseMemo produces correct hex-encoded output", async () => {
		const { parseMemo } = await import("../src/lib/memo.js");
		const memo = parseMemo("type:interchain_transfer");
		expect(memo.Memo.MemoType).toBe(
			Buffer.from("type", "utf-8").toString("hex").toUpperCase(),
		);
		expect(memo.Memo.MemoData).toBe(
			Buffer.from("interchain_transfer", "utf-8").toString("hex").toUpperCase(),
		);
	});
});

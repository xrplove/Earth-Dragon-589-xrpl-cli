import { describe, expect, it } from "vitest";
import { xrpToDrops } from "xrpl";
import { parseToken, toXrplAmount } from "../src/lib/tokens.js";

describe("send: Payment transaction building", () => {
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

	it("converts fractional XRP correctly", () => {
		expect(xrpToDrops("0.5")).toBe("500000");
		expect(xrpToDrops("0.000001")).toBe("1");
	});

	it("assembles Payment fields for XRP send", () => {
		const token = parseToken("XRP");
		const tx: Record<string, unknown> = {
			TransactionType: "Payment",
			Destination: "rDestination123456789012345678901",
			Amount: toXrplAmount(token, "10"),
		};
		expect(tx.TransactionType).toBe("Payment");
		expect(tx.Amount).toBe("10000000");
	});

	it("assembles Payment with DestinationTag", () => {
		const token = parseToken("XRP");
		const tx: Record<string, unknown> = {
			TransactionType: "Payment",
			Destination: "rDestination123456789012345678901",
			Amount: toXrplAmount(token, "5"),
			DestinationTag: 12345,
		};
		expect(tx.DestinationTag).toBe(12345);
	});

	it("assembles Payment with SendMax for cross-currency", () => {
		const token = parseToken("USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B");
		const sendMaxToken = parseToken("USD.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B");
		const tx: Record<string, unknown> = {
			TransactionType: "Payment",
			Destination: "rDestination123456789012345678901",
			Amount: toXrplAmount(token, "100"),
			SendMax: toXrplAmount(sendMaxToken, "110"),
		};
		expect(tx.SendMax).toEqual({
			currency: "USD",
			issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
			value: "110",
		});
	});

	it("builds partial payment flags", () => {
		const TF_PARTIAL_PAYMENT = 0x00020000;
		const TF_LIMIT_QUALITY = 0x00040000;
		const flags = TF_PARTIAL_PAYMENT | TF_LIMIT_QUALITY;
		expect(flags).toBe(0x00060000);
	});
});

describe("send: memo encoding integration", () => {
	it("memo is correctly imported from memo module", async () => {
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

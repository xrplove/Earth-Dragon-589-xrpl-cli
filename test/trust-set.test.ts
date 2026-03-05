import { describe, expect, it } from "vitest";
import {
	currency,
	hexCurrency,
	standardCurrency,
	xrplAddress,
} from "../src/lib/schemas.js";

describe("currency schema", () => {
	it("accepts 3-char standard currency", () => {
		expect(standardCurrency.parse("USD")).toBe("USD");
	});

	it("accepts special characters in standard currency", () => {
		expect(standardCurrency.parse("$#@")).toBe("$#@");
	});

	it("rejects 2-char standard currency", () => {
		expect(() => standardCurrency.parse("US")).toThrow();
	});

	it("rejects 4-char standard currency", () => {
		expect(() => standardCurrency.parse("USDT")).toThrow();
	});

	it("accepts 40-char hex currency", () => {
		const hex = "0158415500000000C1F76FF6ECB0BAC600000000";
		expect(hexCurrency.parse(hex)).toBe(hex);
	});

	it("rejects wrong-length hex currency", () => {
		expect(() => hexCurrency.parse("0158415500")).toThrow();
	});

	it("currency union accepts standard", () => {
		expect(currency.parse("USD")).toBe("USD");
	});

	it("currency union accepts hex", () => {
		const hex = "0158415500000000C1F76FF6ECB0BAC600000000";
		expect(currency.parse(hex)).toBe(hex);
	});

	it("currency union accepts non-standard ASCII", () => {
		expect(currency.parse("NONST")).toBe("NONST");
		expect(currency.parse("MyToken")).toBe("MyToken");
	});

	it("currency union rejects empty string", () => {
		expect(() => currency.parse("")).toThrow();
	});

	it("currency union rejects over 20 chars", () => {
		expect(() => currency.parse("A".repeat(21))).toThrow();
	});
});

describe("xrplAddress schema", () => {
	it("accepts valid address", () => {
		expect(xrplAddress.parse("rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B")).toBe(
			"rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
		);
	});

	it("rejects address not starting with r", () => {
		expect(() =>
			xrplAddress.parse("xvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"),
		).toThrow();
	});

	it("rejects too-short address", () => {
		expect(() => xrplAddress.parse("r123")).toThrow();
	});
});

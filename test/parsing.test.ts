import { describe, expect, it } from "vitest";
import { parseFields, parseLedgerIndex } from "../src/lib/parsing.js";

describe("parseLedgerIndex", () => {
	it("returns undefined for undefined input", () => {
		expect(parseLedgerIndex(undefined)).toBeUndefined();
	});

	it("passes through validated/closed/current as strings", () => {
		expect(parseLedgerIndex("validated")).toBe("validated");
		expect(parseLedgerIndex("closed")).toBe("closed");
		expect(parseLedgerIndex("current")).toBe("current");
	});

	it("converts numeric strings to numbers", () => {
		expect(parseLedgerIndex("12345")).toBe(12345);
		expect(parseLedgerIndex("0")).toBe(0);
	});

	it("returns the raw string for non-numeric, non-shortcut values", () => {
		expect(parseLedgerIndex("abc")).toBe("abc");
	});
});

describe("parseFields", () => {
	it("parses simple key-value pairs as strings", () => {
		const result = parseFields(["--Account", "rABC123", "--Amount", "1000000"]);
		expect(result).toEqual({ Account: "rABC123", Amount: "1000000" });
	});

	it("parses JSON objects", () => {
		const result = parseFields([
			"--TakerPays",
			'{"currency":"USD","issuer":"rIssuer","value":"100"}',
		]);
		expect(result).toEqual({
			TakerPays: { currency: "USD", issuer: "rIssuer", value: "100" },
		});
	});

	it("parses JSON arrays", () => {
		const result = parseFields(["--Paths", '[["rA","rB"]]']);
		expect(result).toEqual({ Paths: [["rA", "rB"]] });
	});

	it("parses boolean flags without values", () => {
		const result = parseFields(["--tfSellToken", "--Amount", "100"]);
		expect(result).toEqual({ tfSellToken: true, Amount: "100" });
	});

	it("parses true/false string values as booleans", () => {
		const result = parseFields(["--binary", "true", "--expand", "false"]);
		expect(result).toEqual({ binary: true, expand: false });
	});

	it("keeps numeric strings as strings (not numbers)", () => {
		const result = parseFields(["--Amount", "1000000"]);
		expect(result.Amount).toBe("1000000");
		expect(typeof result.Amount).toBe("string");
	});

	it("falls back to string for invalid JSON starting with {", () => {
		const result = parseFields(["--Memo", "{invalid"]);
		expect(result.Memo).toBe("{invalid");
	});
});

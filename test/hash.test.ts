import { describe, expect, it } from "vitest";
import { computeHash } from "../src/commands/utility/hash.js";

describe("computeHash", () => {
	it("sha256 of UTF-8 string", () => {
		expect(computeHash("sha256", "test", false)).toBe(
			"9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08",
		);
	});

	it("sha512 of UTF-8 string", () => {
		expect(computeHash("sha512", "test", false)).toBe(
			"EE26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4940E0DB27AC185F8A0E1D5F84F88BC887FD67B143732C304CC5FA9AD8E6F57F50028A8FF",
		);
	});

	it("sha512half returns first 32 bytes of sha512", () => {
		const full = computeHash("sha512", "test", false);
		const half = computeHash("sha512half", "test", false);
		expect(half).toBe(full.slice(0, 64));
		expect(half).toHaveLength(64);
	});

	it("ripemd160 of UTF-8 string", () => {
		expect(computeHash("ripemd160", "test", false)).toBe(
			"5E52FEE47E6B070565F74372468CDC699DE89107",
		);
	});

	it("hex input produces same result as equivalent UTF-8", () => {
		const fromUtf8 = computeHash("sha256", "test", false);
		const fromHex = computeHash("sha256", "74657374", true);
		expect(fromHex).toBe(fromUtf8);
	});

	it("empty string hashes correctly", () => {
		// SHA-256 of empty input is a well-known constant
		expect(computeHash("sha256", "", false)).toBe(
			"E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855",
		);
	});
});

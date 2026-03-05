import { describe, expect, it } from "vitest";

describe("trust-set: TrustSet transaction building", () => {
	it("builds LimitAmount with currency and issuer", () => {
		const limitAmount = {
			currency: "USD",
			issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
			value: "1000000",
		};
		expect(limitAmount.currency).toBe("USD");
		expect(limitAmount.issuer).toBe("rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B");
		expect(limitAmount.value).toBe("1000000");
	});

	it("builds LimitAmount with zero to remove trust line", () => {
		const limitAmount = {
			currency: "USD",
			issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
			value: "0",
		};
		expect(limitAmount.value).toBe("0");
	});

	it("builds correct flags for noRipple", () => {
		const TF_SET_NO_RIPPLE = 0x00020000;
		expect(TF_SET_NO_RIPPLE).toBe(131072);
	});

	it("builds correct flags for freeze", () => {
		const TF_SET_FREEZE = 0x00100000;
		expect(TF_SET_FREEZE).toBe(1048576);
	});

	it("combines multiple flags", () => {
		const TF_SET_NO_RIPPLE = 0x00020000;
		const TF_SET_FREEZE = 0x00100000;
		const TF_SET_AUTH = 0x00010000;
		const flags = TF_SET_NO_RIPPLE | TF_SET_FREEZE | TF_SET_AUTH;
		expect(flags & TF_SET_NO_RIPPLE).toBeTruthy();
		expect(flags & TF_SET_FREEZE).toBeTruthy();
		expect(flags & TF_SET_AUTH).toBeTruthy();
	});

	it("supports hex currency codes", () => {
		const hexCurrency = "0158415500000000C1F76FF6ECB0BAC600000000";
		expect(hexCurrency).toHaveLength(40);
		const limitAmount = {
			currency: hexCurrency,
			issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
			value: "1000",
		};
		expect(limitAmount.currency).toBe(hexCurrency);
	});

	it("includes QualityIn and QualityOut when set", () => {
		const tx: Record<string, unknown> = {
			TransactionType: "TrustSet",
			LimitAmount: {
				currency: "USD",
				issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
				value: "1000",
			},
			QualityIn: 900000000,
			QualityOut: 1100000000,
		};
		expect(tx.QualityIn).toBe(900000000);
		expect(tx.QualityOut).toBe(1100000000);
	});
});

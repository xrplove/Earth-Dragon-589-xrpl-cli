import { describe, expect, it } from "vitest";
import { collectSigners } from "../src/commands/signing/multisign-combine.js";
import { signerEntry } from "../src/lib/schemas.js";
import { calcSignersFee } from "../src/lib/tx.js";

describe("signerEntry schema", () => {
	it("parses valid address:weight format", () => {
		const result = signerEntry.parse("rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B:2");
		expect(result).toEqual({
			SignerEntry: {
				Account: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
				SignerWeight: 2,
			},
		});
	});

	it("rejects entry without colon", () => {
		expect(() =>
			signerEntry.parse("rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"),
		).toThrow("Invalid signer format");
	});

	it("rejects non-integer weight", () => {
		expect(() =>
			signerEntry.parse("rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B:abc"),
		).toThrow("Invalid signer weight");
	});

	it("rejects zero weight", () => {
		expect(() =>
			signerEntry.parse("rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B:0"),
		).toThrow("Invalid signer weight");
	});
});

describe("collectSigners", () => {
	const makeTx = (account: string) =>
		JSON.stringify({
			TransactionType: "Payment",
			Account: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
			Signers: [
				{
					Signer: {
						Account: account,
						SigningPubKey: "PK",
						TxnSignature: "SIG",
					},
				},
			],
		});

	it("merges signers from multiple transaction args", () => {
		const { signers } = collectSigners(
			[
				makeTx("rBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"),
				makeTx("rAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
			],
			undefined,
		);
		expect(signers).toHaveLength(2);
		// Must be sorted by account
		expect(signers[0].Signer.Account).toBe(
			"rAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		);
		expect(signers[1].Signer.Account).toBe("rBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");
	});

	it("throws when no transactions provided", () => {
		expect(() => collectSigners([], undefined)).toThrow(
			"Provide signed transactions",
		);
	});

	it("throws when a transaction has no Signers", () => {
		const tx = JSON.stringify({
			TransactionType: "Payment",
			Account: "rTest",
		});
		expect(() => collectSigners([tx], undefined)).toThrow(
			"must have a Signers array",
		);
	});

	it("strips Signers from the base transaction", () => {
		const { baseTx } = collectSigners(
			[makeTx("rAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")],
			undefined,
		);
		expect(baseTx.Signers).toBeUndefined();
	});
});

describe("calcSignersFee", () => {
	it("calculates fee as (n+1) * base_fee", async () => {
		const fee = await calcSignersFee(
			{
				request: () =>
					Promise.resolve({ result: { drops: { base_fee: "10" } } }),
			} as never,
			undefined,
			3,
		);
		expect(fee).toBe("40");
	});

	it("uses existing fee when provided", async () => {
		const fee = await calcSignersFee({} as never, "15", 2);
		expect(fee).toBe("45");
	});
});

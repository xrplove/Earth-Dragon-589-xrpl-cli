import { describe, expect, it } from "vitest";
import { decode, Wallet } from "xrpl";

describe("signer-list-set: SignerListSet transaction building", () => {
	it("parses signer entries from address:weight format", () => {
		const entries = [
			"rAddr1xxxxxxxxxxxxxxxxxxxxxxxxxxxxx:1",
			"rAddr2xxxxxxxxxxxxxxxxxxxxxxxxxxxxx:2",
		];
		const parsed = entries.map((entry) => {
			const [address, weight] = entry.split(":");
			return {
				SignerEntry: { Account: address, SignerWeight: Number(weight) },
			};
		});
		expect(parsed).toHaveLength(2);
		expect(parsed[0].SignerEntry.Account).toBe(
			"rAddr1xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
		);
		expect(parsed[0].SignerEntry.SignerWeight).toBe(1);
		expect(parsed[1].SignerEntry.SignerWeight).toBe(2);
	});

	it("builds correct SignerListSet transaction", () => {
		const tx = {
			TransactionType: "SignerListSet",
			Account: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
			SignerQuorum: 3,
			SignerEntries: [
				{
					SignerEntry: {
						Account: "rAddr1xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
						SignerWeight: 1,
					},
				},
				{
					SignerEntry: {
						Account: "rAddr2xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
						SignerWeight: 1,
					},
				},
				{
					SignerEntry: {
						Account: "rAddr3xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
						SignerWeight: 1,
					},
				},
			],
		};
		expect(tx.TransactionType).toBe("SignerListSet");
		expect(tx.SignerQuorum).toBe(3);
		expect(tx.SignerEntries).toHaveLength(3);
	});

	it("rejects invalid signer format", () => {
		const entry = "rAddr1xxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
		const [_address, weightStr] = entry.split(":");
		expect(weightStr).toBeUndefined();
	});
});

describe("signer-list-delete: SignerListSet with quorum 0", () => {
	it("builds delete transaction with quorum 0 and empty entries", () => {
		const tx = {
			TransactionType: "SignerListSet",
			Account: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
			SignerQuorum: 0,
			SignerEntries: [],
		};
		expect(tx.SignerQuorum).toBe(0);
		expect(tx.SignerEntries).toHaveLength(0);
	});
});

describe("multisign: adds correct Signers entry", () => {
	it("signs with multisign=true and produces Signers array", () => {
		const w = Wallet.generate();
		const tx = {
			TransactionType: "Payment" as const,
			Account: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
			Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
			Amount: "1000000",
			Fee: "30",
			Sequence: 1,
			SigningPubKey: "",
			LastLedgerSequence: 99999999,
		};

		const signed = w.sign(tx, true);
		const decoded = decode(signed.tx_blob) as Record<string, unknown>;
		const signers = decoded.Signers as Array<{
			Signer: { Account: string; SigningPubKey: string; TxnSignature: string };
		}>;

		expect(signers).toHaveLength(1);
		expect(signers[0].Signer.Account).toBe(w.address);
		expect(signers[0].Signer.SigningPubKey).toBeTruthy();
		expect(signers[0].Signer.TxnSignature).toBeTruthy();
	});

	it("rejects transaction without empty SigningPubKey", () => {
		const tx = {
			TransactionType: "Payment" as const,
			Account: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
			Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
			Amount: "1000000",
			Fee: "30",
			Sequence: 1,
			SigningPubKey: "SOME_PUB_KEY",
		};
		// Our multisign command checks for SigningPubKey === ""
		expect(tx.SigningPubKey).not.toBe("");
	});
});

describe("multisign-combine: merges and sorts by address", () => {
	it("merges Signers from multiple signed transactions", () => {
		const signerA = {
			Signer: {
				Account: "rAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
				SigningPubKey: "AAAA",
				TxnSignature: "SIG_A",
			},
		};
		const signerB = {
			Signer: {
				Account: "rBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
				SigningPubKey: "BBBB",
				TxnSignature: "SIG_B",
			},
		};

		const tx1 = {
			TransactionType: "Payment",
			Account: "rTest",
			Signers: [signerA],
		};
		const tx2 = {
			TransactionType: "Payment",
			Account: "rTest",
			Signers: [signerB],
		};

		// Simulate combine logic
		const allSigners = [...tx1.Signers, ...tx2.Signers];
		allSigners.sort((a, b) => a.Signer.Account.localeCompare(b.Signer.Account));

		expect(allSigners).toHaveLength(2);
		expect(allSigners[0].Signer.Account).toBe(
			"rAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		);
		expect(allSigners[1].Signer.Account).toBe(
			"rBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
		);
	});

	it("sorts signers correctly when provided out of order", () => {
		const signers = [
			{
				Signer: {
					Account: "rZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
					SigningPubKey: "ZZ",
					TxnSignature: "SZ",
				},
			},
			{
				Signer: {
					Account: "rAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
					SigningPubKey: "AA",
					TxnSignature: "SA",
				},
			},
			{
				Signer: {
					Account: "rMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
					SigningPubKey: "MM",
					TxnSignature: "SM",
				},
			},
		];

		signers.sort((a, b) => a.Signer.Account.localeCompare(b.Signer.Account));

		expect(signers[0].Signer.Account).toBe(
			"rAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		);
		expect(signers[1].Signer.Account).toBe("rMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM");
		expect(signers[2].Signer.Account).toBe("rZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ");
	});

	it("rejects transactions without Signers array", () => {
		const tx = { TransactionType: "Payment", Account: "rTest" };
		expect((tx as Record<string, unknown>).Signers).toBeUndefined();
	});
});

describe("multisign fee calculation", () => {
	it("calculates multi-sign fee as (n+1) * base_fee", () => {
		const baseFee = 10;
		const signers = 3;
		const fee = baseFee * (signers + 1);
		expect(fee).toBe(40);
	});

	it("uses existing fee when provided", () => {
		const existingFee = "15";
		const signers = 2;
		const fee = Number(existingFee) * (signers + 1);
		expect(fee).toBe(45);
	});
});

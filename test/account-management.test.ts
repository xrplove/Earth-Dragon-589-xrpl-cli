import { describe, expect, it } from "vitest";
import { parseAsfFlag } from "../src/commands/account/account-set.js";
import { parseCredentials } from "../src/commands/account/deposit-preauth.js";

describe("parseAsfFlag", () => {
	it("parses numeric flag as integer", () => {
		expect(parseAsfFlag("1")).toBe(1);
	});

	it("parses symbolic flag name", () => {
		expect(parseAsfFlag("asfRequireDest")).toBe(1);
	});

	it("parses asfDisableMaster", () => {
		expect(parseAsfFlag("asfDisableMaster")).toBe(4);
	});

	it("parses asfDefaultRipple", () => {
		expect(parseAsfFlag("asfDefaultRipple")).toBe(8);
	});

	it("parses asfDepositAuth", () => {
		expect(parseAsfFlag("asfDepositAuth")).toBe(9);
	});

	it("parses asfAllowTrustLineClawback", () => {
		expect(parseAsfFlag("asfAllowTrustLineClawback")).toBe(16);
	});

	it("rejects unknown flag name", () => {
		expect(() => parseAsfFlag("notAFlag")).toThrow("Unknown flag");
	});

	it("rejects zero", () => {
		expect(() => parseAsfFlag("0")).toThrow("Unknown flag");
	});

	it("rejects negative number", () => {
		expect(() => parseAsfFlag("-1")).toThrow("Unknown flag");
	});

	it("rejects non-integer number", () => {
		expect(() => parseAsfFlag("1.5")).toThrow("Unknown flag");
	});
});

describe("parseCredentials", () => {
	it("parses a single credential", () => {
		const result = parseCredentials(["rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY:KYC"]);
		expect(result).toEqual([
			{
				Credential: {
					Issuer: "rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY",
					CredentialType: "KYC",
				},
			},
		]);
	});

	it("parses multiple credentials", () => {
		const result = parseCredentials([
			"rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY:KYC",
			"rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh:AML",
		]);
		expect(result).toHaveLength(2);
		expect(result[0].Credential.CredentialType).toBe("KYC");
		expect(result[1].Credential.CredentialType).toBe("AML");
	});

	it("splits on the last colon", () => {
		const result = parseCredentials(["rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY:KYC_LEVEL_2"]);
		expect(result[0].Credential.Issuer).toBe("rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY");
		expect(result[0].Credential.CredentialType).toBe("KYC_LEVEL_2");
	});

	it("throws on missing colon", () => {
		expect(() => parseCredentials(["noColonHere"])).toThrow(
			"Invalid credential format",
		);
	});
});

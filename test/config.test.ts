import { describe, expect, it } from "vitest";
import { resolveAlias } from "../src/lib/config.js";

describe("resolveAlias", () => {
	const aliases = {
		myaccount: "rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY",
		gateway: "rGAbJZEzU6WaYv5y1LfyN7LBBcQJ3TxsKC",
	};

	it("resolves a known alias", () => {
		expect(resolveAlias("myaccount", aliases)).toBe(
			"rN7n3473SaZBCG4dFL83w7p1W9cgPBKraY",
		);
	});

	it("resolves another alias", () => {
		expect(resolveAlias("gateway", aliases)).toBe(
			"rGAbJZEzU6WaYv5y1LfyN7LBBcQJ3TxsKC",
		);
	});

	it("returns the original value if not an alias", () => {
		expect(resolveAlias("rSomeDirectAddress123456789012", aliases)).toBe(
			"rSomeDirectAddress123456789012",
		);
	});

	it("returns the original value with empty aliases", () => {
		expect(resolveAlias("rAddr", {})).toBe("rAddr");
	});
});

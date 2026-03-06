import { describe, expect, it } from "vitest";
import { run, runJson, TESTNET_ARGS } from "./helpers.js";

// Known testnet genesis account — always funded
const GENESIS = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";

describe("e2e: read-only queries", () => {
	it.concurrent("ledger-index returns a number", async () => {
		const result = await runJson(...TESTNET_ARGS, "ledger-index");
		expect(result.ledger_index).toBeTypeOf("number");
		expect(result.ledger_index).toBeGreaterThan(0);
	});

	it.concurrent("server-info returns valid response", async () => {
		const result = await runJson(...TESTNET_ARGS, "server-info");
		expect(result.info).toBeDefined();
		expect((result.info as Record<string, unknown>).build_version).toBeTypeOf(
			"string",
		);
	});

	it.concurrent("fee returns fee data", async () => {
		const result = await runJson(...TESTNET_ARGS, "fee");
		expect(result.drops).toBeDefined();
		const drops = result.drops as Record<string, string>;
		expect(Number(drops.base_fee)).toBeGreaterThan(0);
	});

	it.concurrent("feature --enabled returns non-empty list", async () => {
		const result = await runJson(...TESTNET_ARGS, "feature", "--enabled");
		const keys = Object.keys(result);
		expect(keys.length).toBeGreaterThan(0);
	});

	it.concurrent("balance on genesis account returns XRP", async () => {
		const { stdout } = await run(...TESTNET_ARGS, "balance", GENESIS);
		// Should contain a number followed by XRP or just a number
		expect(stdout).toMatch(/\d/);
	});

	it.concurrent("balance --json returns structured data", async () => {
		const result = await runJson(...TESTNET_ARGS, "balance", GENESIS);
		expect(result.balance).toBeTypeOf("string");
		expect(result.currency).toBe("XRP");
		expect(Number(result.balance)).toBeGreaterThan(0);
	});

	it.concurrent("account-info returns account data", async () => {
		const result = await runJson(...TESTNET_ARGS, "account-info", GENESIS);
		expect(result.account_data).toBeDefined();
		const data = result.account_data as Record<string, unknown>;
		expect(data.Account).toBe(GENESIS);
	});

	it.concurrent("tx looks up a non-existent hash gracefully", async () => {
		const fakeHash =
			"0000000000000000000000000000000000000000000000000000000000000000";
		const { code } = await run(...TESTNET_ARGS, "tx", fakeHash);
		expect(code).not.toBe(0);
	});

	it.concurrent("ping returns pong", async () => {
		const { stdout } = await run(...TESTNET_ARGS, "ping");
		expect(stdout).toContain("pong");
	});

	it.concurrent("rpc server_info round-trips", async () => {
		const result = await runJson(...TESTNET_ARGS, "rpc", "server_info");
		expect(result.info).toBeDefined();
	});

	it.concurrent("ledger returns ledger data", async () => {
		const result = await runJson(...TESTNET_ARGS, "ledger");
		expect(result.ledger).toBeDefined();
		const ledger = result.ledger as Record<string, unknown>;
		expect(ledger.ledger_index).toBeTypeOf("number");
	});
});

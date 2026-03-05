import { describe, expect, it } from "vitest";
import { run, runJson, TESTNET_ARGS } from "./helpers.js";

/**
 * Helper: fund a fresh testnet wallet and return its seed + address.
 */
async function fundWallet() {
	const result = await runJson(...TESTNET_ARGS, "wallet", "fund");
	return { seed: result.seed as string, address: result.address as string };
}

describe("e2e: payments & trust lines", () => {
	it("send XRP between two accounts and verify balance changed", async () => {
		const sender = await fundWallet();
		const receiver = await fundWallet();

		const beforeBalance = await runJson(
			...TESTNET_ARGS,
			"balance",
			receiver.address,
		);
		const before = Number(beforeBalance.balance);

		await runJson(
			...TESTNET_ARGS,
			"-s",
			sender.seed,
			"send",
			"--to",
			receiver.address,
			"--amount",
			"10",
			"--token",
			"XRP",
		);

		const afterBalance = await runJson(
			...TESTNET_ARGS,
			"balance",
			receiver.address,
		);
		const after = Number(afterBalance.balance);

		// Receiver should have gained 10 XRP (10_000_000 drops)
		expect(after - before).toBe(10_000_000);
	}, 60_000);

	it("send with --memo attaches memos to the transaction", async () => {
		const sender = await fundWallet();
		const receiver = await fundWallet();

		const sendResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			sender.seed,
			"send",
			"--to",
			receiver.address,
			"--amount",
			"1",
			"--token",
			"XRP",
			"--memo",
			"test:hello",
		);

		// The submit result has the hash nested in the response
		const hash =
			(sendResult.hash as string) ??
			(sendResult.tx_json as Record<string, unknown>)?.hash;
		expect(hash).toBeTypeOf("string");

		const txResult = await runJson(...TESTNET_ARGS, "tx", hash);
		expect(txResult.Memos).toBeDefined();
		const memos = txResult.Memos as Array<Record<string, unknown>>;
		expect(memos.length).toBeGreaterThan(0);
	}, 60_000);

	it("trust-set creates a trust line", async () => {
		const account = await fundWallet();
		const issuer = await fundWallet();

		await runJson(
			...TESTNET_ARGS,
			"-s",
			account.seed,
			"trust-set",
			"USD",
			issuer.address,
			"--limit",
			"1000",
		);

		const lines = await runJson(
			...TESTNET_ARGS,
			"account-lines",
			account.address,
		);
		const trustLines = lines.lines as Array<Record<string, unknown>>;
		const usdLine = trustLines.find(
			(l) => l.currency === "USD" && l.account === issuer.address,
		);
		expect(usdLine).toBeDefined();
		expect(usdLine?.limit).toBe("1000");
	}, 60_000);
});

describe("e2e: account management", () => {
	it("account-set --domain and verify via account-info", async () => {
		const account = await fundWallet();

		await runJson(
			...TESTNET_ARGS,
			"-s",
			account.seed,
			"account-set",
			"--domain",
			"example.com",
		);

		const info = await runJson(
			...TESTNET_ARGS,
			"account-info",
			account.address,
		);
		const data = info.account_data as Record<string, unknown>;
		// Domain is hex-encoded ASCII
		const expectedHex = Buffer.from("example.com", "ascii")
			.toString("hex")
			.toUpperCase();
		expect(data.Domain).toBe(expectedHex);
	}, 60_000);

	it("ticket-create and tickets round-trip", async () => {
		const account = await fundWallet();

		await runJson(
			...TESTNET_ARGS,
			"-s",
			account.seed,
			"ticket-create",
			"3",
		);

		const tickets = await runJson(
			...TESTNET_ARGS,
			"tickets",
			account.address,
		);
		const ticketList = tickets as unknown as Array<Record<string, unknown>>;
		expect(ticketList.length).toBe(3);
	}, 60_000);

	it("set-regular-key assigns a regular key", async () => {
		const account = await fundWallet();
		const regularKey = await runJson("wallet", "generate");

		await runJson(
			...TESTNET_ARGS,
			"-s",
			account.seed,
			"set-regular-key",
			"--key",
			regularKey.address as string,
		);

		const info = await runJson(
			...TESTNET_ARGS,
			"account-info",
			account.address,
			"--signer-lists",
		);
		const data = info.account_data as Record<string, unknown>;
		expect(data.RegularKey).toBe(regularKey.address);
	}, 60_000);
});

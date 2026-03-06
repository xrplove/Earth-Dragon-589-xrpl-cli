import { describe, expect, it } from "vitest";
import { fundWallet, runJson, TESTNET_ARGS } from "./helpers.js";

describe("e2e: escrows, checks, payment channels", () => {
	it.concurrent("escrow-create with --finish-after, wait, escrow-finish releases funds", async () => {
		const sender = await fundWallet();
		const receiver = await fundWallet();

		// Create escrow that can be finished 5 seconds from now
		const finishAfter = new Date(Date.now() + 5000).toISOString();

		const createResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			sender.seed,
			"escrow-create",
			"--destination",
			receiver.address,
			"--amount",
			"10",
			"--finish-after",
			finishAfter,
		);
		expect(createResult).toBeDefined();

		// Extract the sequence from the tx
		const txJson = (createResult.tx_json ?? createResult) as Record<
			string,
			unknown
		>;
		const sequence = txJson.Sequence as number;
		expect(sequence).toBeTypeOf("number");

		// Wait for finishAfter to pass (ledger close time lags ~5s behind real time)
		await new Promise((r) => setTimeout(r, 12000));

		// Finish the escrow
		const finishResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			receiver.seed,
			"escrow-finish",
			sender.address,
			String(sequence),
		);
		expect(finishResult).toBeDefined();
	});

	it.concurrent("check-create and check-cash round-trip", async () => {
		const sender = await fundWallet();
		const receiver = await fundWallet();

		// Create a check for 10 XRP
		const createResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			sender.seed,
			"check-create",
			"--destination",
			receiver.address,
			"--send-max-amount",
			"10",
			"--send-max-token",
			"XRP",
		);
		expect(createResult).toBeDefined();

		// Find the check ID from account_objects
		const objects = await runJson(
			...TESTNET_ARGS,
			"account-objects",
			sender.address,
			"--type",
			"check",
		);
		const accountObjects = objects.account_objects as Array<
			Record<string, unknown>
		>;
		const check = accountObjects.find((o) => o.LedgerEntryType === "Check");
		expect(check).toBeDefined();
		const checkId = check?.index as string;
		expect(checkId).toBeTypeOf("string");

		// Cash the check
		const cashResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			receiver.seed,
			"check-cash",
			checkId,
			"--amount",
			"10",
			"--token",
			"XRP",
		);
		expect(cashResult).toBeDefined();
	});

	it.concurrent("channel-create and channel-fund round-trip", async () => {
		const sender = await fundWallet();
		const receiver = await fundWallet();

		// We need the sender's public key for the channel
		const walletInfo = await runJson("wallet", "from-seed", sender.seed);
		const publicKey = walletInfo.publicKey as string;

		// Create a payment channel
		const createResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			sender.seed,
			"channel-create",
			"--destination",
			receiver.address,
			"--amount",
			"10",
			"--settle-delay",
			"60",
			"--public-key",
			publicKey,
		);
		expect(createResult).toBeDefined();

		// Find the channel from account_channels
		const channels = await runJson(
			...TESTNET_ARGS,
			"account-channels",
			sender.address,
		);
		const channelList = channels.channels as Array<Record<string, unknown>>;
		expect(channelList.length).toBeGreaterThan(0);
		const channelId = channelList[0].channel_id as string;

		// Fund the channel with 5 more XRP
		const fundResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			sender.seed,
			"channel-fund",
			channelId,
			"--amount",
			"5",
		);
		expect(fundResult).toBeDefined();

		// Verify increased amount via account_channels
		const afterFund = await runJson(
			...TESTNET_ARGS,
			"account-channels",
			sender.address,
		);
		const updatedChannels = afterFund.channels as Array<
			Record<string, unknown>
		>;
		const updated = updatedChannels.find((c) => c.channel_id === channelId);
		// 10 + 5 = 15 XRP = 15000000 drops
		expect(updated?.amount).toBe("15000000");
	});
});

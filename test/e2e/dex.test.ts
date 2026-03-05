import { describe, expect, it } from "vitest";
import { runJson, TESTNET_ARGS } from "./helpers.js";

/**
 * Helper: fund a fresh testnet wallet and return its seed + address.
 */
async function fundWallet() {
	const result = await runJson(...TESTNET_ARGS, "wallet", "fund");
	return { seed: result.seed as string, address: result.address as string };
}

describe("e2e: DEX", () => {
	it("offer-create, account-offers shows it, offer-cancel removes it", async () => {
		const account = await fundWallet();
		const issuer = await fundWallet();

		// Create a trust line first (needed for IOU offers)
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

		// Create an offer: sell 10 XRP for 5 USD
		const offerResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			account.seed,
			"offer-create",
			"--taker-pays-amount",
			"5",
			"--taker-pays-token",
			`USD.${issuer.address}`,
			"--taker-gets-amount",
			"10",
			"--taker-gets-token",
			"XRP",
		);
		expect(offerResult).toBeDefined();

		// account-offers should show the offer
		const offersResult = await runJson(
			...TESTNET_ARGS,
			"account-offers",
			account.address,
		);
		const offers = offersResult.offers as Array<Record<string, unknown>>;
		expect(offers.length).toBeGreaterThan(0);

		const offer = offers[0];
		const offerSeq = offer.seq as number;
		expect(offerSeq).toBeTypeOf("number");

		// Cancel the offer
		await runJson(
			...TESTNET_ARGS,
			"-s",
			account.seed,
			"offer-cancel",
			String(offerSeq),
		);

		// account-offers should now be empty
		const afterCancel = await runJson(
			...TESTNET_ARGS,
			"account-offers",
			account.address,
		);
		const remainingOffers = afterCancel.offers as Array<
			Record<string, unknown>
		>;
		expect(remainingOffers.length).toBe(0);
	}, 120_000);

	it("book-offers returns order book", async () => {
		const account = await fundWallet();
		const issuer = await fundWallet();

		// Trust line + offer to populate the book
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

		await runJson(
			...TESTNET_ARGS,
			"-s",
			account.seed,
			"offer-create",
			"--taker-pays-amount",
			"5",
			"--taker-pays-token",
			`USD.${issuer.address}`,
			"--taker-gets-amount",
			"10",
			"--taker-gets-token",
			"XRP",
		);

		// Query the order book
		const bookResult = await runJson(
			...TESTNET_ARGS,
			"book-offers",
			`USD.${issuer.address}`,
			"XRP",
		);
		expect(bookResult.offers).toBeDefined();
		const bookOffers = bookResult.offers as Array<Record<string, unknown>>;
		expect(bookOffers.length).toBeGreaterThan(0);
	}, 120_000);

	it("deposit-authorized checks authorization", async () => {
		const sender = await fundWallet();
		const receiver = await fundWallet();

		const result = await runJson(
			...TESTNET_ARGS,
			"deposit-authorized",
			sender.address,
			receiver.address,
		);
		expect(result.deposit_authorized).toBe(true);
	}, 60_000);
});

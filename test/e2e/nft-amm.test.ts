import { describe, expect, it } from "vitest";
import { runJson, TESTNET_ARGS } from "./helpers.js";

async function fundWallet() {
	const result = await runJson(...TESTNET_ARGS, "wallet", "fund");
	return { seed: result.seed as string, address: result.address as string };
}

describe("e2e: NFTs", () => {
	it("mint NFT → account-nfts lists it → sell offer → accept → ownership transferred", async () => {
		const minter = await fundWallet();
		const buyer = await fundWallet();

		// 1. Mint an NFT
		const mintResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			minter.seed,
			"nft-mint",
			"--taxon",
			"1",
			"--uri",
			"https://example.com/nft",
			"--transferable",
		);
		expect(mintResult).toBeDefined();

		// Extract NFToken ID from metadata
		const meta = mintResult.meta as Record<string, unknown>;
		const nftokenId = meta?.nftoken_id as string;
		expect(nftokenId).toBeTypeOf("string");

		// 2. Verify via account-nfts
		const nfts = await runJson(
			...TESTNET_ARGS,
			"account-nfts",
			minter.address,
		);
		const nftList = nfts.account_nfts as Array<Record<string, unknown>>;
		expect(nftList.some((n) => n.NFTokenID === nftokenId)).toBe(true);

		// 3. Create sell offer for 1 XRP
		const offerResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			minter.seed,
			"nft-offer-create",
			nftokenId,
			"--amount",
			"1",
			"--token",
			"XRP",
			"--sell",
		);
		const offerMeta = offerResult.meta as Record<string, unknown>;
		const offerId = offerMeta?.offer_id as string;
		expect(offerId).toBeTypeOf("string");

		// 4. Buyer accepts the sell offer
		await runJson(
			...TESTNET_ARGS,
			"-s",
			buyer.seed,
			"nft-offer-accept",
			"--sell-offer",
			offerId,
		);

		// 5. Verify buyer now owns the NFT
		const buyerNfts = await runJson(
			...TESTNET_ARGS,
			"account-nfts",
			buyer.address,
		);
		const buyerNftList = buyerNfts.account_nfts as Array<Record<string, unknown>>;
		expect(buyerNftList.some((n) => n.NFTokenID === nftokenId)).toBe(true);

		// Minter should no longer have it
		const minterNfts = await runJson(
			...TESTNET_ARGS,
			"account-nfts",
			minter.address,
		);
		const minterNftList = minterNfts.account_nfts as Array<Record<string, unknown>>;
		expect(minterNftList.some((n) => n.NFTokenID === nftokenId)).toBe(false);
	}, 180_000);
});

describe("e2e: AMMs", () => {
	it("amm-create → amm-info shows pool", async () => {
		const account = await fundWallet();
		const issuer = await fundWallet();

		// Enable default ripple on issuer (required for AMM)
		await runJson(
			...TESTNET_ARGS,
			"-s",
			issuer.seed,
			"account-set",
			"--flag",
			"asfDefaultRipple",
		);

		// Set up trust line and issue tokens
		await runJson(
			...TESTNET_ARGS,
			"-s",
			account.seed,
			"trust-set",
			"USD",
			issuer.address,
			"--limit",
			"10000",
		);

		await runJson(
			...TESTNET_ARGS,
			"-s",
			issuer.seed,
			"send",
			"--to",
			account.address,
			"--amount",
			"1000",
			"--token",
			`USD.${issuer.address}`,
		);

		// Create AMM pool: 100 XRP / 50 USD
		const createResult = await runJson(
			...TESTNET_ARGS,
			"-s",
			account.seed,
			"amm-create",
			"--amount1",
			"100",
			"--token1",
			"XRP",
			"--amount2",
			"50",
			"--token2",
			`USD.${issuer.address}`,
			"--trading-fee",
			"500",
		);
		expect(createResult).toBeDefined();

		// Get AMM info using the AMM account from the create result
		const meta = createResult.meta as Record<string, unknown>;
		const nodes = (meta?.AffectedNodes ?? []) as Array<Record<string, unknown>>;
		const ammNode = nodes.find(
			(n) =>
				(n.CreatedNode as Record<string, unknown>)?.LedgerEntryType === "AMM",
		);
		const ammAccount = (
			(ammNode?.CreatedNode as Record<string, unknown>)
				?.NewFields as Record<string, unknown>
		)?.Account as string;

		if (ammAccount) {
			const info = await runJson(
				...TESTNET_ARGS,
				"amm-info",
				"--asset",
				"XRP",
				"--asset2",
				`USD.${issuer.address}`,
			);
			expect(info.amm).toBeDefined();
			const amm = info.amm as Record<string, unknown>;
			expect(amm.trading_fee).toBe(500);
		}
	}, 180_000);
});

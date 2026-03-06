import { describe, expect, it } from "vitest";
import {
	DEVNET_ARGS,
	fundWallet as fundWalletBase,
	runJson,
} from "./helpers.js";

const fundWallet = () => fundWalletBase("devnet");

describe("e2e: MPTs", () => {
	it("full MPT lifecycle: create → authorize → send → destroy", async () => {
		const issuer = await fundWallet();
		const holder = await fundWallet();

		// 1. Create MPT with can-transfer so holder can receive
		const createResult = await runJson(
			...DEVNET_ARGS,
			"-s",
			issuer.seed,
			"mpt-create",
			"--asset-scale",
			"2",
			"--max-amount",
			"1000000",
			"--can-transfer",
		);
		expect(createResult).toBeDefined();

		// Extract mpt_issuance_id from the metadata
		const meta = createResult.meta as Record<string, unknown>;
		const mptId = meta?.mpt_issuance_id as string;
		expect(mptId).toBeTypeOf("string");
		expect(mptId).toHaveLength(48);

		// 2. Holder self-authorizes (opts in to hold the token)
		await runJson(...DEVNET_ARGS, "-s", holder.seed, "mpt-authorize", mptId);

		// 3. Send MPT from issuer to holder
		await runJson(
			...DEVNET_ARGS,
			"-s",
			issuer.seed,
			"send",
			"--to",
			holder.address,
			"--amount",
			"100",
			"--token",
			`mpt:${mptId}`,
		);

		// 4. Send MPT back from holder to issuer (so balance is zero for destroy)
		await runJson(
			...DEVNET_ARGS,
			"-s",
			holder.seed,
			"send",
			"--to",
			issuer.address,
			"--amount",
			"100",
			"--token",
			`mpt:${mptId}`,
		);

		// 5. Holder unauthorizes (opts out)
		await runJson(
			...DEVNET_ARGS,
			"-s",
			holder.seed,
			"mpt-authorize",
			mptId,
			"--unauthorize",
		);

		// 6. Destroy MPT
		const destroyResult = await runJson(
			...DEVNET_ARGS,
			"-s",
			issuer.seed,
			"mpt-destroy",
			mptId,
		);
		expect(destroyResult).toBeDefined();
	});
});

import { Client } from "xrpl";
import type { GlobalOptions, Network } from "./types.js";
import { RPC_URLS } from "./types.js";

const VALID_NETWORKS = new Set<string>(["mainnet", "testnet", "devnet"]);

export function getRpcUrl(opts: GlobalOptions): string {
	if (opts.rpcUrl) return opts.rpcUrl;
	if (!VALID_NETWORKS.has(opts.network)) {
		throw new Error(
			`Unknown network "${opts.network}". Expected: mainnet, testnet, devnet`,
		);
	}
	return RPC_URLS[opts.network];
}

export async function withClient<T>(
	opts: GlobalOptions,
	fn: (client: Client) => Promise<T>,
): Promise<T> {
	const url = getRpcUrl(opts);
	const client = new Client(url);
	try {
		await client.connect();
		return await fn(client);
	} finally {
		await client.disconnect();
	}
}

export function getNetwork(opts: GlobalOptions): Network {
	return opts.network;
}

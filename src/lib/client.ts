import { Client } from "xrpl";
import type { GlobalOptions, Network } from "./types.js";

const RPC_URLS: Record<Network, string> = {
	mainnet: "wss://xrplcluster.com",
	testnet: "wss://s.altnet.rippletest.net:51233",
	devnet: "wss://s.devnet.rippletest.net:51233",
};

export function getRpcUrl(opts: GlobalOptions): string {
	if (opts.rpcUrl) return opts.rpcUrl;
	if (!(opts.network in RPC_URLS)) {
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

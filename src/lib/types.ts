export type Network = "mainnet" | "testnet" | "devnet";

export interface GlobalOptions {
	network: Network;
	rpcUrl?: string;
	seed?: string;
	keyfile?: string;
	json: boolean;
	quiet: boolean;
	yes: boolean;
}

export interface TxOptions {
	prepare: boolean;
	signers?: number;
	memo?: string[];
	ticket?: number;
}

export const RPC_URLS: Record<Network, string> = {
	mainnet: "wss://xrplcluster.com",
	testnet: "wss://s.altnet.rippletest.net:51233",
	devnet: "wss://s.devnet.rippletest.net:51233",
};

export const EXIT_CODES = {
	SUCCESS: 0,
	GENERAL_ERROR: 1,
	INVALID_ARGUMENTS: 2,
	NETWORK_ERROR: 3,
	TX_REJECTED: 4,
	TX_EXPIRED: 5,
} as const;

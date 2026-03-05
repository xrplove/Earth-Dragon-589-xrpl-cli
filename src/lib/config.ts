import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parse } from "smol-toml";
import { xrplAddress } from "./schemas.js";

export interface Config {
	network?: string;
	rpc_url?: string;
	aliases: Record<string, string>;
}

function getConfigPaths(): string[] {
	const xdgConfig = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
	return [join(xdgConfig, "xrpl", "config.toml"), join(homedir(), ".xrplrc")];
}

export function loadConfig(): Config {
	for (const path of getConfigPaths()) {
		if (existsSync(path)) {
			const raw = readFileSync(path, "utf-8");
			const parsed = parse(raw) as Record<string, unknown>;
			return {
				network: parsed.network as string | undefined,
				rpc_url: parsed.rpc_url as string | undefined,
				aliases: (parsed.aliases as Record<string, string>) ?? {},
			};
		}
	}
	return { aliases: {} };
}

export function resolveAlias(
	addressOrAlias: string,
	aliases: Record<string, string>,
): string {
	return aliases[addressOrAlias] ?? addressOrAlias;
}

const _config = loadConfig();

/**
 * Resolve an alias to an address. If it's not an alias, validate as an XRPL address.
 */
export function resolve(addressOrAlias: string): string {
	const resolved = resolveAlias(addressOrAlias, _config.aliases);
	const r = xrplAddress.safeParse(resolved);
	if (!r.success) {
		throw new Error(
			`Invalid address: "${addressOrAlias}". Expected an r-address, X-address, or configured alias.`,
		);
	}
	return resolved;
}

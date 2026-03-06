import { execFile } from "node:child_process";
import { resolve } from "node:path";

const CLI = resolve(import.meta.dirname, "../../dist/index.js");

export function run(
	...args: string[]
): Promise<{ stdout: string; stderr: string; code: number }> {
	return new Promise((resolve) => {
		execFile(
			"node",
			[CLI, "--yes", ...args],
			{ timeout: 120_000 },
			(err, stdout, stderr) => {
				resolve({
					stdout: stdout.trim(),
					stderr: stderr.trim(),
					code: (err as NodeJS.ErrnoException & { code?: number })?.code
						? 1
						: err
							? ((err as { status?: number }).status ?? 1)
							: 0,
				});
			},
		);
	});
}

export function runJson(...args: string[]): Promise<Record<string, unknown>> {
	return run("--json", ...args).then((r) => {
		if (!r.stdout) throw new Error(`No output. stderr: ${r.stderr}`);
		return JSON.parse(r.stdout);
	});
}

export const TESTNET_ARGS = ["-n", "testnet"];
export const DEVNET_ARGS = ["-n", "devnet"];

export async function fundWallet(
	network = "testnet",
): Promise<{ seed: string; address: string }> {
	for (let attempt = 0; attempt < 8; attempt++) {
		const r = await run("--json", "-n", network, "wallet", "fund");
		if (r.stdout) {
			const result = JSON.parse(r.stdout);
			return {
				seed: result.seed as string,
				address: result.address as string,
			};
		}
		if (r.stderr.includes("429") || r.stderr.includes("Too Many")) {
			const delay = 3000 * 2 ** attempt;
			await new Promise((resolve) => setTimeout(resolve, delay));
			continue;
		}
		throw new Error(`fundWallet failed: ${r.stderr}`);
	}
	throw new Error("fundWallet: faucet rate limit after 8 retries");
}

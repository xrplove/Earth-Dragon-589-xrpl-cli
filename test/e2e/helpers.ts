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

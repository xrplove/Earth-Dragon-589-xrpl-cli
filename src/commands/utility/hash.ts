import { createHash } from "node:crypto";
import type { Command } from "commander";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

const ALGORITHMS = ["sha256", "sha512", "sha512half", "ripemd160"] as const;
type Algorithm = (typeof ALGORITHMS)[number];

function computeHash(algorithm: Algorithm, data: string, hex: boolean): string {
	const input = hex ? Buffer.from(data, "hex") : Buffer.from(data, "utf-8");
	if (algorithm === "sha512half") {
		return createHash("sha512")
			.update(input)
			.digest("hex")
			.slice(0, 64)
			.toUpperCase();
	}
	return createHash(algorithm).update(input).digest("hex").toUpperCase();
}

async function hashCommand(
	algorithm: string,
	data: string,
	opts: { hex?: boolean },
	globalOpts: GlobalOptions,
) {
	if (!ALGORITHMS.includes(algorithm as Algorithm)) {
		throw new Error(
			`Unknown algorithm: ${algorithm}. Supported: ${ALGORITHMS.join(", ")}`,
		);
	}
	const digest = computeHash(algorithm as Algorithm, data, !!opts.hex);
	if (globalOpts.json) {
		output(
			{ algorithm, input: data, hex: opts.hex ?? false, digest },
			globalOpts,
		);
	} else {
		output(digest, globalOpts);
	}
}

export { computeHash };

export function registerHash(program: Command) {
	program
		.command("hash")
		.description(
			"Hash data with sha256, sha512, sha512half, or ripemd160. Offline",
		)
		.argument("<algorithm>", `Hash algorithm: ${ALGORITHMS.join(", ")}`)
		.argument("<data>", "Data to hash (UTF-8 string, or hex with --hex)")
		.option("--hex", "Treat input as hex-encoded bytes instead of UTF-8")
		.action((algorithm: string, data: string, opts: { hex?: boolean }) =>
			hashCommand(algorithm, data, opts, program.opts() as GlobalOptions),
		);
}

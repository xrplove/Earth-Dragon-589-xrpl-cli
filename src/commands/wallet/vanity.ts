import { type Command, Option } from "commander";
import { Wallet } from "xrpl";
import { info, output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";
import { formatWallet, parseAlgorithm } from "./shared.js";

function toRegex(pattern: string, template: string, label: string): RegExp {
	try {
		return new RegExp(template.replace("{}", pattern), "i");
	} catch {
		throw new Error(`Invalid regex in ${label}: ${pattern}`);
	}
}

function buildMatcher(
	startsWith?: string,
	endsWith?: string,
): (address: string) => boolean {
	const startsRe = startsWith
		? toRegex(startsWith, "^r{}", "--starts-with")
		: null;
	const endsRe = endsWith ? toRegex(endsWith, "{}$", "--ends-with") : null;

	return (address: string) => {
		if (startsRe && !startsRe.test(address)) return false;
		if (endsRe && !endsRe.test(address)) return false;
		return true;
	};
}

async function vanityWallet(
	opts: { algorithm: string; startsWith?: string; endsWith?: string },
	globalOpts: GlobalOptions,
) {
	if (!opts.startsWith && !opts.endsWith) {
		throw new Error("At least one of --starts-with or --ends-with is required");
	}

	const matches = buildMatcher(opts.startsWith, opts.endsWith);
	const algorithm = parseAlgorithm(opts.algorithm);

	info(
		"WARNING: Vanity addresses should NOT be used for mainnet accounts holding real value.\n",
		globalOpts,
	);
	info("Searching for matching address...", globalOpts);

	let attempts = 0;
	let wallet: Wallet;

	do {
		wallet = Wallet.generate(algorithm);
		attempts++;
		if (attempts % 10000 === 0) {
			info(`  ${attempts.toLocaleString()} attempts...`, globalOpts);
		}
	} while (!matches(wallet.address));

	info(`Found after ${attempts.toLocaleString()} attempts.\n`, globalOpts);
	output(formatWallet(wallet), globalOpts);
}

export function registerVanity(wallet: Command, program: Command) {
	wallet
		.command("vanity")
		.description(
			"Generate a vanity address matching a pattern (NOT safe for mainnet use)",
		)
		.option(
			"--starts-with <pattern>",
			"Prefix pattern to match after the leading 'r' (case-insensitive regex)",
		)
		.option(
			"--ends-with <pattern>",
			"Suffix pattern to match (case-insensitive regex)",
		)
		.addOption(
			new Option("--algorithm <algorithm>", "Key algorithm")
				.choices(["ed25519", "secp256k1"])
				.default("ed25519"),
		)
		.action(
			(opts: { algorithm: string; startsWith?: string; endsWith?: string }) =>
				vanityWallet(opts, program.opts() as GlobalOptions),
		);
}

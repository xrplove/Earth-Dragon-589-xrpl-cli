import type { GlobalOptions } from "./types.js";
import { EXIT_CODES } from "./types.js";

export function output(data: unknown, opts: GlobalOptions): void {
	if (opts.json) {
		console.log(JSON.stringify(data, null, 2));
	} else if (typeof data === "string") {
		console.log(data);
	} else {
		console.log(JSON.stringify(data, null, 2));
	}
}

export function info(message: string, opts: GlobalOptions): void {
	if (!opts.quiet) {
		console.error(message);
	}
}

export function fail(
	message: string,
	code: number = EXIT_CODES.GENERAL_ERROR,
): never {
	console.error(`Error: ${message}`);
	process.exit(code);
}

import { ledgerIndex } from "./schemas.js";

export function parseLedgerIndex(value?: string): string | number | undefined {
	if (value === undefined) return undefined;
	return ledgerIndex.parse(value);
}

/**
 * Parse an array of raw CLI args (["--Key", "value", ...]) into a
 * Record<string, unknown>. Values starting with `{` or `[` are parsed
 * as JSON; `"true"` / `"false"` become booleans; everything else stays
 * a string.
 */
export function parseFields(rawArgs: string[]): Record<string, unknown> {
	const fields: Record<string, unknown> = {};
	for (let i = 0; i < rawArgs.length; i++) {
		const arg = rawArgs[i];
		if (!arg.startsWith("--")) continue;

		const key = arg.slice(2);
		const value = rawArgs[i + 1];

		if (value === undefined || value.startsWith("--")) {
			fields[key] = true;
		} else {
			if (
				value.startsWith("{") ||
				value.startsWith("[") ||
				value === "true" ||
				value === "false"
			) {
				try {
					fields[key] = JSON.parse(value);
				} catch {
					fields[key] = value;
				}
			} else {
				fields[key] = value;
			}
			i++;
		}
	}
	return fields;
}

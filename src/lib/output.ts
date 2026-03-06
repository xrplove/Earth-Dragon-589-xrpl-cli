import * as tty from "node:tty";
import type { GlobalOptions } from "./types.js";

const isTTY = tty.isatty(1);

const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";

export function highlightJson(json: string): string {
	if (!isTTY) return json;
	return json.replace(
		/("(?:\\.|[^"\\])*")\s*(:)?|(\b(?:true|false)\b)|(\bnull\b)|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g,
		(
			match,
			str: string,
			colon: string,
			bool: string,
			nil: string,
			num: string,
		) => {
			if (str && colon) return `${CYAN}${str}${RESET}${colon}`;
			if (str) return `${GREEN}${str}${RESET}`;
			if (bool) return `${YELLOW}${bool}${RESET}`;
			if (nil) return `${MAGENTA}${nil}${RESET}`;
			if (num) return `${YELLOW}${num}${RESET}`;
			return match;
		},
	);
}

export function output(data: unknown, opts: GlobalOptions): void {
	const json = typeof data === "string" ? data : JSON.stringify(data, null, 2);
	if (opts.json || typeof data === "string") {
		console.log(json);
	} else {
		console.log(highlightJson(json));
	}
}

export function info(message: string, opts: GlobalOptions): void {
	if (!opts.quiet) {
		console.error(message);
	}
}

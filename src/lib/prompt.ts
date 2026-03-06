import { createInterface } from "node:readline";

export function prompt(question: string, hidden = false): Promise<string> {
	return new Promise((resolve) => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stderr,
		});

		if (hidden) {
			// Mute output to hide password
			const origWrite = process.stderr.write.bind(process.stderr);
			process.stderr.write = ((
				chunk: string | Uint8Array,
				...args: unknown[]
			) => {
				if (typeof chunk === "string" && chunk.includes(question)) {
					return origWrite(chunk, ...(args as []));
				}
				// Suppress echoed characters
				return true;
			}) as typeof process.stderr.write;

			rl.question(question, (answer) => {
				process.stderr.write = origWrite;
				process.stderr.write("\n");
				rl.close();
				resolve(answer);
			});
		} else {
			rl.question(question, (answer) => {
				rl.close();
				resolve(answer);
			});
		}
	});
}

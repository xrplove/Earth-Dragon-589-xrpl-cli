import { createInterface } from "node:readline";

export function prompt(question: string, hidden = false): Promise<string> {
	return new Promise((resolve) => {
		if (hidden) {
			// Write prompt once, then suppress all output from readline
			process.stderr.write(question);
			const rl = createInterface({
				input: process.stdin,
				output: process.stderr,
			});
			const origWrite = process.stderr.write.bind(process.stderr);
			process.stderr.write = (() => true) as typeof process.stderr.write;

			rl.question("", (answer) => {
				process.stderr.write = origWrite;
				process.stderr.write("\n");
				rl.close();
				resolve(answer);
			});
		} else {
			const rl = createInterface({
				input: process.stdin,
				output: process.stderr,
			});
			rl.question(question, (answer) => {
				rl.close();
				resolve(answer);
			});
		}
	});
}

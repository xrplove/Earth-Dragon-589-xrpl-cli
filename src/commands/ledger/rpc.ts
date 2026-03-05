import type { Command } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

async function sendRpc(
	method: string,
	params: string,
	globalOpts: GlobalOptions,
) {
	const parsed = JSON.parse(params);
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: method,
			...parsed,
		} as never);
		output(resp.result, globalOpts);
	});
}

export function registerRpcCommand(program: Command) {
	program
		.command("rpc")
		.description("Send a raw WebSocket API request")
		.argument("<method>", "API method name")
		.argument("[params]", "JSON object of method parameters", "{}")
		.action((method: string, params: string) =>
			sendRpc(method, params, program.opts() as GlobalOptions),
		);
}

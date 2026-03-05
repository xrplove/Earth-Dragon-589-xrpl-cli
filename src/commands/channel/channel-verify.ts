import type { Command } from "commander";
import { xrpToDrops } from "xrpl";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

interface ChannelVerifyOpts {
	amount: string;
	publicKey: string;
	signature: string;
}

async function channelVerify(
	channelId: string,
	opts: ChannelVerifyOpts,
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		const resp = await client.request({
			command: "channel_verify",
			channel_id: channelId,
			amount: xrpToDrops(opts.amount),
			public_key: opts.publicKey,
			signature: opts.signature,
		});
		output(resp.result, globalOpts);
	});
}

export function registerChannelVerify(program: Command) {
	program
		.command("channel-verify")
		.description("Verify a payment channel claim signature")
		.argument("<channel-id>", "Channel ID (64-char hex)")
		.requiredOption("--amount <xrp>", "Amount of XRP the signature authorizes")
		.requiredOption("--public-key <hex>", "Public key of the signer")
		.requiredOption("--signature <hex>", "Signature to verify")
		.action((channelId: string, opts: ChannelVerifyOpts) =>
			channelVerify(channelId, opts, program.opts() as GlobalOptions),
		);
}

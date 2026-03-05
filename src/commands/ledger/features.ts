import { type Command, Option } from "commander";
import { withClient } from "../../lib/client.js";
import { output } from "../../lib/output.js";
import type { GlobalOptions } from "../../lib/types.js";

type FeatureInfo = { enabled: boolean; name: string; supported: boolean };

async function fetchFeatures(
	amendment: string | undefined,
	opts: { enabled: boolean; pending: boolean },
	globalOpts: GlobalOptions,
) {
	await withClient(globalOpts, async (client) => {
		let features: Record<string, FeatureInfo>;

		if (amendment) {
			const resp = await client.request({
				command: "feature",
				feature: amendment,
			});
			features = resp.result as unknown as Record<string, FeatureInfo>;
		} else {
			const resp = await client.request({ command: "feature" });
			features = (
				resp.result as { features: Record<string, FeatureInfo> }
			).features;
		}

		if (opts.enabled) {
			features = Object.fromEntries(
				Object.entries(features).filter(([, v]) => v.enabled === true),
			);
		} else if (opts.pending) {
			features = Object.fromEntries(
				Object.entries(features).filter(
					([, v]) => v.enabled === false && v.supported === true,
				),
			);
		}

		output(features, globalOpts);
	});
}

export function registerFeatureCommand(program: Command) {
	program
		.command("feature")
		.alias("amendments")
		.description("List protocol amendments/features and their status")
		.argument("[amendment]", "Amendment name or hex ID to look up")
		.addOption(
			new Option("--enabled", "Show only enabled features").conflicts(
				"pending",
			),
		)
		.addOption(
			new Option("--pending", "Show only pending features").conflicts(
				"enabled",
			),
		)
		.action(
			(
				amendment: string | undefined,
				opts: { enabled: boolean; pending: boolean },
			) => fetchFeatures(amendment, opts, program.opts() as GlobalOptions),
		);
}

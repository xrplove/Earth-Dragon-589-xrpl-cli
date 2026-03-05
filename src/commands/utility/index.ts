import type { Command } from "commander";
import { registerAddressInfo } from "./address-info.js";
import { registerCompletions } from "./completions.js";
import { registerDecodeTx } from "./decode-tx.js";
import { registerDropsToXrp } from "./drops-to-xrp.js";
import { registerFromHex } from "./from-hex.js";
import { registerRippleTime } from "./ripple-time.js";
import { registerToHex } from "./to-hex.js";
import { registerXrpToDrops } from "./xrp-to-drops.js";

export function registerUtilityCommands(program: Command) {
	registerXrpToDrops(program);
	registerDropsToXrp(program);
	registerRippleTime(program);
	registerAddressInfo(program);
	registerToHex(program);
	registerFromHex(program);
	registerDecodeTx(program);
	registerCompletions(program);
}

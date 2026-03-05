import type { Currency } from "xrpl";
import { parseToken } from "./tokens.js";

/** Convert a CLI token spec (XRP, USD.rAddr, mpt:...) to a Currency object for AMM fields. */
export function toCurrency(spec: string): Currency {
	const token = parseToken(spec);
	if (token.type === "xrp") return { currency: "XRP" };
	if (token.type === "iou")
		return { currency: token.currency, issuer: token.issuer };
	return { mpt_issuance_id: token.mpt_issuance_id };
}

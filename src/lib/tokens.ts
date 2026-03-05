import { xrpToDrops, type IssuedCurrencyAmount, type MPTAmount } from "xrpl";
import { currency, tokenSpec } from "./schemas.js";

export interface XrpAmount {
	type: "xrp";
}

export interface IouAmount {
	type: "iou";
	currency: string;
	issuer: string;
}

export interface MptAmount {
	type: "mpt";
	mpt_issuance_id: string;
}

export type ParsedToken = XrpAmount | IouAmount | MptAmount;

const MPT_RE = /^mpt:([0-9A-Fa-f]{48})$/;
const IOU_RE = /^(.+)\.([r][1-9A-HJ-NP-Za-km-z]{24,34})$/;
const STANDARD_RE = /^[A-Za-z0-9?!@#$%^&*<>(){}[\]|]{3}$/;
const HEX40_RE = /^[0-9A-Fa-f]{40}$/;

/**
 * Normalize a currency code for XRPL:
 * - 3-char standard codes → pass through as-is
 * - 40-char hex codes → pass through as-is
 * - Non-standard ASCII (e.g. "NONST") → convert to 40-char hex (right-padded with zeros)
 */
function normalizeCurrency(code: string): string {
	if (STANDARD_RE.test(code) || HEX40_RE.test(code)) return code;
	return Buffer.from(code, "ascii").toString("hex").toUpperCase().padEnd(40, "0");
}

export function parseToken(token: string): ParsedToken {
	tokenSpec.parse(token);

	if (token.toUpperCase() === "XRP") {
		return { type: "xrp" };
	}

	const mptMatch = MPT_RE.exec(token);
	if (mptMatch) {
		return { type: "mpt", mpt_issuance_id: mptMatch[1] };
	}

	const iouMatch = IOU_RE.exec(token);
	if (iouMatch) {
		const curr = iouMatch[1];
		const issuer = iouMatch[2];
		currency.parse(curr);
		return { type: "iou", currency: normalizeCurrency(curr), issuer };
	}

	throw new Error(
		`Invalid token notation "${token}". Expected: XRP, <currency>.<issuer>, or mpt:<issuance-id>`,
	);
}

export type XrplAmount = string | IssuedCurrencyAmount | MPTAmount;

export function toXrplAmount(token: ParsedToken, value: string): XrplAmount {
	switch (token.type) {
		case "xrp":
			return xrpToDrops(value);
		case "iou":
			return { currency: token.currency, issuer: token.issuer, value };
		case "mpt":
			return { mpt_issuance_id: token.mpt_issuance_id, value };
	}
}

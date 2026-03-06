import {
	hexString,
	intRange,
	mptIssuanceId,
	positiveInt,
	txHash,
	xrpAmount,
} from "./schemas.js";

function label(name: string, value: unknown): string {
	return `Invalid ${name}: "${value}".`;
}

function validateHex(value: string, length: number, name = "hex"): void {
	const r = hexString(length).safeParse(value);
	if (!r.success)
		throw new Error(`${label(name, value)} ${r.error.issues[0].message}`);
}

export function validateHex64(value: string, name = "ID"): void {
	validateHex(value, 64, name);
}

export function validateMptId(value: string, name = "MPT issuance ID"): void {
	const r = mptIssuanceId.safeParse(value);
	if (!r.success)
		throw new Error(`${label(name, value)} ${r.error.issues[0].message}`);
}

export function validateTxHash(value: string, name = "transaction hash"): void {
	const r = txHash.safeParse(value);
	if (!r.success)
		throw new Error(`${label(name, value)} ${r.error.issues[0].message}`);
}

export function validateXrpAmount(value: string, name = "XRP amount"): void {
	const r = xrpAmount.safeParse(value);
	if (!r.success)
		throw new Error(`${label(name, value)} ${r.error.issues[0].message}`);
}

export function validatePositiveInt(value: number, name = "value"): void {
	const r = positiveInt.safeParse(value);
	if (!r.success)
		throw new Error(`${label(name, value)} ${r.error.issues[0].message}`);
}

export function validateRange(
	value: number,
	min: number,
	max: number,
	name = "value",
): void {
	const r = intRange(min, max).safeParse(value);
	if (!r.success)
		throw new Error(`${label(name, value)} ${r.error.issues[0].message}`);
}

export function validateOptionalHex(
	value: string | undefined,
	name = "hex",
): void {
	if (value != null) {
		const r = hexString().safeParse(value);
		if (!r.success)
			throw new Error(`${label(name, value)} ${r.error.issues[0].message}`);
	}
}

export function validateOptionalRange(
	value: number | undefined,
	min: number,
	max: number,
	name = "value",
): void {
	if (value != null) validateRange(value, min, max, name);
}

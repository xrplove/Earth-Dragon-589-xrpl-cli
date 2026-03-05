import { z } from "zod";

// ── Primitives ──────────────────────────────────────────────────────────────

export const xrplAddress = z
	.string()
	.regex(
		/^(r[1-9A-HJ-NP-Za-km-z]{24,34}|[XT][1-9A-HJ-NP-Za-km-z]{46})$/,
		"Invalid XRPL address (expected r-address or X-address)",
	);

export const hexString = (length?: number) =>
	length
		? z
				.string()
				.regex(
					new RegExp(`^[0-9A-Fa-f]{${length}}$`),
					`Must be exactly ${length} hex characters`,
				)
		: z.string().regex(/^[0-9A-Fa-f]+$/, "Must be a hex string");

export const positiveInt = z
	.number()
	.int()
	.min(1, "Must be a positive integer");

export const nonNegativeInt = z
	.number()
	.int()
	.min(0, "Must be a non-negative integer");

export const intRange = (min: number, max: number) =>
	z
		.number()
		.int()
		.min(min, `Must be at least ${min}`)
		.max(max, `Must be at most ${max}`);

export const xrpAmount = z
	.string()
	.regex(/^\d+(\.\d{1,6})?$/, "Invalid XRP amount (max 6 decimal places)");

// ── XRPL domain types ──────────────────────────────────────────────────────

export const standardCurrency = z
	.string()
	.regex(
		/^[A-Za-z0-9?!@#$%^&*<>(){}[\]|]{3}$/,
		"Standard currency must be exactly 3 characters",
	);

export const hexCurrency = hexString(40);

export const currency = z
	.string()
	.refine(
		(v) =>
			standardCurrency.safeParse(v).success || hexCurrency.safeParse(v).success,
		"Currency must be 3 standard characters or 40 hex characters",
	);

export const mptIssuanceId = hexString(48);

export const ledgerIndex = z.string().transform((v) => {
	if (["validated", "closed", "current"].includes(v)) return v;
	const num = Number(v);
	if (Number.isInteger(num) && num >= 0) return num;
	return v;
});

export const algorithm = z.enum(["ed25519", "secp256k1"], {
	message: "Algorithm must be ed25519 or secp256k1",
});

export const txHash = hexString(64);

export const signerEntry = z.string().transform((entry, ctx) => {
	const colonIdx = entry.lastIndexOf(":");
	if (colonIdx === -1) {
		ctx.addIssue({
			code: "custom",
			message: `Invalid signer format: "${entry}". Expected <address>:<weight>.`,
		});
		return z.NEVER;
	}
	const address = entry.slice(0, colonIdx);
	const weightStr = entry.slice(colonIdx + 1);
	const weight = Number(weightStr);
	if (!Number.isInteger(weight) || weight < 1) {
		ctx.addIssue({
			code: "custom",
			message: `Invalid signer weight: "${weightStr}". Must be a positive integer.`,
		});
		return z.NEVER;
	}
	return { SignerEntry: { Account: address, SignerWeight: weight } };
});

export const memo = z
	.string()
	.regex(
		/^(hex:)?[^:]+(hex:)?.+$/s,
		'Invalid memo format. Expected "type:data" (e.g. "type:interchain_transfer").',
	);

export const tokenSpec = z
	.string()
	.refine(
		(v) =>
			v.toUpperCase() === "XRP" ||
			/^mpt:[0-9A-Fa-f]{48}$/.test(v) ||
			/^.+\.[r][1-9A-HJ-NP-Za-km-z]{24,34}$/.test(v),
		"Invalid token. Expected: XRP, <currency>.<issuer>, or mpt:<issuance-id>",
	);

export const entropy = hexString(32);

import { describe, expect, it } from "vitest";
import {
	classicAddressToXAddress,
	decodeAccountID,
	dropsToXrp,
	isoTimeToRippleTime,
	isValidClassicAddress,
	isValidXAddress,
	rippleTimeToISOTime,
	Wallet,
	xAddressToClassicAddress,
	xrpToDrops,
} from "xrpl";

describe("xrp-to-drops / drops-to-xrp", () => {
	it("converts XRP to drops", () => {
		expect(xrpToDrops("1")).toBe("1000000");
		expect(xrpToDrops("1.5")).toBe("1500000");
		expect(xrpToDrops("0.000001")).toBe("1");
	});

	it("converts drops to XRP", () => {
		expect(String(dropsToXrp("1000000"))).toBe("1");
		expect(String(dropsToXrp("1500000"))).toBe("1.5");
		expect(String(dropsToXrp("1"))).toBe("0.000001");
	});
});

describe("ripple-time", () => {
	it("converts ripple epoch 0 to ISO", () => {
		expect(rippleTimeToISOTime(0)).toBe("2000-01-01T00:00:00.000Z");
	});

	it("converts ISO to ripple epoch", () => {
		expect(isoTimeToRippleTime("2000-01-01T00:00:00Z")).toBe(0);
	});

	it("round-trips correctly", () => {
		const rippleTime = 784111330;
		const iso = rippleTimeToISOTime(rippleTime);
		expect(isoTimeToRippleTime(iso)).toBe(rippleTime);
	});
});

describe("address-info", () => {
	const wallet = Wallet.generate();

	it("validates a classic address", () => {
		expect(isValidClassicAddress(wallet.address)).toBe(true);
		expect(isValidXAddress(wallet.address)).toBe(false);
	});

	it("decodes classic address to account ID", () => {
		const accountId = Buffer.from(decodeAccountID(wallet.address))
			.toString("hex")
			.toUpperCase();
		expect(accountId).toHaveLength(40);
		expect(/^[0-9A-F]{40}$/.test(accountId)).toBe(true);
	});

	it("validates X-addresses", () => {
		const xAddr = classicAddressToXAddress(wallet.address, 12345, false);
		expect(isValidXAddress(xAddr)).toBe(true);
		const decoded = xAddressToClassicAddress(xAddr);
		expect(decoded.classicAddress).toBe(wallet.address);
		expect(decoded.tag).toBe(12345);
		expect(decoded.test).toBe(false);
	});

	it("handles X-address without tag", () => {
		const xAddr = classicAddressToXAddress(wallet.address, false, false);
		const decoded = xAddressToClassicAddress(xAddr);
		expect(decoded.classicAddress).toBe(wallet.address);
		expect(decoded.tag).toBe(false);
	});

	it("identifies testnet X-addresses", () => {
		const xAddr = classicAddressToXAddress(wallet.address, false, true);
		const decoded = xAddressToClassicAddress(xAddr);
		expect(decoded.test).toBe(true);
	});
});

describe("to-hex / from-hex", () => {
	it("encodes UTF-8 to hex", () => {
		const hex = Buffer.from("interchain_transfer", "utf-8")
			.toString("hex")
			.toUpperCase();
		expect(hex).toBe("696E746572636861696E5F7472616E73666572");
	});

	it("decodes hex to UTF-8", () => {
		const str = Buffer.from(
			"696E746572636861696E5F7472616E73666572",
			"hex",
		).toString("utf-8");
		expect(str).toBe("interchain_transfer");
	});

	it("handles 0x prefix", () => {
		const hex = "0x48656C6C6F";
		const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
		const str = Buffer.from(cleaned, "hex").toString("utf-8");
		expect(str).toBe("Hello");
	});
});

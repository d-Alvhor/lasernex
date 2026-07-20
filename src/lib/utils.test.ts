import { missingShippingSelection } from "@/lib/utils";
import { describe, expect, it } from "vitest";

describe("missingShippingSelection", () => {
	it("bloquea el pago si hay productos físicos y no se ha elegido método de envío", () => {
		expect(missingShippingSelection({ allProductsDigital: false, shippingRateId: null })).toBe(true);
	});

	it("no bloquea el pago si ya hay un shippingRateId guardado", () => {
		expect(missingShippingSelection({ allProductsDigital: false, shippingRateId: "shr_123" })).toBe(false);
	});

	it("no bloquea el pago si todos los productos son digitales (sin envío)", () => {
		expect(missingShippingSelection({ allProductsDigital: true, shippingRateId: null })).toBe(false);
	});
});

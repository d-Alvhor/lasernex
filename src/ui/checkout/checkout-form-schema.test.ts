import { getAddressSchema } from "@/ui/checkout/checkout-form-schema";
import { describe, expect, it } from "vitest";

const tr = {
	nameRequired: "nombre requerido",
	cityRequired: "ciudad requerida",
	countryRequired: "país requerido",
	line1Required: "dirección requerida",
	postalCodeRequired: "código postal requerido",
	onlyPeninsularSpain: "solo España peninsular",
};

const baseAddress = {
	name: "Ana",
	city: "Madrid",
	country: "ES",
	line1: "Calle Falsa 123",
	postalCode: "28001",
};

describe("getAddressSchema — envío solo a España peninsular", () => {
	const schema = getAddressSchema(tr);

	it("acepta un código postal peninsular normal", () => {
		expect(schema.safeParse(baseAddress).success).toBe(true);
	});

	it.each([
		["Baleares", "07001"],
		["Canarias (Las Palmas)", "35001"],
		["Canarias (Tenerife)", "38001"],
		["Ceuta", "51001"],
		["Melilla", "52001"],
	])("rechaza un código postal de %s", (_zona, postalCode) => {
		const result = schema.safeParse({ ...baseAddress, postalCode });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.postalCode).toContain(tr.onlyPeninsularSpain);
		}
	});

	it("rechaza cualquier país que no sea ES", () => {
		const result = schema.safeParse({ ...baseAddress, country: "FR" });
		expect(result.success).toBe(false);
	});

	it("rechaza un código postal con formato inválido", () => {
		const result = schema.safeParse({ ...baseAddress, postalCode: "ABCDE" });
		expect(result.success).toBe(false);
	});
});

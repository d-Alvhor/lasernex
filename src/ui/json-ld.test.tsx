import { describe, expect, it, vi } from "vitest";

vi.mock("@/env.mjs", () => ({
	publicUrl: "https://lasernex.es",
}));

const { mappedProductToJsonLd } = await import("@/ui/json-ld");

function buildProduct(overrides: Partial<{ unit_amount: number | null; images: string[] }> = {}) {
	return {
		id: "prod_1",
		name: "Llavero gato",
		description: "Un llavero",
		images: overrides.images ?? ["https://files.stripe.com/foo.jpg"],
		metadata: { slug: "llavero-gato", stock: 5 },
		default_price: {
			unit_amount: "unit_amount" in overrides ? overrides.unit_amount : 1200,
			currency: "eur",
		},
	} as never;
}

describe("mappedProductToJsonLd — precio", () => {
	it("con precio fijo, incluye price y priceCurrency", () => {
		const jsonLd = mappedProductToJsonLd(buildProduct({ unit_amount: 1200 }));
		expect(jsonLd.offers).toMatchObject({ price: 12, priceCurrency: "eur" });
	});

	it("con precio de importe personalizado (unit_amount null), NO incluye price ni priceCurrency", () => {
		const jsonLd = mappedProductToJsonLd(buildProduct({ unit_amount: null }));
		expect(jsonLd.offers).not.toHaveProperty("price");
		expect(jsonLd.offers).not.toHaveProperty("priceCurrency");
	});
});

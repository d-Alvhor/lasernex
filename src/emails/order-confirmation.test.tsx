import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

const baseProps = {
	orderNumber: "PED-1024",
	customerName: "Ana",
	lines: [{ name: "Pieza demo", quantity: 2, unitAmountFormatted: "12,00 €" }],
	totalFormatted: "24,00 €",
	shippingAddress: {
		line1: "Calle Mayor 1",
		line2: null,
		city: "Madrid",
		postalCode: "28001",
		country: "ES",
	},
	storeUrl: "https://ejemplo.es",
};

describe("OrderConfirmationEmail", () => {
	it("incluye la marca, el número de pedido y el resumen", async () => {
		const html = await render(OrderConfirmationEmail(baseProps));

		expect(html).toContain("LASERNEX");
		expect(html).toContain("PED-1024");
		expect(html).toContain("Pieza demo");
		expect(html).toContain("24,00 €");
		// Sin personalización: texto estándar de desistimiento, sin rastro del campo.
		expect(html).toContain("14 días naturales");
		expect(html).not.toContain("Personalización");
	});

	it("muestra la personalización y la excepción de desistimiento cuando aplica", async () => {
		const html = await render(
			OrderConfirmationEmail({
				...baseProps,
				lines: [
					{
						name: "Llavero grabado",
						quantity: 1,
						unitAmountFormatted: "9,00 €",
						personalization: "Carla",
					},
				],
				hasPersonalization: true,
			}),
		);

		// React separa texto estático e interpolación con un comentario HTML.
		expect(html).toMatch(/Personalización:.*Carla/);
		expect(html).toContain("no admiten desistimiento");
		expect(html).toContain("art. 103.c");
	});
});

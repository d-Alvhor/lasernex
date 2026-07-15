import { OrderNotificationInternalEmail } from "@/emails/order-notification-internal";
import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

const baseProps = {
	orderNumber: "pi_1024",
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
	shipToken: "token-de-ejemplo",
};

describe("OrderNotificationInternalEmail", () => {
	it("incluye el número de pedido y el enlace de envío con el token", async () => {
		const html = await render(OrderNotificationInternalEmail(baseProps));

		expect(html).toContain("pi_1024");
		expect(html).toContain("https://ejemplo.es/api/orders/pi_1024/ship?token=token-de-ejemplo");
		// Sin personalización no aparece el campo (y no rompe el render).
		expect(html).not.toContain("Personalización");
	});

	it("destaca la personalización cuando la línea la trae", async () => {
		const html = await render(
			OrderNotificationInternalEmail({
				...baseProps,
				lines: [
					{
						name: "Llavero grabado",
						quantity: 1,
						unitAmountFormatted: "9,00 €",
						personalization: "Carla",
					},
				],
			}),
		);

		// React separa texto estático e interpolación con un comentario HTML.
		expect(html).toMatch(/Personalización:.*Carla/);
	});
});

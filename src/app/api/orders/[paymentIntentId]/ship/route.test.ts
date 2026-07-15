import { sendOrderShippedEmail } from "@/lib/email/resend";
import * as Commerce from "commerce-kit";
import { describe, expect, it, vi } from "vitest";

// Mocks a nivel de módulo — llamamos directamente al GET real de la ruta,
// sin red, sin reescribir su lógica.
vi.mock("@/env.mjs", () => ({
	env: { SHIP_NOTIFICATION_SECRET: "ship-secret" },
}));

vi.mock("@/lib/email/resend", () => ({
	sendOrderShippedEmail: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
	rateLimit: vi.fn(() => true),
}));

// commerce-kit importa "next/cache" de una forma que el resolvedor ESM de
// Vitest no soporta fuera del build de Next: mock manual (mismo motivo que
// en los tests del webhook).
vi.mock("commerce-kit", () => ({
	orderGet: vi.fn(),
}));

const { GET } = await import("./route");

function buildOrder({ paymentIntentId = "pi_123", email = "cliente@example.com" } = {}) {
	return {
		order: {
			id: paymentIntentId,
			currency: "eur",
			shipping: null,
			metadata: {},
			latest_charge: email ? { billing_details: { email, name: "Ana" } } : null,
		},
		lines: [
			{
				product: { id: "prod_1", name: "Pieza demo", default_price: { unit_amount: 1200 } },
				quantity: 1,
			},
		],
	} as never;
}

function buildRequest(paymentIntentId: string, extraParams = "") {
	return new Request(
		`https://lasernex.es/api/orders/${paymentIntentId}/ship?token=ship-secret${extraParams}`,
	);
}

function params(paymentIntentId: string) {
	return { params: Promise.resolve({ paymentIntentId }) };
}

describe("GET /api/orders/[paymentIntentId]/ship", () => {
	it.each([
		["skipped", { skipped: true as const }],
		["failed", { failed: true as const }],
	])(
		"si sendOrderShippedEmail devuelve { %s: true }, la respuesta es 502 y no contiene el ✅ de éxito",
		async (_case, mockResult) => {
			vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder());
			vi.mocked(sendOrderShippedEmail).mockResolvedValue(mockResult);

			const res = await GET(buildRequest("pi_123"), params("pi_123"));
			const html = await res.text();

			expect(res.status).toBe(502);
			expect(html).not.toContain("✅");
		},
	);

	it("en éxito, la respuesta es 200", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_ok" }));
		vi.mocked(sendOrderShippedEmail).mockResolvedValue({ id: "email_1" } as never);

		const res = await GET(buildRequest("pi_ok"), params("pi_ok"));

		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("✅");
	});

	it("el paymentIntentId se refleja escapado en el HTML (nunca crudo) cuando no se encuentra el pedido", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(null);
		const dangerousId = `pi_<script>alert(1)</script>`;

		const res = await GET(buildRequest(encodeURIComponent(dangerousId)), params(dangerousId));
		const html = await res.text();

		expect(res.status).toBe(404);
		expect(html).not.toContain("<script>alert(1)</script>");
		expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
	});
});

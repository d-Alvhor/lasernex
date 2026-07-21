import { sendOrderShippedEmail } from "@/lib/email/resend";
import * as Commerce from "commerce-kit";
import { describe, expect, it, vi } from "vitest";

// Mocks a nivel de módulo — llamamos directamente al GET/POST reales de la
// ruta, sin red, sin reescribir su lógica.
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

const { GET, POST } = await import("./route");

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

function buildGetRequest(paymentIntentId: string, extraParams = "") {
	return new Request(
		`https://lasernex.es/api/orders/${paymentIntentId}/ship?token=ship-secret${extraParams}`,
	);
}

function buildPostRequest(paymentIntentId: string, extraFields: Record<string, string> = {}) {
	const body = new URLSearchParams({ token: "ship-secret", ...extraFields });
	return new Request(`https://lasernex.es/api/orders/${paymentIntentId}/ship`, {
		method: "POST",
		body,
	});
}

function params(paymentIntentId: string) {
	return { params: Promise.resolve({ paymentIntentId }) };
}

describe("GET /api/orders/[paymentIntentId]/ship — página de confirmación, sin efectos", () => {
	it("con token válido y pedido encontrado, muestra la confirmación (formulario POST) y NO envía ningún email", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_confirm" }));

		const res = await GET(buildGetRequest("pi_confirm"), params("pi_confirm"));
		const html = await res.text();

		expect(res.status).toBe(200);
		expect(html).toContain('<form method="POST">');
		expect(html).toContain("Sí, marcar como enviado");
		expect(sendOrderShippedEmail).not.toHaveBeenCalled();
	});

	it("el paymentIntentId se refleja escapado en el HTML (nunca crudo) cuando no se encuentra el pedido", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(null);
		const dangerousId = `pi_<script>alert(1)</script>`;

		const res = await GET(buildGetRequest(encodeURIComponent(dangerousId)), params(dangerousId));
		const html = await res.text();

		expect(res.status).toBe(404);
		expect(html).not.toContain("<script>alert(1)</script>");
		expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
	});

	it("con token inválido, no muestra la confirmación", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_bad" }));

		const res = await GET(
			new Request("https://lasernex.es/api/orders/pi_bad/ship?token=token-incorrecto"),
			params("pi_bad"),
		);

		expect(res.status).toBe(401);
		expect(sendOrderShippedEmail).not.toHaveBeenCalled();
	});

	it("incluye campos de texto EDITABLES (no ocultos) para tracking/trackingUrl, no solo prellenados en la URL", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_fields" }));

		const res = await GET(
			buildGetRequest("pi_fields", "&tracking=ABC123&trackingUrl=https%3A%2F%2Fcorreos.es%2Ft%3Fid%3D1"),
			params("pi_fields"),
		);
		const html = await res.text();

		expect(html).toContain('<input type="text" name="tracking" value="ABC123"');
		expect(html).toContain('<input type="text" name="trackingUrl" value="https://correos.es/t?id=1"');
	});

	it("sin parámetros de tracking en la URL, los campos salen vacíos pero presentes (no truco de campo oculto)", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_nofields" }));

		const res = await GET(buildGetRequest("pi_nofields"), params("pi_nofields"));
		const html = await res.text();

		expect(html).toContain('<input type="text" name="tracking" value=""');
		expect(html).toContain('<input type="text" name="trackingUrl" value=""');
	});
});

describe("POST /api/orders/[paymentIntentId]/ship — envío real, solo tras confirmar", () => {
	it.each([
		["skipped", { skipped: true as const }],
		["failed", { failed: true as const }],
	])(
		"si sendOrderShippedEmail devuelve { %s: true }, la respuesta es 502 y no contiene el ✅ de éxito",
		async (_case, mockResult) => {
			vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder());
			vi.mocked(sendOrderShippedEmail).mockResolvedValue(mockResult);

			const res = await POST(buildPostRequest("pi_123"), params("pi_123"));
			const html = await res.text();

			expect(res.status).toBe(502);
			expect(html).not.toContain("✅");
		},
	);

	it("en éxito, la respuesta es 200 y llama a sendOrderShippedEmail", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_ok" }));
		vi.mocked(sendOrderShippedEmail).mockResolvedValue({ id: "email_1" } as never);

		const res = await POST(buildPostRequest("pi_ok"), params("pi_ok"));

		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("✅");
		expect(sendOrderShippedEmail).toHaveBeenCalled();
	});

	it("con token inválido, no envía el email", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_bad" }));

		const res = await POST(buildPostRequest("pi_bad", { token: "token-incorrecto" }), params("pi_bad"));

		expect(res.status).toBe(401);
		expect(sendOrderShippedEmail).not.toHaveBeenCalled();
	});

	it("el paymentIntentId se refleja escapado en el HTML cuando no se encuentra el pedido", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(null);
		const dangerousId = `pi_<script>alert(1)</script>`;

		const res = await POST(buildPostRequest(encodeURIComponent(dangerousId)), params(dangerousId));
		const html = await res.text();

		expect(res.status).toBe(404);
		expect(html).not.toContain("<script>alert(1)</script>");
		expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
	});

	it("con los campos de tracking vacíos (formulario sin rellenar), no rechaza la petición", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_empty_tracking" }));
		vi.mocked(sendOrderShippedEmail).mockResolvedValue({ id: "email_1" } as never);

		const res = await POST(
			buildPostRequest("pi_empty_tracking", { tracking: "", trackingUrl: "" }),
			params("pi_empty_tracking"),
		);

		expect(res.status).toBe(200);
		expect(sendOrderShippedEmail).toHaveBeenCalledWith(
			"cliente@example.com",
			expect.objectContaining({ trackingNumber: null, trackingUrl: null }),
		);
	});

	it("una URL de seguimiento con su propio '&' llega completa (campo de formulario, no query string cortada)", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_amp" }));
		vi.mocked(sendOrderShippedEmail).mockResolvedValue({ id: "email_1" } as never);
		const trackingUrlConAmpersand =
			"https://www.correos.es/es/es/herramientas/localizador?tracking-number=123&lang=es";

		const res = await POST(
			buildPostRequest("pi_amp", { trackingUrl: trackingUrlConAmpersand }),
			params("pi_amp"),
		);

		expect(res.status).toBe(200);
		expect(sendOrderShippedEmail).toHaveBeenCalledWith(
			"cliente@example.com",
			expect.objectContaining({ trackingUrl: trackingUrlConAmpersand }),
		);
	});
});

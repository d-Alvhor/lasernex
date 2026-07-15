import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from "@/lib/email/resend";
import * as Commerce from "commerce-kit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocks a nivel de módulo — llamamos directamente al POST real del webhook,
// sin red, sin reescribir su lógica (ver briefing de la tarea).
vi.mock("@/env.mjs", () => ({
	env: {
		STRIPE_WEBHOOK_SECRET: "test-webhook-secret",
		SHIP_NOTIFICATION_SECRET: "ship-secret",
	},
}));

vi.mock("@/lib/email/resend", () => ({
	sendOrderConfirmationEmail: vi.fn().mockResolvedValue({ id: "email_confirmation" }),
	sendOrderNotificationEmail: vi.fn().mockResolvedValue({ id: "email_notification" }),
}));

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
}));

const constructEventAsync = vi.fn();
const productsUpdate = vi.fn();
const paymentIntentsUpdate = vi.fn();
const taxTransactionsCreateFromCalculation = vi.fn();

// No usamos importOriginal: el módulo real de commerce-kit importa "next/cache"
// de una forma que el resolvedor ESM de Vitest no soporta fuera del build de
// Next (falla con ERR_MODULE_NOT_FOUND). route.ts solo usa estos tres exports
// del namespace Commerce, así que el mock manual los cubre por completo.
vi.mock("commerce-kit", () => ({
	getProductsFromMetadata: vi.fn(),
	orderGet: vi.fn(),
	provider: vi.fn(() => ({
		webhooks: { constructEventAsync },
		products: { update: productsUpdate },
		paymentIntents: { update: paymentIntentsUpdate },
		tax: { transactions: { createFromCalculation: taxTransactionsCreateFromCalculation } },
	})),
}));

// Se importa DESPUÉS de declarar los vi.mock (hoisting de vitest los sube igualmente,
// pero mantenemos el import tras los mocks para que quede claro el orden lógico).
const { POST } = await import("./route");

function buildRequest(body: unknown) {
	return new Request("https://lasernex.es/api/stripe-webhook", {
		method: "POST",
		headers: { "Stripe-Signature": "sig_test" },
		body: JSON.stringify(body),
	});
}

// Construye un evento payment_intent.succeeded mínimo con la metadata que
// consume el webhook. `metadata` viaja tal cual a cartMetadataSchema.parse
// (Zod real, sin red) y acepta cualquier clave string adicional.
function buildEvent({
	paymentIntentId = "pi_123",
	metadata = {},
}: {
	paymentIntentId?: string;
	metadata?: Record<string, string>;
}) {
	return {
		type: "payment_intent.succeeded",
		data: {
			object: {
				id: paymentIntentId,
				metadata,
			},
		},
	};
}

function buildProduct({
	id,
	stock,
}: {
	id: string;
	stock: number;
}) {
	return { id, metadata: { stock } } as never;
}

// Pedido mínimo con la forma que espera el bloque de emails del webhook.
function buildOrder({
	paymentIntentId = "pi_123",
	email = "cliente@example.com",
	receiptEmailAlreadySet = false,
}: {
	paymentIntentId?: string;
	email?: string | null;
	receiptEmailAlreadySet?: boolean;
}) {
	return {
		order: {
			id: paymentIntentId,
			currency: "eur",
			amount: 2400,
			receipt_email: receiptEmailAlreadySet ? email : null,
			latest_charge: email ? { billing_details: { email, name: "Ana" } } : null,
			shipping: null,
			metadata: {},
		},
		lines: [
			{
				product: {
					id: "prod_1",
					name: "Pieza demo",
					default_price: { unit_amount: 1200 },
				},
				quantity: 2,
			},
		],
	} as never;
}

describe("POST /api/stripe-webhook — payment_intent.succeeded", () => {
	beforeEach(() => {
		constructEventAsync.mockImplementation(async (_body: string) => JSON.parse(_body));
		vi.mocked(Commerce.orderGet).mockResolvedValue(null);
		vi.mocked(Commerce.getProductsFromMetadata).mockResolvedValue([]);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("descuenta la cantidad (quantity) de cada línea, no siempre 1, y marca stock_processed", async () => {
		vi.mocked(Commerce.getProductsFromMetadata).mockResolvedValue([
			{ product: buildProduct({ id: "prod_a", stock: 10 }), quantity: 3 },
			{ product: buildProduct({ id: "prod_b", stock: 5 }), quantity: 1 },
		]);

		const res = await POST(buildRequest(buildEvent({ paymentIntentId: "pi_qty" })));

		expect(res.status).toBe(200);
		expect(productsUpdate).toHaveBeenCalledWith("prod_a", { metadata: { stock: 7 } });
		expect(productsUpdate).toHaveBeenCalledWith("prod_b", { metadata: { stock: 4 } });
		expect(paymentIntentsUpdate).toHaveBeenCalledWith("pi_qty", { metadata: { stock_processed: "1" } });
	});

	it("NO actualiza el stock de un producto con metadata.stock === Infinity", async () => {
		vi.mocked(Commerce.getProductsFromMetadata).mockResolvedValue([
			{ product: buildProduct({ id: "prod_inf", stock: Number.POSITIVE_INFINITY }), quantity: 2 },
		]);

		await POST(buildRequest(buildEvent({ paymentIntentId: "pi_inf" })));

		expect(productsUpdate).not.toHaveBeenCalled();
		// El resto del flujo (idempotencia) sigue funcionando igual.
		expect(paymentIntentsUpdate).toHaveBeenCalledWith("pi_inf", { metadata: { stock_processed: "1" } });
	});

	it("si stock_processed ya existe, no vuelve a descontar stock ni a llamar paymentIntents.update con stock_processed", async () => {
		// Aislamos de las llamadas de paymentIntents.update de la parte de emails/receipt_email
		// haciendo que orderGet no encuentre pedido.
		vi.mocked(Commerce.orderGet).mockResolvedValue(null);
		vi.mocked(Commerce.getProductsFromMetadata).mockResolvedValue([
			{ product: buildProduct({ id: "prod_a", stock: 10 }), quantity: 3 },
		]);

		await POST(buildRequest(buildEvent({ paymentIntentId: "pi_dup", metadata: { stock_processed: "1" } })));

		expect(productsUpdate).not.toHaveBeenCalled();
		expect(paymentIntentsUpdate).not.toHaveBeenCalled();
	});

	it("llama al email interno (dueña) ANTES que al de confirmación (cliente)", async () => {
		vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_order" }));

		await POST(buildRequest(buildEvent({ paymentIntentId: "pi_order" })));

		expect(sendOrderNotificationEmail).toHaveBeenCalled();
		expect(sendOrderConfirmationEmail).toHaveBeenCalled();
		const notificationOrder = vi.mocked(sendOrderNotificationEmail).mock.invocationCallOrder[0]!;
		const confirmationOrder = vi.mocked(sendOrderConfirmationEmail).mock.invocationCallOrder[0]!;
		expect(notificationOrder).toBeLessThan(confirmationOrder);
	});

	it.each([
		["sendOrderNotificationEmail", sendOrderNotificationEmail, sendOrderConfirmationEmail],
		["sendOrderConfirmationEmail", sendOrderConfirmationEmail, sendOrderNotificationEmail],
	] as const)(
		"un throw en %s no impide que se llame al otro email ni rompe la respuesta del webhook",
		async (_name, throwing, other) => {
			vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_throw" }));
			vi.mocked(throwing).mockRejectedValueOnce(new Error("fallo de envío"));

			const res = await POST(buildRequest(buildEvent({ paymentIntentId: "pi_throw" })));

			expect(res.status).toBe(200);
			await expect(res.json()).resolves.toEqual({ received: true });
			expect(other).toHaveBeenCalled();
		},
	);

	it("no llama a sendOrderNotificationEmail si SHIP_NOTIFICATION_SECRET no está definido, pero sí al de confirmación", async () => {
		const { env } = await import("@/env.mjs");
		// @ts-expect-error -- mock de solo lectura en el módulo real, aquí es plano
		env.SHIP_NOTIFICATION_SECRET = undefined;
		try {
			vi.mocked(Commerce.orderGet).mockResolvedValue(buildOrder({ paymentIntentId: "pi_nosecret" }));

			await POST(buildRequest(buildEvent({ paymentIntentId: "pi_nosecret" })));

			expect(sendOrderNotificationEmail).not.toHaveBeenCalled();
			expect(sendOrderConfirmationEmail).toHaveBeenCalled();
		} finally {
			// @ts-expect-error -- restaurar para no filtrar estado a otros tests
			env.SHIP_NOTIFICATION_SECRET = "ship-secret";
		}
	});
});

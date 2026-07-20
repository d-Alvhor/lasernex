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
const productsList = vi.fn();
const paymentIntentsUpdate = vi.fn();
const paymentIntentsRetrieve = vi.fn();
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
		products: { update: productsUpdate, list: productsList },
		paymentIntents: { update: paymentIntentsUpdate, retrieve: paymentIntentsRetrieve },
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
		// Por defecto, el PaymentIntent "en vivo" (el que se comprueba para la
		// idempotencia) todavía no tiene stock_processed — cada test que quiera
		// simular el caso "ya procesado" lo sobreescribe explícitamente.
		paymentIntentsRetrieve.mockResolvedValue({ metadata: {} });
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

	it("si el PaymentIntent EN VIVO ya tiene stock_processed, no vuelve a descontar stock", async () => {
		// Aislamos de las llamadas de paymentIntents.update de la parte de emails/receipt_email
		// haciendo que orderGet no encuentre pedido.
		vi.mocked(Commerce.orderGet).mockResolvedValue(null);
		vi.mocked(Commerce.getProductsFromMetadata).mockResolvedValue([
			{ product: buildProduct({ id: "prod_a", stock: 10 }), quantity: 3 },
		]);
		paymentIntentsRetrieve.mockResolvedValue({ metadata: { stock_processed: "1" } });

		await POST(buildRequest(buildEvent({ paymentIntentId: "pi_dup" })));

		expect(productsUpdate).not.toHaveBeenCalled();
		expect(paymentIntentsUpdate).not.toHaveBeenCalled();
	});

	it("reenvío del mismo evento (snapshot sin stock_processed) no repite el descuento si el PaymentIntent en vivo ya lo tiene", async () => {
		// Este es exactamente el escenario del bug: event.data.object.metadata es
		// un snapshot SIN stock_processed (como llegaría en un reenvío de Stripe
		// del evento original), pero el PaymentIntent real ya se marcó procesado
		// entre medias. La idempotencia debe mirar el estado en vivo, no el evento.
		vi.mocked(Commerce.orderGet).mockResolvedValue(null);
		vi.mocked(Commerce.getProductsFromMetadata).mockResolvedValue([
			{ product: buildProduct({ id: "prod_a", stock: 10 }), quantity: 3 },
		]);
		paymentIntentsRetrieve.mockResolvedValue({ metadata: { stock_processed: "1" } });

		await POST(buildRequest(buildEvent({ paymentIntentId: "pi_retry", metadata: {} })));

		expect(productsUpdate).not.toHaveBeenCalled();
	});

	it("nunca deja el stock en negativo aunque la cantidad comprada supere el stock leído", async () => {
		vi.mocked(Commerce.getProductsFromMetadata).mockResolvedValue([
			{ product: buildProduct({ id: "prod_over", stock: 1 }), quantity: 3 },
		]);

		await POST(buildRequest(buildEvent({ paymentIntentId: "pi_over" })));

		expect(productsUpdate).toHaveBeenCalledWith("prod_over", { metadata: { stock: 0 } });
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

describe("POST /api/stripe-webhook — charge.refunded", () => {
	beforeEach(() => {
		constructEventAsync.mockImplementation(async (_body: string) => JSON.parse(_body));
		vi.mocked(Commerce.getProductsFromMetadata).mockResolvedValue([
			{ product: buildProduct({ id: "prod_a", stock: 4 }), quantity: 2 },
		]);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	function buildRefundEvent({
		paymentIntentId = "pi_refund",
		refunded = true,
	}: {
		paymentIntentId?: string;
		refunded?: boolean;
	}) {
		return {
			type: "charge.refunded",
			data: {
				object: {
					id: "ch_1",
					refunded,
					payment_intent: paymentIntentId,
				},
			},
		};
	}

	it("reembolso total: devuelve al stock la cantidad de cada línea del pedido original", async () => {
		paymentIntentsRetrieve.mockResolvedValue({ metadata: { stock_processed: "1" } });

		await POST(buildRequest(buildRefundEvent({ paymentIntentId: "pi_refund_ok" })));

		expect(productsUpdate).toHaveBeenCalledWith("prod_a", { metadata: { stock: 6 } });
		expect(paymentIntentsUpdate).toHaveBeenCalledWith("pi_refund_ok", {
			metadata: { stock_restored: "1" },
		});
	});

	it("reembolso parcial (refunded=false): no toca el stock", async () => {
		paymentIntentsRetrieve.mockResolvedValue({ metadata: { stock_processed: "1" } });

		await POST(buildRequest(buildRefundEvent({ paymentIntentId: "pi_partial", refunded: false })));

		expect(productsUpdate).not.toHaveBeenCalled();
		expect(paymentIntentsRetrieve).not.toHaveBeenCalled();
	});

	it("si el stock ya se devolvió para este pago, no lo devuelve dos veces", async () => {
		paymentIntentsRetrieve.mockResolvedValue({ metadata: { stock_processed: "1", stock_restored: "1" } });

		await POST(buildRequest(buildRefundEvent({ paymentIntentId: "pi_already_restored" })));

		expect(productsUpdate).not.toHaveBeenCalled();
	});

	it("si el pago original nunca descontó stock (sin stock_processed), no hay nada que devolver", async () => {
		paymentIntentsRetrieve.mockResolvedValue({ metadata: {} });

		await POST(buildRequest(buildRefundEvent({ paymentIntentId: "pi_never_processed" })));

		expect(productsUpdate).not.toHaveBeenCalled();
	});
});

describe("POST /api/stripe-webhook — product.created (auto-slug)", () => {
	beforeEach(() => {
		constructEventAsync.mockImplementation(async (_body: string) => JSON.parse(_body));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	function buildProductEvent({
		id = "prod_new",
		name = "Llavero Gato",
		metadata = {},
	}: {
		id?: string;
		name?: string;
		metadata?: Record<string, string>;
	}) {
		return {
			type: "product.created",
			data: { object: { id, name, active: true, metadata } },
		};
	}

	it("sin colisión: usa el slug tal cual sale de slugify", async () => {
		productsList.mockResolvedValue({ data: [], has_more: false });

		await POST(buildRequest(buildProductEvent({ id: "prod_new" })));

		expect(productsUpdate).toHaveBeenCalledWith("prod_new", { metadata: { slug: "llavero-gato" } });
	});

	it("con colisión de slug entre dos productos SIN variant: añade un sufijo numérico", async () => {
		productsList.mockResolvedValue({
			data: [{ id: "prod_existing", metadata: { slug: "llavero-gato" } }],
			has_more: false,
		});

		await POST(buildRequest(buildProductEvent({ id: "prod_new" })));

		expect(productsUpdate).toHaveBeenCalledWith("prod_new", { metadata: { slug: "llavero-gato-2" } });
	});

	it("si el producto nuevo es una variante intencionada (metadata.variant), NO desambigua el slug", async () => {
		productsList.mockResolvedValue({
			data: [{ id: "prod_existing", metadata: { slug: "llavero-gato" } }],
			has_more: false,
		});

		await POST(buildRequest(buildProductEvent({ id: "prod_new", metadata: { variant: "azul" } })));

		expect(productsUpdate).toHaveBeenCalledWith("prod_new", { metadata: { slug: "llavero-gato" } });
	});
});

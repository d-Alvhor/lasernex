import * as Commerce from "commerce-kit";
import { updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocks a nivel de módulo — llamamos directamente a la server action real
// (addToCartAction), sin red, sin reescribir su lógica.
vi.mock("commerce-kit", () => ({
	cartGet: vi.fn(),
	cartAdd: vi.fn(),
	cartSetQuantity: vi.fn(),
	cartChangeQuantity: vi.fn(),
	productGetById: vi.fn(),
	updatePaymentIntent: vi.fn(),
	cartCount: vi.fn(() => 1),
}));

vi.mock("next/cache", () => ({
	updateTag: vi.fn(),
}));

vi.mock("next/headers", () => ({
	cookies: vi.fn(),
	headers: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
	rateLimit: vi.fn(() => true),
}));

const { addToCartAction, setQuantity, decreaseQuantity } = await import("./cart-actions");

function buildFormData(fields: Record<string, string>) {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.set(key, value);
	}
	return formData;
}

// Simula el jar de cookies que devuelve next/headers cookies(): sin cookie
// previa por defecto (carrito vacío), configurable por test.
function mockCookieJar(existing?: { id: string; linesCount: number }) {
	const cookieValue = existing ? { name: "yns_cart", value: JSON.stringify(existing) } : undefined;
	vi.mocked(cookies).mockResolvedValue({
		get: vi.fn(() => cookieValue),
		set: vi.fn(),
	} as never);
}

function mockHeaders() {
	vi.mocked(headers).mockResolvedValue({
		get: vi.fn(() => "203.0.113.1"),
	} as never);
}

describe("addToCartAction — personalización de producto", () => {
	beforeEach(() => {
		mockHeaders();
		mockCookieJar(); // sin cookie: carrito vacío por defecto
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it.each([
		["cadena vacía", ""],
		["cadena solo espacios (tras trim queda vacía)", "   "],
		["más de 40 caracteres", "x".repeat(41)],
	])("rechaza la personalización: %s", async (_desc, value) => {
		const formData = buildFormData({ productId: "prod_1", personalization: value });

		await expect(addToCartAction(formData)).rejects.toThrow(
			"El texto de personalización no es válido: debe tener entre 1 y 40 caracteres.",
		);
		expect(Commerce.cartAdd).not.toHaveBeenCalled();
	});

	it("hace trim: un valor con espacios alrededor se guarda ya recortado", async () => {
		vi.mocked(Commerce.cartAdd).mockResolvedValue({ id: "pi_new", metadata: {} } as never);

		const formData = buildFormData({ productId: "prod_1", personalization: "  Ana  " });
		await addToCartAction(formData);

		expect(Commerce.updatePaymentIntent).toHaveBeenCalledWith({
			paymentIntentId: "pi_new",
			data: { metadata: { personalization_prod_1: "Ana" } },
		});
	});

	it("si ya hay una unidad personalizada de ese producto en el carrito, lanza error al intentar añadir otra", async () => {
		mockCookieJar({ id: "pi_existing", linesCount: 1 });
		vi.mocked(Commerce.cartGet).mockResolvedValue({
			cart: { id: "pi_existing", metadata: { prod_1: "1" } },
			lines: [],
			shippingRate: null,
		} as never);

		const formData = buildFormData({ productId: "prod_1", personalization: "Ana" });

		await expect(addToCartAction(formData)).rejects.toThrow("ya está en tu carrito");
		expect(Commerce.cartAdd).not.toHaveBeenCalled();
	});

	it("añadir un producto SIN personalización funciona con normalidad", async () => {
		vi.mocked(Commerce.cartAdd).mockResolvedValue({ id: "pi_new", metadata: {} } as never);

		const formData = buildFormData({ productId: "prod_1" });
		const result = await addToCartAction(formData);

		expect(Commerce.cartAdd).toHaveBeenCalledWith({ productId: "prod_1", cartId: undefined });
		expect(Commerce.updatePaymentIntent).not.toHaveBeenCalled();
		expect(updateTag).toHaveBeenCalledWith("cart-pi_new");
		expect(result).toEqual({ id: "pi_new", metadata: {} });
	});
});

describe("setQuantity — límite de stock y carrito autoritativo", () => {
	beforeEach(() => {
		mockCookieJar({ id: "pi_current", linesCount: 1 });
		vi.mocked(Commerce.cartGet).mockResolvedValue({
			cart: { id: "pi_current", metadata: {} },
			lines: [],
			shippingRate: null,
		} as never);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("rechaza pedir más cantidad de la que hay en stock", async () => {
		vi.mocked(Commerce.productGetById).mockResolvedValue({
			metadata: { stock: 2 },
		} as never);

		await expect(setQuantity({ productId: "prod_1", quantity: 3 })).rejects.toThrow(
			"Solo quedan 2 unidades disponibles de este producto.",
		);
		expect(Commerce.cartSetQuantity).not.toHaveBeenCalled();
	});

	it("permite pedir hasta el stock exacto disponible", async () => {
		vi.mocked(Commerce.productGetById).mockResolvedValue({ metadata: { stock: 2 } } as never);
		vi.mocked(Commerce.cartSetQuantity).mockResolvedValue({ id: "pi_current" } as never);

		await setQuantity({ productId: "prod_1", quantity: 2 });

		expect(Commerce.cartSetQuantity).toHaveBeenCalledWith({
			productId: "prod_1",
			cartId: "pi_current",
			quantity: 2,
		});
	});

	it("no comprueba stock cuando metadata.stock es Infinity (sin límite)", async () => {
		vi.mocked(Commerce.productGetById).mockResolvedValue({
			metadata: { stock: Number.POSITIVE_INFINITY },
		} as never);
		vi.mocked(Commerce.cartSetQuantity).mockResolvedValue({ id: "pi_current" } as never);

		await setQuantity({ productId: "prod_1", quantity: 999 });

		expect(Commerce.cartSetQuantity).toHaveBeenCalled();
	});

	it("usa el cartId leído de la cookie del servidor, no uno pasado desde el cliente", async () => {
		vi.mocked(Commerce.productGetById).mockResolvedValue({ metadata: { stock: 5 } } as never);
		vi.mocked(Commerce.cartSetQuantity).mockResolvedValue({ id: "pi_current" } as never);

		await setQuantity({ productId: "prod_1", quantity: 1 });

		expect(Commerce.cartSetQuantity).toHaveBeenCalledWith(expect.objectContaining({ cartId: "pi_current" }));
	});

	it("si cartSetQuantity falla en silencio (devuelve undefined) al quitar el producto, lanza error y NO borra la personalización", async () => {
		vi.mocked(Commerce.cartGet).mockResolvedValue({
			cart: { id: "pi_current", metadata: { personalization_prod_1: "Ana" } },
			lines: [],
			shippingRate: null,
		} as never);
		vi.mocked(Commerce.cartSetQuantity).mockResolvedValue(undefined);

		await expect(setQuantity({ productId: "prod_1", quantity: 0 })).rejects.toThrow(
			"No se pudo actualizar la cantidad. Inténtalo de nuevo.",
		);

		expect(Commerce.updatePaymentIntent).not.toHaveBeenCalled();
	});

	it("si cartSetQuantity falla en silencio (devuelve undefined) al SUBIR la cantidad, también lanza error", async () => {
		vi.mocked(Commerce.productGetById).mockResolvedValue({ metadata: { stock: 5 } } as never);
		vi.mocked(Commerce.cartSetQuantity).mockResolvedValue(undefined);

		await expect(setQuantity({ productId: "prod_1", quantity: 2 })).rejects.toThrow(
			"No se pudo actualizar la cantidad. Inténtalo de nuevo.",
		);
	});

	it("al quitar el producto (quantity 0) con éxito, sí borra la personalización", async () => {
		vi.mocked(Commerce.cartGet).mockResolvedValue({
			cart: { id: "pi_current", metadata: { personalization_prod_1: "Ana" } },
			lines: [],
			shippingRate: null,
		} as never);
		vi.mocked(Commerce.cartSetQuantity).mockResolvedValue({ id: "pi_current" } as never);

		await setQuantity({ productId: "prod_1", quantity: 0 });

		expect(Commerce.updatePaymentIntent).toHaveBeenCalledWith({
			paymentIntentId: "pi_current",
			data: { metadata: { personalization_prod_1: "" } },
		});
	});
});

// commerce-kit@0.0.39 calcula el importe de toda mutación como "total anterior
// + una unidad", así que al bajar/quitar cobraba de más y al saltar varias
// unidades de menos. Estos tests fijan el invariante: lo que se cobra es
// SIEMPRE el total real del carrito ya mutado.
describe("cantidad — el importe cobrado se resincroniza con el total mostrado", () => {
	// 3 unidades a 40,00 € = 120,00 €
	const carritoDe = (quantity: number, shippingRate: unknown = null) => ({
		cart: { id: "pi_current", amount: 12000, metadata: { prod_1: String(quantity) } },
		lines: [{ product: { default_price: { unit_amount: 4000 } }, quantity }],
		shippingRate,
	});

	beforeEach(() => {
		mockCookieJar({ id: "pi_current", linesCount: 1 });
		vi.mocked(Commerce.productGetById).mockResolvedValue({ metadata: { stock: 99 } } as never);
		vi.mocked(Commerce.cartSetQuantity).mockResolvedValue({ id: "pi_current" } as never);
		vi.mocked(Commerce.cartChangeQuantity).mockResolvedValue({ id: "pi_current" } as never);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("al BAJAR de 3 a 2 cobra 80,00 €, no el total anterior más una unidad", async () => {
		vi.mocked(Commerce.cartGet)
			.mockResolvedValueOnce(carritoDe(3) as never) // lectura previa a la mutación
			.mockResolvedValueOnce(carritoDe(2) as never); // relectura autoritativa posterior

		await setQuantity({ productId: "prod_1", quantity: 2 });

		expect(Commerce.updatePaymentIntent).toHaveBeenCalledWith({
			paymentIntentId: "pi_current",
			data: { amount: 8000 },
		});
	});

	it("al SALTAR de 1 a 5 cobra las 5 unidades, no 2", async () => {
		vi.mocked(Commerce.cartGet)
			.mockResolvedValueOnce(carritoDe(1) as never)
			.mockResolvedValueOnce(carritoDe(5) as never);

		await setQuantity({ productId: "prod_1", quantity: 5 });

		expect(Commerce.updatePaymentIntent).toHaveBeenCalledWith({
			paymentIntentId: "pi_current",
			data: { amount: 20000 },
		});
	});

	it("suma el envío al importe, igual que hace el total en pantalla", async () => {
		const envio = { fixed_amount: { amount: 490 } };
		vi.mocked(Commerce.cartGet)
			.mockResolvedValueOnce(carritoDe(3, envio) as never)
			.mockResolvedValueOnce(carritoDe(2, envio) as never);

		await setQuantity({ productId: "prod_1", quantity: 2 });

		expect(Commerce.updatePaymentIntent).toHaveBeenCalledWith({
			paymentIntentId: "pi_current",
			data: { amount: 8490 },
		});
	});

	it("el botón de restar (decreaseQuantity) también resincroniza el importe", async () => {
		vi.mocked(Commerce.cartGet)
			.mockResolvedValueOnce(carritoDe(3) as never)
			.mockResolvedValueOnce(carritoDe(2) as never);

		await decreaseQuantity("prod_1");

		expect(Commerce.updatePaymentIntent).toHaveBeenCalledWith({
			paymentIntentId: "pi_current",
			data: { amount: 8000 },
		});
	});

	it("con el carrito ya vacío no intenta poner el importe a cero (Stripe lo rechazaría)", async () => {
		vi.mocked(Commerce.cartGet)
			.mockResolvedValueOnce(carritoDe(1) as never)
			.mockResolvedValueOnce({
				cart: { id: "pi_current", amount: 4000, metadata: {} },
				lines: [],
				shippingRate: null,
			} as never);

		await setQuantity({ productId: "prod_1", quantity: 0 });

		expect(Commerce.updatePaymentIntent).not.toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ amount: expect.anything() }) }),
		);
	});
});

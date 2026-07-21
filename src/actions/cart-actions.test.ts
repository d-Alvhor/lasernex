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

const { addToCartAction, setQuantity } = await import("./cart-actions");

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

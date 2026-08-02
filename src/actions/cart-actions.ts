"use server";

import { clearCartCookie, getCartCookieJson, setCartCookieJson } from "@/lib/cart";
import { rateLimit } from "@/lib/rate-limit";
import { calculateCartTotalPossiblyWithTax, stringToInt } from "@/lib/utils";
import * as Commerce from "commerce-kit";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

const personalizationSchema = z.string().trim().min(1).max(40);

export async function getCartFromCookiesAction() {
	const cartJson = await getCartCookieJson();
	if (!cartJson) {
		return null;
	}

	const cart = await Commerce.cartGet(cartJson.id);
	if (cart) {
		return structuredClone(cart);
	}
	return null;
}

export async function setInitialCartCookiesAction(cartId: string, linesCount: number) {
	await setCartCookieJson({
		id: cartId,
		linesCount,
	});
	updateTag(`cart-${cartId}`);
}

export async function findOrCreateCartIdFromCookiesAction() {
	const cart = await getCartFromCookiesAction();
	if (cart) {
		return structuredClone(cart);
	}

	// Rate limit best-effort sobre la creación de carrito/PaymentIntent — ver SECURITY.md §4.
	const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	if (!rateLimit(ip)) {
		throw new Error("Demasiadas peticiones. Espera un minuto y vuelve a intentarlo.");
	}

	const newCart = await Commerce.cartCreate();
	await setCartCookieJson({
		id: newCart.id,
		linesCount: 0,
	});
	updateTag(`cart-${newCart.id}`);

	return newCart.id;
}

export async function clearCartCookieAction() {
	const cookie = await getCartCookieJson();
	if (!cookie) {
		return;
	}

	await clearCartCookie();
	updateTag(`cart-${cookie.id}`);
}

export async function addToCartAction(formData: FormData) {
	// Rate limit best-effort — mismo patrón que findOrCreateCartIdFromCookiesAction (SECURITY.md §4).
	const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	if (!rateLimit(ip)) {
		throw new Error("Demasiadas peticiones. Espera un minuto y vuelve a intentarlo.");
	}

	const productId = formData.get("productId");
	if (!productId || typeof productId !== "string") {
		throw new Error("Invalid product ID");
	}

	const personalizationRaw = formData.get("personalization");
	let personalization: string | null = null;
	if (personalizationRaw !== null) {
		const parsed = personalizationSchema.safeParse(personalizationRaw);
		if (!parsed.success) {
			throw new Error("El texto de personalización no es válido: debe tener entre 1 y 40 caracteres.");
		}
		personalization = parsed.data;
	}

	const cart = await getCartFromCookiesAction();

	// Cantidad fija a 1 por texto en servidor: si ya hay una unidad personalizada
	// de este producto en el carrito, no se puede añadir otra (mismo patrón que Etsy).
	if (personalization && cart && stringToInt(cart.cart.metadata[productId]) >= 1) {
		throw new Error(
			"Este producto personalizado ya está en tu carrito. Completa este pedido para encargar otro texto.",
		);
	}

	const updatedCart = await Commerce.cartAdd({ productId, cartId: cart?.cart.id });

	if (updatedCart) {
		// Texto de personalización (grabado/nombre) para productos que lo piden —
		// se guarda como metadata aparte, NUNCA en la clave `prod_...` que usa el
		// contador de cantidad (ver ARCHITECTURE.md, flujo de compra).
		if (personalization) {
			await Commerce.updatePaymentIntent({
				paymentIntentId: updatedCart.id,
				data: { metadata: { [`personalization_${productId}`]: personalization } },
			});
		}

		await setCartCookieJson({
			id: updatedCart.id,
			linesCount: Commerce.cartCount(updatedCart.metadata),
		});

		updateTag(`cart-${updatedCart.id}`);
		return structuredClone(updatedCart);
	}
}

export async function increaseQuantity(productId: string) {
	const cart = await getCartFromCookiesAction();
	if (!cart) {
		throw new Error("Cart not found");
	}
	await Commerce.cartChangeQuantity({
		productId,
		cartId: cart.cart.id,
		operation: "INCREASE",
	});
	await syncPaymentIntentAmount(cart.cart.id);
}

export async function decreaseQuantity(productId: string) {
	const cart = await getCartFromCookiesAction();
	if (!cart) {
		throw new Error("Cart not found");
	}
	await Commerce.cartChangeQuantity({
		productId,
		cartId: cart.cart.id,
		operation: "DECREASE",
	});
	await syncPaymentIntentAmount(cart.cart.id);
	if (stringToInt(cart.cart.metadata[productId]) - 1 <= 0) {
		await clearPersonalizationMetadata(cart, productId);
	}
}

export async function setQuantity({
	productId,
	quantity,
}: {
	productId: string;
	quantity: number;
}) {
	const cart = await getCartFromCookiesAction();
	if (!cart) {
		throw new Error("Cart not found");
	}

	if (quantity > 0) {
		const product = await Commerce.productGetById(productId);
		if (product && product.metadata.stock !== Infinity && quantity > product.metadata.stock) {
			throw new Error(
				product.metadata.stock <= 0
					? "Este producto está agotado ahora mismo."
					: `Solo quedan ${product.metadata.stock} unidades disponibles de este producto.`,
			);
		}
	}

	// Se usa SIEMPRE el carrito leído de la cookie del servidor, nunca un
	// cartId recibido del cliente: un carrito nuevo pudo crearse entre el
	// render y el clic (p. ej. al completar una compra en otra pestaña), y
	// mutar ese cartId antiguo movería stock de un carrito huérfano.
	const updatedCart = await Commerce.cartSetQuantity({ productId, cartId: cart.cart.id, quantity });

	// cartSetQuantity traga sus propios errores (los loguea y devuelve
	// undefined en vez de lanzar): sin este chequeo, un fallo transitorio de
	// Stripe al SUBIR la cantidad no avisaba a nadie — el cliente pulsaba "+"
	// y no pasaba nada, sin ningún error visible. Al bajar a 0, además,
	// tampoco hay que borrar el texto de personalización si esto falló: el
	// producto seguiría en el carrito con su cantidad anterior.
	if (!updatedCart) {
		throw new Error("No se pudo actualizar la cantidad. Inténtalo de nuevo.");
	}
	await syncPaymentIntentAmount(cart.cart.id);
	if (quantity <= 0) {
		await clearPersonalizationMetadata(cart, productId);
	}
}

// commerce-kit@0.0.39 calcula el importe de TODA mutación de cantidad como
// "total anterior + una unidad" (mismo cálculo en cartSetQuantity y en
// cartChangeQuantity dentro de su bundle): solo acierta al subir de uno en uno.
// Al bajar, al quitar o al saltar varias unidades, el PaymentIntent queda
// descuadrado con lo que el cliente ve — y es el importe del PaymentIntent lo
// que se cobra de verdad, así que se cobraba de más.
//
// Tras cada mutación releemos el carrito autoritativo de Stripe y fijamos el
// importe con la MISMA función que pinta el total en pantalla
// (calculateCartTotalPossiblyWithTax, la que usa cart-summary-table). Así lo
// cobrado y lo mostrado no pueden divergir: es el mismo cálculo, no dos.
async function syncPaymentIntentAmount(cartId: string) {
	const fresh = await Commerce.cartGet(cartId);
	if (!fresh) {
		return;
	}

	const amount = calculateCartTotalPossiblyWithTax(fresh);
	// Stripe rechaza importes por debajo de su mínimo. Con el carrito vacío no
	// hay nada que cobrar y el checkout no deja continuar, así que se deja como
	// está en vez de provocar un error de la API.
	if (amount <= 0) {
		return;
	}

	await Commerce.updatePaymentIntent({ paymentIntentId: cartId, data: { amount } });
}

// Al eliminar del carrito un producto personalizado, limpia su texto: Stripe
// borra una clave de metadata cuando se le asigna la cadena vacía.
async function clearPersonalizationMetadata(cart: Commerce.Cart, productId: string) {
	if (!cart.cart.metadata[`personalization_${productId}`]) {
		return;
	}
	await Commerce.updatePaymentIntent({
		paymentIntentId: cart.cart.id,
		data: { metadata: { [`personalization_${productId}`]: "" } },
	});
}

export async function commerceGPTRevalidateAction() {
	const cart = await getCartCookieJson();
	if (cart) {
		updateTag(`cart-${cart.id}`);
	}
}

"use server";

import { clearCartCookie, getCartCookieJson, setCartCookieJson } from "@/lib/cart";
import { rateLimit } from "@/lib/rate-limit";
import * as Commerce from "commerce-kit";
import { updateTag } from "next/cache";
import { headers } from "next/headers";

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
	const productId = formData.get("productId");
	if (!productId || typeof productId !== "string") {
		throw new Error("Invalid product ID");
	}

	const cart = await getCartFromCookiesAction();

	const updatedCart = await Commerce.cartAdd({ productId, cartId: cart?.cart.id });

	if (updatedCart) {
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
}

export async function setQuantity({
	productId,
	cartId,
	quantity,
}: {
	productId: string;
	cartId: string;
	quantity: number;
}) {
	const cart = await getCartFromCookiesAction();
	if (!cart) {
		throw new Error("Cart not found");
	}
	await Commerce.cartSetQuantity({ productId, cartId, quantity });
}

export async function commerceGPTRevalidateAction() {
	const cart = await getCartCookieJson();
	if (cart) {
		updateTag(`cart-${cart.id}`);
	}
}

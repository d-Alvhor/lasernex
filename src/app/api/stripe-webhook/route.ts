import { env } from "@/env.mjs";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";
import { formatMoney, unpackPromise } from "@/lib/utils";
import * as Commerce from "commerce-kit";
import { cartMetadataSchema } from "commerce-kit/internal";
import { revalidateTag } from "next/cache";

// Genera un slug url-amigable a partir del nombre del producto.
// Sirve para que la dueña NO tenga que rellenar el metadato `slug` a mano en
// Stripe: al crear el producto, el webhook lo pone solo (ver OPERATIONS.md).
function slugify(text: string): string {
	return text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // quita acentos
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60);
}

export async function POST(request: Request) {
	if (!env.STRIPE_WEBHOOK_SECRET) {
		return new Response("STRIPE_WEBHOOK_SECRET is not configured", { status: 500 });
	}

	const signature = (await request.headers).get("Stripe-Signature");
	if (!signature) {
		return new Response("No signature", { status: 401 });
	}

	const stripe = Commerce.provider({
		tagPrefix: undefined,
		secretKey: undefined,
		cache: "no-store",
	});

	const [error, event] = await unpackPromise(
		stripe.webhooks.constructEventAsync(await (await request.text)(), signature, env.STRIPE_WEBHOOK_SECRET),
	);

	if (error) {
		console.error(error);
		return new Response("Invalid signature", { status: 401 });
	}

	switch (event.type) {
		case "payment_intent.succeeded":
			const metadata = cartMetadataSchema.parse(event.data.object.metadata);
			if (metadata.taxCalculationId) {
				await stripe.tax.transactions.createFromCalculation({
					calculation: metadata.taxCalculationId,
					// @todo generate better references
					reference: event.data.object.id.slice(3),
				});
			}

			const products = await Commerce.getProductsFromMetadata(metadata);

			for (const { product } of products) {
				if (product && product.metadata.stock !== Infinity) {
					await stripe.products.update(product.id, {
						metadata: {
							stock: product.metadata.stock - 1,
						},
					});

					revalidateTag(`product-${product.id}`, "max");
				}
			}

			revalidateTag(`cart-${event.data.object.id}`, "max");

			// Email de confirmación (Resend) — ver ARCHITECTURE.md flujo de compra y ADR-005.
			// No bloqueante: si falla el email, el pedido y el pago ya están confirmados en Stripe.
			try {
				const order = await Commerce.orderGet(event.data.object.id);
				const email = order?.order.latest_charge?.billing_details?.email;
				if (order && email) {
					// receipt_email nunca se fija durante el checkout (LinkAuthenticationElement
					// solo guarda el email en billing_details, no en el propio PaymentIntent), así
					// que sin esto Stripe NUNCA manda su recibo automático (LEGAL.md se lo promete
					// al cliente). Fijarlo aquí, tras el pago, SÍ dispara el envío del recibo.
					if (!order.order.receipt_email) {
						await stripe.paymentIntents.update(event.data.object.id, { receipt_email: email });
					}

					const currency = order.order.currency;
					await sendOrderConfirmationEmail(email, {
						orderNumber: order.order.id,
						customerName:
							order.order.shipping?.name ?? order.order.latest_charge?.billing_details?.name ?? "",
						lines: order.lines
							.filter((line) => line.product)
							.map((line) => ({
								name: line.product!.name,
								quantity: line.quantity,
								unitAmountFormatted: formatMoney({
									amount: (line.product!.default_price.unit_amount ?? 0) * line.quantity,
									currency,
									locale: "es-ES",
								}),
							})),
						totalFormatted: formatMoney({ amount: order.order.amount, currency, locale: "es-ES" }),
						shippingAddress: order.order.shipping?.address
							? {
									line1: order.order.shipping.address.line1,
									line2: order.order.shipping.address.line2,
									city: order.order.shipping.address.city,
									postalCode: order.order.shipping.address.postal_code,
									country: order.order.shipping.address.country,
								}
							: null,
					});
				} else {
					console.warn("No se pudo enviar email de confirmación: pedido o email no encontrados", {
						paymentIntentId: event.data.object.id,
					});
				}
			} catch (emailError) {
				console.error("Error enviando email de confirmación", emailError);
			}

			break;

		// Auto-slug: cuando la dueña crea/edita un producto en Stripe sin poner el
		// metadato `slug`, se lo generamos a partir del nombre. Así solo necesita
		// rellenar Nombre + Precio + Foto. (Un producto sin slug rompería el catálogo.)
		case "product.created":
		case "product.updated": {
			const product = event.data.object;
			if (product.active && !product.metadata?.slug && product.name) {
				try {
					await stripe.products.update(product.id, {
						metadata: { slug: slugify(product.name) },
					});
					revalidateTag("product", "max");
				} catch (slugError) {
					console.error("No se pudo auto-generar el slug del producto", product.id, slugError);
				}
			}
			break;
		}

		default:
			console.log(`Unhandled event type: ${event.type}`);
	}
	return Response.json({ received: true });
}

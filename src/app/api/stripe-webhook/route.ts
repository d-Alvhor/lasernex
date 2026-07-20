import { env } from "@/env.mjs";
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from "@/lib/email/resend";
import { formatMoney, unpackPromise } from "@/lib/utils";
import config from "@/store.config";
import * as Commerce from "commerce-kit";
import { cartMetadataSchema } from "commerce-kit/internal";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";

type StripeClient = ReturnType<typeof Commerce.provider>;

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

// Todos los productos activos sin deduplicar por slug (a diferencia de
// Commerce.productBrowse, que sí dedupea) y paginando de verdad — hace falta
// sin dedupe para poder detectar colisiones de slug entre productos distintos.
async function listAllActiveProductsRaw(stripe: StripeClient): Promise<Stripe.Product[]> {
	const products: Stripe.Product[] = [];
	let startingAfter: string | undefined;
	do {
		const page = await stripe.products.list({ active: true, limit: 100, starting_after: startingAfter });
		products.push(...page.data);
		startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
	} while (startingAfter);
	return products;
}

// Evita que dos productos con nombre igual (o muy parecido) acaben con el
// mismo slug autogenerado si ninguno de los dos es una variante intencionada
// (metadata.variant): sin esto, el segundo producto rompe su propia ficha
// (commerce-kit lanza "Multiple products found...") y desaparece en silencio
// del listado (que dedupea por slug quedándose con el primero que encuentra).
async function resolveUniqueSlug({
	stripe,
	baseSlug,
	currentProductId,
	hasVariant,
}: {
	stripe: StripeClient;
	baseSlug: string;
	currentProductId: string;
	hasVariant: boolean;
}): Promise<string> {
	if (hasVariant) {
		return baseSlug;
	}

	const existing = await listAllActiveProductsRaw(stripe);
	const takenSlugs = new Set(
		existing
			.filter((p) => p.id !== currentProductId && !p.metadata?.variant)
			.map((p) => p.metadata?.slug)
			.filter(Boolean),
	);

	if (!takenSlugs.has(baseSlug)) {
		return baseSlug;
	}

	let suffix = 2;
	while (takenSlugs.has(`${baseSlug}-${suffix}`)) {
		suffix += 1;
	}
	return `${baseSlug}-${suffix}`;
}

export async function POST(request: Request) {
	if (!env.STRIPE_WEBHOOK_SECRET) {
		return new Response("STRIPE_WEBHOOK_SECRET is not configured", { status: 500 });
	}

	const signature = request.headers.get("Stripe-Signature");
	if (!signature) {
		return new Response("No signature", { status: 401 });
	}

	const stripe = Commerce.provider({
		tagPrefix: undefined,
		secretKey: undefined,
		cache: "no-store",
	});

	const [error, event] = await unpackPromise(
		stripe.webhooks.constructEventAsync(await request.text(), signature, env.STRIPE_WEBHOOK_SECRET),
	);

	if (error) {
		console.error(error);
		return new Response("Invalid signature", { status: 401 });
	}

	switch (event.type) {
		case "payment_intent.succeeded":
			const metadata = cartMetadataSchema.parse(event.data.object.metadata);
			if (metadata.taxCalculationId) {
				// Solo se ejecuta si ENABLE_STRIPE_TAX está activo (hoy no lo está: precios
				// IVA-incluido fijos, ver ROADMAP.md). Si se activa Stripe Tax, revisar si el
				// payment intent id sin prefijo es referencia suficiente para la transacción fiscal.
				await stripe.tax.transactions.createFromCalculation({
					calculation: metadata.taxCalculationId,
					reference: event.data.object.id.slice(3),
				});
			}

			// Idempotencia: Stripe puede reenviar el mismo evento (SECURITY.md §2 exige
			// tolerar duplicados) — si el stock de este pago ya se descontó, no repetirlo.
			// Se comprueba contra el PaymentIntent EN VIVO, no contra
			// event.data.object.metadata (un snapshot congelado en el instante en que
			// Stripe generó este evento): un reenvío del MISMO evento seguiría viendo
			// ese snapshot como "sin procesar" aunque ya hubiéramos marcado el
			// PaymentIntent real como procesado, y se repetiría el descuento de stock.
			const livePaymentIntent = await stripe.paymentIntents.retrieve(event.data.object.id);
			if (livePaymentIntent.metadata.stock_processed) {
				console.warn("Stock ya descontado para este pago, se omite el decremento", {
					paymentIntentId: event.data.object.id,
				});
			} else {
				const products = await Commerce.getProductsFromMetadata(metadata);

				for (const { product, quantity } of products) {
					if (product && product.metadata.stock !== Infinity) {
						await stripe.products.update(product.id, {
							metadata: {
								// Nunca negativo: dos ventas casi simultáneas de la misma pieza
								// podrían restar dos veces sobre el mismo valor leído (Stripe no
								// ofrece un decremento atómico en metadata) — este suelo evita
								// que el stock quede en negativo aunque no elimina la carrera en
								// sí. Ver ARCHITECTURE.md sobre por qué no hay un lock distribuido
								// aquí (exigiría infraestructura nueva, fuera de presupuesto).
								stock: Math.max(0, product.metadata.stock - quantity),
							},
						});

						revalidateTag(`product-${product.id}`, "max");
					}
				}

				// Revalida también el tag amplio: la ficha (productGetBySlug) y la
				// categoría (productBrowse) cachean por slug/categoría bajo "product",
				// no por el id interno de Stripe — sin esto seguían mostrando el stock
				// de antes de la venta hasta que la dueña editara cualquier producto.
				revalidateTag("product", "max");

				// Stripe hace merge de metadata: esta clave se añade sin borrar las del carrito.
				await stripe.paymentIntents.update(event.data.object.id, {
					metadata: { stock_processed: "1" },
				});
			}

			revalidateTag(`cart-${event.data.object.id}`, "max");

			// Emails (Resend) — ver ARCHITECTURE.md flujo de compra y ADR-005.
			// No bloqueantes: si falla un email, el pedido y el pago ya están confirmados
			// en Stripe. Cada paso lleva su propio try/catch para que el fallo de uno
			// no impida los siguientes.
			let orderData: {
				email: string;
				orderNumber: string;
				receiptEmailAlreadySet: boolean;
				customerName: string;
				lines: {
					name: string;
					quantity: number;
					unitAmountFormatted: string;
					personalization: string | null;
				}[];
				totalFormatted: string;
				shippingAddress: {
					line1?: string | null;
					line2?: string | null;
					city?: string | null;
					postalCode?: string | null;
					country?: string | null;
				} | null;
			} | null = null;

			try {
				const order = await Commerce.orderGet(event.data.object.id);
				const email = order?.order.latest_charge?.billing_details?.email;
				if (order && email) {
					const currency = order.order.currency;
					orderData = {
						email,
						orderNumber: order.order.id,
						receiptEmailAlreadySet: Boolean(order.order.receipt_email),
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
								personalization: order.order.metadata[`personalization_${line.product!.id}`] ?? null,
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
					};
				} else {
					console.warn("No se pudieron enviar los emails de pedido: pedido o email no encontrados", {
						paymentIntentId: event.data.object.id,
					});
				}
			} catch (orderError) {
				console.error("Error obteniendo los datos del pedido para los emails", orderError);
			}

			if (orderData) {
				// receipt_email nunca se fija durante el checkout (LinkAuthenticationElement
				// solo guarda el email en billing_details, no en el propio PaymentIntent), así
				// que sin esto Stripe NUNCA manda su recibo automático (se lo prometemos al
				// cliente en /legal/condiciones). Fijarlo aquí, tras el pago, SÍ dispara el envío.
				try {
					if (!orderData.receiptEmailAlreadySet) {
						await stripe.paymentIntents.update(event.data.object.id, { receipt_email: orderData.email });
					}
				} catch (receiptError) {
					console.error("Error fijando receipt_email en el PaymentIntent", receiptError);
				}

				// Email interno PRIMERO: que Carla se entere del pedido aunque falle el
				// email al cliente. El enlace lleva SHIP_NOTIFICATION_SECRET en claro:
				// va SOLO a config.contact.email (Carla), nunca al cliente ni a ninguna
				// superficie pública.
				try {
					if (env.SHIP_NOTIFICATION_SECRET) {
						await sendOrderNotificationEmail(config.contact.email, {
							orderNumber: orderData.orderNumber,
							customerName: orderData.customerName,
							lines: orderData.lines,
							totalFormatted: orderData.totalFormatted,
							shippingAddress: orderData.shippingAddress,
							shipToken: env.SHIP_NOTIFICATION_SECRET,
						});
					} else {
						console.warn("SHIP_NOTIFICATION_SECRET no configurado: email interno de nuevo pedido NO enviado");
					}
				} catch (notificationError) {
					console.error("Error enviando email interno de nuevo pedido", notificationError);
				}

				try {
					const hasPersonalization = orderData.lines.some((line) => Boolean(line.personalization));
					await sendOrderConfirmationEmail(orderData.email, {
						orderNumber: orderData.orderNumber,
						customerName: orderData.customerName,
						lines: orderData.lines,
						totalFormatted: orderData.totalFormatted,
						shippingAddress: orderData.shippingAddress,
						hasPersonalization,
					});
				} catch (confirmationError) {
					console.error("Error enviando email de confirmación al cliente", confirmationError);
				}
			}

			break;

		// La dueña reembolsa un pedido desde el Dashboard de Stripe (su única forma
		// de gestionar devoluciones, ADR-003): sin esto el stock descontado en la
		// venta original se queda bajo para siempre, y si era la última unidad la
		// ficha se queda marcada "agotado" para un producto que ya vuelve a estarlo.
		case "charge.refunded": {
			const charge = event.data.object;
			if (!charge.refunded) {
				// Reembolso parcial: no hay forma fiable de saber a qué línea del
				// pedido corresponde, así que no tocamos stock — solo actuamos
				// cuando el cargo queda reembolsado por completo.
				break;
			}

			const paymentIntentId =
				typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
			if (!paymentIntentId) {
				console.warn("charge.refunded sin payment_intent asociado", { chargeId: charge.id });
				break;
			}

			try {
				const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

				if (paymentIntent.metadata.stock_restored) {
					console.warn("Stock ya devuelto para este reembolso, se omite", { paymentIntentId });
					break;
				}
				if (!paymentIntent.metadata.stock_processed) {
					// Nunca se llegó a descontar stock para este pago (p. ej. se
					// reembolsó antes de que este webhook lo procesara) — nada que devolver.
					break;
				}

				const refundedMetadata = cartMetadataSchema.parse(paymentIntent.metadata);
				const products = await Commerce.getProductsFromMetadata(refundedMetadata);

				for (const { product, quantity } of products) {
					if (product && product.metadata.stock !== Infinity) {
						await stripe.products.update(product.id, {
							metadata: { stock: product.metadata.stock + quantity },
						});
						revalidateTag(`product-${product.id}`, "max");
					}
				}
				revalidateTag("product", "max");

				await stripe.paymentIntents.update(paymentIntentId, {
					metadata: { stock_restored: "1" },
				});
			} catch (refundError) {
				console.error("Error devolviendo stock tras reembolso", paymentIntentId, refundError);
			}
			break;
		}

		// Producto creado/editado/archivado en Stripe por la dueña:
		// 1) Auto-slug si falta (así solo necesita Nombre + Precio + Foto; un
		//    producto sin slug rompería el catálogo).
		// 2) Refrescar SIEMPRE el catálogo (cache tag "product") para que el cambio
		//    se vea en la web sin esperar. Cubre alta, edición y archivado.
		case "product.created":
		case "product.updated": {
			const product = event.data.object;
			if (product.active && !product.metadata?.slug && product.name) {
				try {
					const slug = await resolveUniqueSlug({
						stripe,
						baseSlug: slugify(product.name),
						currentProductId: product.id,
						hasVariant: Boolean(product.metadata?.variant),
					});
					await stripe.products.update(product.id, {
						metadata: { slug },
					});
				} catch (slugError) {
					console.error("No se pudo auto-generar el slug del producto", product.id, slugError);
				}
			}
			revalidateTag("product", "max");
			break;
		}

		default:
			console.warn(`Unhandled event type: ${event.type}`);
	}
	return Response.json({ received: true });
}

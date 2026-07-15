import { timingSafeEqual } from "node:crypto";
import { env } from "@/env.mjs";
import { sendOrderShippedEmail } from "@/lib/email/resend";
import { rateLimit } from "@/lib/rate-limit";
import { formatMoney } from "@/lib/utils";
import * as Commerce from "commerce-kit";
import { NextResponse } from "next/server";
import { z } from "zod";

// Escapa todo valor dinámico interpolado en htmlResponse (evita inyección HTML).
const escapeHtml = (value: string) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

// Compara tokens sin filtrar por temporización (evita side-channel timing attack
// sobre el secreto compartido; el "!==" directo sí es vulnerable a esto).
function safeTokenEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// Enlace que la dueña puede guardar en marcadores y abrir cuando envía un
// pedido (ver OPERATIONS.md). No hay panel de administración propio
// (ADR-003): un único secreto compartido protege esta acción, no una cuenta
// de usuario. GET en vez de POST a propósito: tiene que poder abrirse
// simplemente pegando/pulsando un enlace, sin formularios ni JavaScript.
const querySchema = z.object({
	token: z.string().min(1),
	tracking: z.string().max(100).optional(),
	trackingUrl: z.string().url().optional(),
});

const htmlResponse = (message: string, status: number) =>
	new NextResponse(
		`<!doctype html><html lang="es"><body style="font-family: sans-serif; padding: 2rem; max-width: 480px; margin: 0 auto;"><p>${message}</p></body></html>`,
		{ status, headers: { "Content-Type": "text/html; charset=utf-8" } },
	);

export async function GET(request: Request, props: { params: Promise<{ paymentIntentId: string }> }) {
	if (!env.SHIP_NOTIFICATION_SECRET) {
		return htmlResponse("SHIP_NOTIFICATION_SECRET no está configurado en el servidor.", 500);
	}

	const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	if (!rateLimit(ip)) {
		return htmlResponse("Demasiados intentos. Espera un minuto y vuelve a intentarlo.", 429);
	}

	const { paymentIntentId } = await props.params;
	const { searchParams } = new URL(request.url);
	const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

	if (!parsed.success) {
		return htmlResponse("Enlace inválido: faltan parámetros.", 400);
	}

	if (!safeTokenEqual(parsed.data.token, env.SHIP_NOTIFICATION_SECRET)) {
		return htmlResponse("Enlace no autorizado.", 401);
	}

	const order = await Commerce.orderGet(paymentIntentId);
	const email = order?.order.latest_charge?.billing_details?.email;

	if (!order || !email) {
		return htmlResponse(
			`No se ha encontrado el pedido ${escapeHtml(paymentIntentId)} o no tiene email asociado.`,
			404,
		);
	}

	// Mismas líneas que construye el webhook (con personalización): así Carla y
	// el cliente ven QUÉ se envió, incluido el texto grabado.
	const currency = order.order.currency;
	const lines = order.lines
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
		}));

	const result = await sendOrderShippedEmail(email, {
		orderNumber: order.order.id,
		customerName: order.order.shipping?.name ?? order.order.latest_charge?.billing_details?.name ?? "",
		trackingNumber: parsed.data.tracking ?? null,
		trackingUrl: parsed.data.trackingUrl ?? null,
		lines,
	});

	// Honestidad: solo decimos ✅ si el email salió de verdad.
	if ("skipped" in result || "failed" in result) {
		return htmlResponse(
			"⚠️ No se pudo enviar el email al cliente. Inténtalo de nuevo en unos minutos o avísale tú directamente.",
			502,
		);
	}

	return htmlResponse(
		`✅ Email de "pedido enviado" enviado a ${escapeHtml(email)} (pedido ${escapeHtml(order.order.id)}).`,
		200,
	);
}

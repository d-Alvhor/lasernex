import { env } from "@/env.mjs";
import { sendOrderShippedEmail } from "@/lib/email/resend";
import * as Commerce from "commerce-kit";
import { NextResponse } from "next/server";
import { z } from "zod";

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

	const { paymentIntentId } = await props.params;
	const { searchParams } = new URL(request.url);
	const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

	if (!parsed.success) {
		return htmlResponse("Enlace inválido: faltan parámetros.", 400);
	}

	if (parsed.data.token !== env.SHIP_NOTIFICATION_SECRET) {
		return htmlResponse("Enlace no autorizado.", 401);
	}

	const order = await Commerce.orderGet(paymentIntentId);
	const email = order?.order.latest_charge?.billing_details?.email;

	if (!order || !email) {
		return htmlResponse(`No se ha encontrado el pedido ${paymentIntentId} o no tiene email asociado.`, 404);
	}

	await sendOrderShippedEmail(email, {
		orderNumber: order.order.id,
		customerName: order.order.shipping?.name ?? order.order.latest_charge?.billing_details?.name ?? "",
		trackingNumber: parsed.data.tracking ?? null,
		trackingUrl: parsed.data.trackingUrl ?? null,
	});

	return htmlResponse(`✅ Email de "pedido enviado" enviado a ${email} (pedido ${order.order.id}).`, 200);
}

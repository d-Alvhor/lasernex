import { timingSafeEqual } from "node:crypto";
import { env } from "@/env.mjs";
import { rateLimit } from "@/lib/rate-limit";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

// Enlace que la dueña puede guardar en marcadores para forzar que la web
// vuelva a leer el catálogo de Stripe ahora mismo (ver OPERATIONS.md). Mismo
// patrón que /api/orders/[paymentIntentId]/ship: sin panel de administración
// (ADR-003), un único secreto compartido protege esta acción. GET a propósito:
// tiene que poder abrirse pegando/pulsando un enlace, sin formularios.
function safeTokenEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

const querySchema = z.object({ token: z.string().min(1) });

const htmlResponse = (message: string, status: number) =>
	new NextResponse(
		`<!doctype html><html lang="es"><body style="font-family: sans-serif; padding: 2rem; max-width: 480px; margin: 0 auto;"><p>${message}</p></body></html>`,
		{ status, headers: { "Content-Type": "text/html; charset=utf-8" } },
	);

export async function GET(request: Request) {
	if (!env.STORE_REFRESH_SECRET) {
		return htmlResponse("STORE_REFRESH_SECRET no está configurado en el servidor.", 500);
	}

	const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	if (!rateLimit(ip)) {
		return htmlResponse("Demasiados intentos. Espera un minuto y vuelve a intentarlo.", 429);
	}

	const { searchParams } = new URL(request.url);
	const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
	if (!parsed.success) {
		return htmlResponse("Enlace inválido: falta el token.", 400);
	}

	if (!safeTokenEqual(parsed.data.token, env.STORE_REFRESH_SECRET)) {
		return htmlResponse("Enlace no autorizado.", 401);
	}

	revalidateTag("product", "max");

	return htmlResponse("✅ Tienda refrescada. Los productos nuevos o editados ya deberían verse.", 200);
}

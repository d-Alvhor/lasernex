// @ts-check

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		// Can be provided via env or parameters to Commerce Kit, thus optional
		STRIPE_SECRET_KEY: z.string().optional(),
		// Required in Commerce Kit
		STRIPE_CURRENCY: z.string(),
		STRIPE_WEBHOOK_SECRET: z.string().optional(),

		ENABLE_STRIPE_TAX: z
			.string()
			.optional()
			.transform((str) => !!str),

		// Resend: emails de marca (confirmación de pedido, envío) — ver ARCHITECTURE.md ADR-005
		RESEND_API_KEY: z.string().optional(),
		RESEND_FROM_EMAIL: z.string().optional().default("Lasernex <pedidos@lasernex.es>"),
		// Token compartido para el enlace de "marcar como enviado" (OPERATIONS.md) — no es
		// autenticación de usuarios (ADR-003): un único secreto que solo conoce la dueña.
		SHIP_NOTIFICATION_SECRET: z.string().optional(),
		// Token compartido para el enlace de "refrescar tienda" (OPERATIONS.md) — mismo
		// patrón que SHIP_NOTIFICATION_SECRET, sin cuenta de usuario.
		STORE_REFRESH_SECRET: z.string().optional(),
		// Override opcional del email de aviso interno de "Nuevo pedido" (por
		// defecto, config.contact.email en store.config.ts). Sin esta variable
		// configurada, cambiar ese email exigía que un desarrollador editara el
		// código fuente y redesplegara — con ella, se cambia desde las variables
		// de entorno de Vercel sin tocar código (ver OPERATIONS.md).
		OWNER_NOTIFICATION_EMAIL: z.string().email().optional(),
	},
	client: {
		// Can be provided via env or parameters to Commerce Kit, thus optional
		NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
		NEXT_PUBLIC_URL: z.string().url().optional(),

		NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),

		NEXT_PUBLIC_NEWSLETTER_ENDPOINT: z.string().optional(),

		NEXT_PUBLIC_LANGUAGE: z.string().optional().default("es-ES"),
	},
	runtimeEnv: {
		STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
		STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
		STRIPE_CURRENCY: process.env.STRIPE_CURRENCY,

		NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
		NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
		NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
		NEXT_PUBLIC_NEWSLETTER_ENDPOINT: process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT,

		ENABLE_STRIPE_TAX: process.env.ENABLE_STRIPE_TAX,

		RESEND_API_KEY: process.env.RESEND_API_KEY,
		RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
		SHIP_NOTIFICATION_SECRET: process.env.SHIP_NOTIFICATION_SECRET,
		STORE_REFRESH_SECRET: process.env.STORE_REFRESH_SECRET,
		OWNER_NOTIFICATION_EMAIL: process.env.OWNER_NOTIFICATION_EMAIL,

		NEXT_PUBLIC_LANGUAGE: process.env.NEXT_PUBLIC_LANGUAGE,
	},
});

const vercelHost =
	process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
		? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
		: process.env.NEXT_PUBLIC_VERCEL_URL;
const vercelUrl = vercelHost ? `https://${vercelHost}` : undefined;
const publicUrl = process.env.NEXT_PUBLIC_URL || vercelUrl;

if (!publicUrl) {
	throw new Error("Missing NEXT_PUBLIC_URL or NEXT_PUBLIC_VERCEL_URL variables!");
}

// force type inference to string
const _publicUrl = publicUrl;
export { _publicUrl as publicUrl };

import { OrderConfirmationEmail, type OrderConfirmationEmailProps } from "@/emails/order-confirmation";
import {
	OrderNotificationInternalEmail,
	type OrderNotificationInternalEmailProps,
} from "@/emails/order-notification-internal";
import { OrderShippedEmail, type OrderShippedEmailProps } from "@/emails/order-shipped";
import { env, publicUrl } from "@/env.mjs";
import { Resend } from "resend";

let resendClient: Resend | null = null;

const getResendClient = (): Resend | null => {
	if (!env.RESEND_API_KEY) {
		return null;
	}
	resendClient ??= new Resend(env.RESEND_API_KEY);
	return resendClient;
};

// Idempotencia: Stripe puede reenviar el mismo evento de webhook más de una
// vez (SECURITY.md §2). Resend soporta una Idempotency-Key para no duplicar
// el envío si el mismo pedido dispara el webhook dos veces.
export const sendOrderConfirmationEmail = async (
	to: string,
	props: Omit<OrderConfirmationEmailProps, "storeUrl">,
) => {
	const resend = getResendClient();
	if (!resend) {
		console.warn("RESEND_API_KEY no configurada: email de confirmación NO enviado (solo en local/test)");
		return { skipped: true as const };
	}

	const result = await resend.emails.send(
		{
			from: env.RESEND_FROM_EMAIL,
			to,
			subject: `Confirmación de tu pedido en Lasernex — nº ${props.orderNumber}`,
			react: OrderConfirmationEmail({ ...props, storeUrl: publicUrl }),
		},
		{ idempotencyKey: `order-confirmation-${props.orderNumber}` },
	);
	if (result.error) {
		console.error("Error enviando email de confirmación de pedido", props.orderNumber, result.error);
		return { failed: true as const };
	}
	return result;
};

// Va SOLO a Carla (config.contact.email, resuelto por el llamador en el
// webhook), nunca al cliente: el enlace lleva SHIP_NOTIFICATION_SECRET en claro.
export const sendOrderNotificationEmail = async (
	to: string,
	props: Omit<OrderNotificationInternalEmailProps, "storeUrl">,
) => {
	const resend = getResendClient();
	if (!resend) {
		console.warn("RESEND_API_KEY no configurada: email interno de nuevo pedido NO enviado");
		return { skipped: true as const };
	}

	const result = await resend.emails.send(
		{
			from: env.RESEND_FROM_EMAIL,
			to,
			subject: `Nuevo pedido en Lasernex — nº ${props.orderNumber}`,
			react: OrderNotificationInternalEmail({ ...props, storeUrl: publicUrl }),
		},
		{ idempotencyKey: `order-notification-${props.orderNumber}` },
	);
	if (result.error) {
		console.error("Error enviando email interno de nuevo pedido", props.orderNumber, result.error);
		return { failed: true as const };
	}
	return result;
};

export const sendOrderShippedEmail = async (to: string, props: Omit<OrderShippedEmailProps, "storeUrl">) => {
	const resend = getResendClient();
	if (!resend) {
		console.warn("RESEND_API_KEY no configurada: email de envío NO enviado");
		return { skipped: true as const };
	}

	const result = await resend.emails.send(
		{
			from: env.RESEND_FROM_EMAIL,
			to,
			subject: `Tu pedido ${props.orderNumber} ya está de camino`,
			react: OrderShippedEmail({ ...props, storeUrl: publicUrl }),
		},
		{ idempotencyKey: `order-shipped-${props.orderNumber}-${props.trackingNumber ?? "no-tracking"}` },
	);
	if (result.error) {
		console.error("Error enviando email de pedido enviado", props.orderNumber, result.error);
		return { failed: true as const };
	}
	return result;
};

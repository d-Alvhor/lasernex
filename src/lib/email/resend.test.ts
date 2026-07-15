import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();

vi.mock("resend", () => ({
	Resend: vi.fn().mockImplementation(() => ({
		emails: { send },
	})),
}));

vi.mock("@/env.mjs", () => ({
	env: {
		RESEND_API_KEY: "re_test_key",
		RESEND_FROM_EMAIL: "Lasernex <pedidos@lasernex.es>",
	},
	publicUrl: "https://lasernex.es",
}));

const baseConfirmationProps = {
	orderNumber: "pi_123",
	customerName: "Ana",
	lines: [{ name: "Pieza demo", quantity: 1, unitAmountFormatted: "12,00 €" }],
	totalFormatted: "12,00 €",
	shippingAddress: null,
	hasPersonalization: false,
};

describe("sendOrderConfirmationEmail", () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.resetModules();
		consoleErrorSpy.mockRestore();
	});

	it("si el SDK de Resend devuelve result.error, loguea y devuelve { failed: true }", async () => {
		send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "email inválido" } });
		const { sendOrderConfirmationEmail } = await import("@/lib/email/resend");

		const result = await sendOrderConfirmationEmail("cliente@example.com", baseConfirmationProps);

		expect(result).toEqual({ failed: true });
		expect(consoleErrorSpy).toHaveBeenCalledWith("Error enviando email de confirmación de pedido", "pi_123", {
			name: "validation_error",
			message: "email inválido",
		});
	});

	it("sin RESEND_API_KEY configurada, devuelve { skipped: true } sin llamar al SDK", async () => {
		vi.doMock("@/env.mjs", () => ({
			env: { RESEND_API_KEY: undefined, RESEND_FROM_EMAIL: "Lasernex <pedidos@lasernex.es>" },
			publicUrl: "https://lasernex.es",
		}));
		vi.resetModules();
		const { sendOrderConfirmationEmail } = await import("@/lib/email/resend");

		const result = await sendOrderConfirmationEmail("cliente@example.com", baseConfirmationProps);

		expect(result).toEqual({ skipped: true });
		expect(send).not.toHaveBeenCalled();
	});
});

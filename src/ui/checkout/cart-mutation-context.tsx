"use client";

import { type ReactNode, createContext, use, useCallback, useState } from "react";

// Comparte entre el stepper de cantidad del carrito (cart-items.client.tsx) y
// el botón de pago (stripe-payment.tsx) si hay un cambio de cantidad en
// vuelo: sin esto, un cliente podía pulsar "Pagar" justo tras tocar +/- y
// confirmar el pago con el importe antiguo, porque son componentes
// independientes que no se enteraban el uno del otro.
type CartMutationContextValue = {
	isMutating: boolean;
	runTracked: <T>(fn: () => Promise<T>) => Promise<T>;
};

const CartMutationContext = createContext<CartMutationContextValue | null>(null);

export const CartMutationProvider = ({ children }: { children: ReactNode }) => {
	const [pendingCount, setPendingCount] = useState(0);

	const runTracked = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
		setPendingCount((count) => count + 1);
		try {
			return await fn();
		} finally {
			setPendingCount((count) => count - 1);
		}
	}, []);

	return (
		<CartMutationContext value={{ isMutating: pendingCount > 0, runTracked }}>{children}</CartMutationContext>
	);
};

export const useCartMutation = () => {
	const ctx = use(CartMutationContext);
	if (!ctx) {
		throw new Error("useCartMutation debe usarse dentro de <CartMutationProvider>");
	}
	return ctx;
};

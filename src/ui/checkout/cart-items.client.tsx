import { setQuantity } from "@/actions/cart-actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { useCartMutation } from "@/ui/checkout/cart-mutation-context";
import { useElements } from "@stripe/react-stripe-js";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

export const CartItemQuantity = ({
	quantity,
	productId,
	productName,
	onChange,
}: {
	quantity: number;
	productId: string;
	productName: string;
	onChange: (args: { productId: string; action: "INCREASE" | "DECREASE" }) => void;
}) => {
	const { pending } = useFormStatus();

	type Cycle = {
		timer: ReturnType<typeof setTimeout> | null;
		promise: PromiseWithResolvers<void>;
		// Se pone a true en cuanto arranca la llamada de red (pasado el debounce).
		// Mientras sea false, un clic nuevo puede reutilizar y reprogramar este
		// mismo ciclo (coalesce de clics rápidos en una sola petición). Una vez
		// arrancó, un clic nuevo ya NO lo toca — crea su propio ciclo aparte.
		started: boolean;
	};

	const stateRef = useRef<Cycle | null>(null);

	const isPending = pending && stateRef.current !== null;

	const elements = useElements();
	const router = useRouter();
	const { runTracked } = useCartMutation();

	const formAction = async (action: "INCREASE" | "DECREASE") => {
		onChange({ productId, action });

		// Ojo: opera sobre el `cycle` recibido por parámetro, nunca sobre
		// `stateRef.current` directamente — si un clic posterior ya creó un
		// ciclo NUEVO (ver más abajo), stateRef.current ya no es este cycle, y
		// resolver/limpiar el ciclo equivocado dejaría el nuevo huérfano.
		const doWork = async (cycle: Cycle) => {
			cycle.started = true;
			try {
				const modifier = action === "INCREASE" ? 1 : -1;
				await setQuantity({ productId, quantity: quantity + modifier });
				await elements?.fetchUpdates();
				router.refresh();
				cycle.promise.resolve();
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "No se pudo actualizar la cantidad.", {
					position: "bottom-left",
				});
				cycle.promise.reject(error);
			} finally {
				if (stateRef.current === cycle) {
					stateRef.current = null;
				}
			}
		};

		if (stateRef.current && !stateRef.current.started) {
			// Aún no arrancó la llamada de red de este ciclo: se reutiliza y se
			// reprograma con la acción más reciente (coalesce de clics rápidos
			// dentro de la ventana de debounce), igual que antes.
			const cycle = stateRef.current;
			clearTimeout(cycle.timer ?? undefined);
			cycle.timer = setTimeout(() => doWork(cycle), 400);
			return cycle.promise.promise;
		}

		// No hay ciclo, o el que hay ya arrancó su llamada de red: se crea uno
		// nuevo e independiente. runTracked marca "cantidad en vuelo" (para el
		// botón de Pagar, ver cart-mutation-context.tsx) desde este clic hasta
		// que ESTE ciclo resuelva — si no se creara uno nuevo aquí, un clic que
		// llega mientras la petición anterior sigue en curso se quedaría
		// esperando la promesa de ESA petición, y en cuanto ella terminara
		// "Pagar" se desbloquearía aunque este clic todavía no se hubiera
		// aplicado en Stripe.
		const cycle: Cycle = {
			timer: null,
			promise: Promise.withResolvers(),
			started: false,
		};
		cycle.timer = setTimeout(() => doWork(cycle), 400);
		stateRef.current = cycle;
		return runTracked(() => cycle.promise.promise);
	};

	return (
		<span
			className={clsx(
				"flex flex-row items-center",
				isPending ? "cursor-wait text-foreground/50" : "text-foreground",
			)}
		>
			<Button
				variant="ghost"
				size="sm"
				type="submit"
				disabled={quantity <= 0}
				className="group aspect-square p-0"
				formAction={() => formAction("DECREASE")}
				aria-label={`Disminuir cantidad de ${productName}`}
			>
				<span
					aria-hidden
					className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-100 pb-0.5 font-bold leading-none text-black transition-colors group-hover:bg-neutral-500 group-hover:text-white"
				>
					–
				</span>
			</Button>
			<span className="inline-block min-w-8 px-1 text-center tabular-nums">{quantity}</span>
			<Button
				variant="ghost"
				size="sm"
				type="submit"
				className="group aspect-square p-0"
				formAction={() => formAction("INCREASE")}
				aria-label={`Aumentar cantidad de ${productName}`}
			>
				<span
					aria-hidden
					className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-100 pb-0.5 font-bold leading-none text-black transition-colors group-hover:bg-neutral-500 group-hover:text-white"
				>
					+
				</span>
			</Button>
		</span>
	);
};

// Quitar una línea personalizada del carrito (cantidad fija a 1, sin stepper):
// pone la cantidad a 0 con la acción setQuantity existente.
export const CartItemRemoveButton = ({
	productId,
	productName,
}: {
	productId: string;
	productName: string;
}) => {
	const { pending } = useFormStatus();
	const elements = useElements();
	const router = useRouter();
	const { runTracked } = useCartMutation();

	return (
		<Button
			variant="ghost"
			size="sm"
			type="submit"
			disabled={pending}
			className="h-auto p-0 font-sans text-xs font-normal text-muted-foreground underline underline-offset-2 hover:text-foreground"
			formAction={async () => {
				await runTracked(async () => {
					await setQuantity({ productId, quantity: 0 });
					await elements?.fetchUpdates();
					router.refresh();
				});
			}}
			aria-label={`Quitar ${productName} del carrito`}
		>
			Quitar
		</Button>
	);
};

export const CartItemLineTotal = ({
	currency,
	quantity,
	unitAmount,
	productId,
	locale,
}: {
	unitAmount: number;
	quantity: number;
	currency: string;
	productId: string;
	locale: string;
}) => {
	const { pending, data: formData } = useFormStatus();
	const increaseQuantity = formData?.get("increaseQuantity")?.toString();
	const decreaseQuantity = formData?.get("decreaseQuantity")?.toString();
	const isPending = pending && (increaseQuantity === productId || decreaseQuantity === productId);

	return (
		<span
			className={clsx(
				"whitespace-nowrap tabular-nums",
				isPending ? "cursor-wait text-foreground/50" : "text-foreground",
			)}
		>
			{formatMoney({
				amount: unitAmount * quantity,
				currency,
				locale,
			})}
		</span>
	);
};

export const CartAmountWithSpinner = ({
	total,
	currency,
	locale,
}: { total: number; currency: string; locale: string }) => {
	const { pending } = useFormStatus();

	return (
		<span
			className={clsx(
				"relative tabular-nums",
				pending ? "cursor-wait text-foreground/50" : "text-foreground",
			)}
		>
			{pending && (
				<Loader2 className="absolute -left-[.85rem] top-[.1rem] inline-block size-3 animate-spin text-foreground" />
			)}
			{formatMoney({
				amount: total,
				currency,
				locale,
			})}
		</span>
	);
};

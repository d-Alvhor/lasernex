"use client";
import { addToCartAction } from "@/actions/cart-actions";
import { Button } from "@/components/ui/button";
import { useCartModal } from "@/context/cart-modal";
import { useTranslations } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { useTransition } from "react";

export const AddToCartButton = ({
	productId,
	disabled,
	className,
	personalization,
	blockSubmit,
	onBlockedSubmit,
	id,
}: {
	productId: string;
	disabled?: boolean;
	className?: string;
	personalization?: string;
	/** Bloquea el envío (p.ej. falta texto de personalización) sin cambiar el
	 * texto del botón a "Agotado" — eso es solo para disabled (sin stock). */
	blockSubmit?: boolean;
	/** Se llama al pulsar con blockSubmit activo (p.ej. para enfocar el campo que falta). */
	onBlockedSubmit?: () => void;
	/** Solo la ficha principal pasa "button-add-to-cart" (lo observa el
	 * IntersectionObserver de StickyBottom); la sticky card no lleva id. */
	id?: string;
}) => {
	const t = useTranslations("Global.addToCart");
	const [pending, startTransition] = useTransition();
	const isDisabled = disabled || blockSubmit || pending;
	const { setOpen } = useCartModal();

	return (
		<Button
			id={id}
			size="lg"
			type="submit"
			className={cn("rounded-full text-lg relative", className)}
			onClick={async (e) => {
				if (isDisabled) {
					e.preventDefault();
					if (blockSubmit && !disabled && !pending) {
						onBlockedSubmit?.();
					}
					return;
				}

				setOpen(true);

				startTransition(async () => {
					const formData = new FormData();
					formData.append("productId", productId);
					if (personalization) {
						formData.append("personalization", personalization);
					}
					await addToCartAction(formData);
				});
			}}
			aria-disabled={isDisabled}
		>
			<span className={cn("transition-opacity ease-in", pending ? "opacity-0" : "opacity-100")}>
				{disabled ? t("disabled") : t("actionButton")}
			</span>
			<span
				className={cn(
					"ease-out transition-opacity pointer-events-none absolute z-10",
					pending ? "opacity-100" : "opacity-0",
				)}
			>
				<Loader2Icon className="h-4 w-4 animate-spin" />
			</span>
		</Button>
	);
};

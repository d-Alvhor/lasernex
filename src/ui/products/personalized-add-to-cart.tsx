"use client";
import { AddToCartButton } from "@/ui/add-to-cart-button";
import { YnsLink } from "@/ui/yns-link";
import { useRef, useState } from "react";

const MAX_LENGTH = 40;
// Fijo (no useId): la tarjeta flotante inferior (product-bottom-sticky-card)
// necesita apuntar a este mismo id con un enlace #ancla; solo hay un
// producto por página, así que un id estático no colisiona.
export const PERSONALIZATION_INPUT_ID = "personalization-input";

// Campo de personalización para productos que lo necesitan (metadata.preview
// en Stripe hace de etiqueta, ver OPERATIONS.md). El botón de añadir al
// carrito no se activa hasta que hay texto — igual que en Etsy/Shopify: nunca
// debe llegar un pedido personalizado sin el dato para fabricarlo.
export const PersonalizedAddToCart = ({
	productId,
	label,
	disabled,
}: {
	productId: string;
	label: string;
	disabled?: boolean;
}) => {
	const [text, setText] = useState("");
	const [showError, setShowError] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const trimmed = text.trim();

	return (
		<div className="flex flex-col gap-3">
			<div>
				<label
					htmlFor={PERSONALIZATION_INPUT_ID}
					className="block font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
				>
					{label}
				</label>
				<input
					ref={inputRef}
					id={PERSONALIZATION_INPUT_ID}
					type="text"
					required
					value={text}
					onChange={(e) => {
						setText(e.target.value.slice(0, MAX_LENGTH));
						if (e.target.value.trim().length > 0) {
							setShowError(false);
						}
					}}
					maxLength={MAX_LENGTH}
					placeholder="Escribe aquí el texto"
					className="mt-1.5 h-11 w-full rounded border border-border bg-background px-3 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
					aria-describedby={`${PERSONALIZATION_INPUT_ID}-count`}
					aria-invalid={showError ? "true" : undefined}
				/>
				{showError && (
					<p role="alert" className="mt-1 font-sans text-sm text-destructive">
						Escribe el texto que quieres grabar antes de añadir al carrito.
					</p>
				)}
				<p
					id={`${PERSONALIZATION_INPUT_ID}-count`}
					aria-live="polite"
					className="mt-1 text-right font-sans text-[11px] text-muted-foreground"
				>
					{text.length}/{MAX_LENGTH}
				</p>
				<p className="mt-1 font-sans text-xs text-muted-foreground">
					Producto personalizado:{" "}
					<YnsLink href="/legal/desistimiento" className="underline underline-offset-2">
						sin derecho de desistimiento
					</YnsLink>
				</p>
			</div>
			<AddToCartButton
				id="button-add-to-cart"
				productId={productId}
				disabled={disabled}
				blockSubmit={trimmed.length === 0}
				onBlockedSubmit={() => {
					setShowError(true);
					inputRef.current?.focus();
				}}
				personalization={trimmed}
			/>
		</div>
	);
};

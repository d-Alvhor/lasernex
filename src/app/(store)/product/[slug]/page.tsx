import { getCartFromCookiesAction } from "@/actions/cart-actions";
import { ProductImageModal } from "@/app/(store)/product/[slug]/product-image-modal";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { publicUrl } from "@/env.mjs";
import { getLocale, getTranslations } from "@/i18n/server";
import { cn, deslugify, formatMoney, formatProductName } from "@/lib/utils";
import { AddToCartButton } from "@/ui/add-to-cart-button";
import { JsonLd, mappedProductToJsonLd } from "@/ui/json-ld";
import { Markdown } from "@/ui/markdown";
import { MainProductImage } from "@/ui/products/main-product-image";
import { PersonalizedAddToCart } from "@/ui/products/personalized-add-to-cart";
import { ProductPlacard } from "@/ui/products/product-placard";
import { StickyBottom } from "@/ui/sticky-bottom";
import { YnsLink } from "@/ui/yns-link";
import * as Commerce from "commerce-kit";
import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { Suspense } from "react";

export const generateMetadata = async (props: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ variant?: string }>;
}): Promise<Metadata> => {
	const searchParams = await props.searchParams;
	const params = await props.params;
	const variants = await Commerce.productGet({ slug: params.slug });

	const selectedVariant = searchParams.variant || variants[0]?.metadata.variant;
	const product = variants.find((variant) => variant.metadata.variant === selectedVariant);
	if (!product) {
		return notFound();
	}
	const t = await getTranslations("/product.metadata");

	const canonical = new URL(`${publicUrl}/product/${product.metadata.slug}`);
	if (selectedVariant) {
		canonical.searchParams.set("variant", selectedVariant);
	}

	const productName = formatProductName(product.name, product.metadata.variant);

	return {
		title: t("title", { productName }),
		description: product.description,
		alternates: { canonical },
	} satisfies Metadata;
};

function extractMeasure(name: string): string | null {
	const m = name.match(/(\d+(?:[.,]\d+)?)\s?(cm|mm)\b/i);
	const num = m?.[1];
	const unit = m?.[2];
	if (!num || !unit) return null;
	return `${num.replace(".", ",")} ${unit.toLowerCase()}`;
}

export default async function SingleProductPage(props: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ variant?: string; image?: string }>;
}) {
	const params = await props.params;
	const searchParams = await props.searchParams;

	const variants = await Commerce.productGet({ slug: params.slug });
	const selectedVariant = (variants.length > 1 && searchParams.variant) || variants[0]?.metadata.variant;
	const product = variants.find((variant) => variant.metadata.variant === selectedVariant);

	if (!product) {
		return notFound();
	}

	const t = await getTranslations("/product.page");
	const locale = await getLocale();

	const category = product.metadata.category;
	const images = product.images;
	const measure = extractMeasure(product.name);

	// Personalización (nombre para grabar, etc.): reutiliza metadata.preview
	// como etiqueta, ver OPERATIONS.md. Cantidad fija a 1 por texto — si ya
	// hay una unidad en el carrito, no se puede añadir otra con un texto
	// distinto sin terminar antes ese pedido (mismo patrón que Etsy).
	const personalizationLabel = product.metadata.preview || null;
	let alreadyPersonalizedInCart = false;
	if (personalizationLabel) {
		const cart = await getCartFromCookiesAction();
		const existingLine = cart?.lines.find((line) => line.product.id === product.id);
		alreadyPersonalizedInCart = Boolean(existingLine && existingLine.quantity > 0);
	}
	const priceFormatted = product.default_price.unit_amount
		? formatMoney({
				amount: product.default_price.unit_amount,
				currency: product.default_price.currency,
				locale,
			})
		: null;

	const ficha: { label: string; value: string }[] = [
		{ label: "Fabricación", value: "Impresión 3D (FDM), bajo demanda" },
		{ label: "Material", value: "PLA / PETG (según pieza)" },
		{ label: "Acabado", value: "Mate, con finas líneas de capa" },
		...(measure ? [{ label: "Medidas", value: measure }] : []),
		...(category ? [{ label: "Categoría", value: deslugify(category) }] : []),
	];

	return (
		<article className="py-8">
			<Breadcrumb>
				<BreadcrumbList className="font-sans text-[11px] uppercase tracking-[0.14em]">
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<YnsLink href="/products">{t("allProducts")}</YnsLink>
						</BreadcrumbLink>
					</BreadcrumbItem>
					{category && (
						<>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<YnsLink href={`/category/${category}`}>{deslugify(category)}</YnsLink>
								</BreadcrumbLink>
							</BreadcrumbItem>
						</>
					)}
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{product.name}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<StickyBottom
				product={product}
				locale={locale}
				personalizationLabel={personalizationLabel}
				alreadyPersonalizedInCart={alreadyPersonalizedInCart}
			>
				<div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
					{/* IZQUIERDA — visual: fotos si existen, si no la placa generativa XL */}
					<div className="lg:sticky lg:top-24 lg:self-start">
						<h2 className="sr-only">{t("imagesTitle")}</h2>
						{images.length > 0 ? (
							<MainProductImage
								className="w-full bg-muted object-cover object-center"
								src={images[0] as string}
								loading="eager"
								priority
								alt={[product.name, category ? deslugify(category) : null, measure]
									.filter(Boolean)
									.join(", ")}
							/>
						) : (
							<ProductPlacard product={product} ratio="aspect-[4/5]" variant="feature" />
						)}
					</div>

					{/* DERECHA — ficha */}
					<div className="flex flex-col gap-8 lg:pl-[3vw]">
						<div>
							<h1 className="font-serif text-[clamp(2rem,4vw,3.25rem)] font-normal leading-[1.05] text-foreground">
								{product.name}
							</h1>
							{priceFormatted && (
								<p className="mt-3 font-serif text-2xl tabular-nums text-foreground/80">{priceFormatted}</p>
							)}
						</div>

						{product.description && (
							<section>
								<h2 className="sr-only">{t("descriptionTitle")}</h2>
								<div className="prose prose-neutral max-w-[60ch] font-sans text-muted-foreground">
									<Markdown source={product.description} />
								</div>
							</section>
						)}

						{variants.length > 1 && (
							<div className="grid gap-2">
								<p
									className="font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
									id="variant-label"
								>
									{t("variantTitle")}
								</p>
								<ul role="list" className="flex flex-wrap gap-2" aria-labelledby="variant-label">
									{variants.map((variant) => {
										const isSelected = selectedVariant === variant.metadata.variant;
										return (
											variant.metadata.variant && (
												<li key={variant.id}>
													<YnsLink
														scroll={false}
														prefetch={true}
														href={`/product/${variant.metadata.slug}?variant=${variant.metadata.variant}`}
														className={cn(
															"flex min-h-11 cursor-pointer items-center justify-center rounded border border-border px-4 font-sans text-sm transition-colors hover:border-foreground/50",
															isSelected && "border-foreground bg-secondary font-medium",
														)}
														aria-selected={isSelected}
													>
														{deslugify(variant.metadata.variant)}
													</YnsLink>
												</li>
											)
										);
									})}
								</ul>
							</div>
						)}

						{/* Ficha técnica — el héroe honesto que sustituye a la foto */}
						<dl className="border-t border-border">
							{ficha.map((row) => (
								<div key={row.label} className="flex justify-between gap-4 border-b border-border py-3">
									<dt className="font-sans text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
										{row.label}
									</dt>
									<dd className="text-right font-sans text-sm text-foreground">{row.value}</dd>
								</div>
							))}
						</dl>

						{product.metadata.stock <= 0 && (
							<p className="font-sans text-sm text-destructive">Agotado temporalmente</p>
						)}
						{personalizationLabel ? (
							alreadyPersonalizedInCart ? (
								<p className="rounded border border-border bg-secondary/40 p-4 font-sans text-sm text-muted-foreground">
									Ya tienes esta pieza personalizada en tu carrito. Si quieres otra con un texto distinto,
									termina este pedido primero y haz una compra aparte.{" "}
									<YnsLink href="/cart" className="link-wipe font-medium text-foreground">
										Ver carrito
									</YnsLink>
								</p>
							) : (
								<PersonalizedAddToCart
									productId={product.id}
									label={personalizationLabel}
									disabled={product.metadata.stock <= 0}
								/>
							)
						) : (
							<AddToCartButton productId={product.id} disabled={product.metadata.stock <= 0} />
						)}

						{/* Nota de confianza con punto clay */}
						<p className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
							<span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
							Impreso y preparado por Carla · 3-5 días · Envío península
						</p>
					</div>
				</div>
			</StickyBottom>

			<Suspense>
				<ProductImageModal images={images} />
			</Suspense>

			<JsonLd jsonLd={mappedProductToJsonLd(product)} />
		</article>
	);
}

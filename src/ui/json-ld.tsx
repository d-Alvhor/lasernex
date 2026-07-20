import { publicUrl } from "@/env.mjs";
import { formatProductName } from "@/lib/utils";
import type * as Commerce from "commerce-kit";
import { getDecimalFromStripeAmount } from "commerce-kit/currencies";
import type { ItemList, Product, Thing, WebSite, WithContext } from "schema-dts";
import type Stripe from "stripe";

export const JsonLd = <T extends Thing>({ jsonLd }: { jsonLd: WithContext<T> }) => {
	// Escapa "<" para que un texto de Stripe (nombre/descripción de producto) no pueda
	// cerrar este <script> e inyectar HTML/JS (único dangerouslySetInnerHTML del proyecto,
	// ver SECURITY.md/SEO.md).
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
		/>
	);
};

export const mappedProductToJsonLd = (product: Commerce.MappedProduct): WithContext<Product> => {
	const productName = formatProductName(product.name, product.metadata.variant);
	// unit_amount es null en precios de "importe personalizado" de Stripe — la
	// propia página ya trata ese caso como "sin precio fijo" (no muestra nada),
	// así que el JSON-LD debe omitir price/priceCurrency en vez de mentir con 0€.
	const hasFixedPrice = product.default_price.unit_amount != null;

	return {
		"@context": "https://schema.org",
		"@type": "Product",
		name: productName,
		image: product.images[0],
		description: product.description ?? undefined,
		sku: product.id,
		brand: { "@type": "Brand", name: "Lasernex" },
		offers: {
			"@type": "Offer",
			url: `${publicUrl}/product/${product.metadata.slug}`,
			...(hasFixedPrice && {
				price: getDecimalFromStripeAmount({
					amount: product.default_price.unit_amount ?? 0,
					currency: product.default_price.currency,
				}),
				priceCurrency: product.default_price.currency,
			}),
			availability:
				product.metadata.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
			// Envío a península y devolución de 14 días: política única de la tienda,
			// igual para todos los productos (ver /legal/desistimiento y /legal/condiciones).
			shippingDetails: {
				"@type": "OfferShippingDetails",
				shippingDestination: { "@type": "DefinedRegion", addressCountry: "ES" },
			},
			hasMerchantReturnPolicy: {
				"@type": "MerchantReturnPolicy",
				applicableCountry: "ES",
				returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
				merchantReturnDays: 14,
				returnMethod: "https://schema.org/ReturnByMail",
				returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
			},
		},
	};
};

export const mappedProductsToJsonLd = (
	products: readonly Commerce.MappedProduct[],
): WithContext<ItemList> => {
	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		itemListElement: products.map(mappedProductToJsonLd),
	};
};

export const accountToWebsiteJsonLd = ({
	account,
	logoUrl,
}: {
	account: Stripe.Account | null | undefined;
	logoUrl: string | null | undefined;
}): WithContext<WebSite> => {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: account?.business_profile?.name ?? "Lasernex",
		url: account?.business_profile?.url ?? "https://lasernex.es",
		mainEntityOfPage: {
			"@type": "WebPage",
			url: account?.business_profile?.url ?? "https://lasernex.es",
		},
		...(logoUrl && {
			image: {
				"@type": "ImageObject",
				url: logoUrl,
			},
		}),
		publisher: {
			"@type": "Organization",
			name: account?.business_profile?.name ?? "Lasernex",
			url: account?.business_profile?.url ?? "https://lasernex.es",
		},
	};
};

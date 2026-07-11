import { getLocale } from "@/i18n/server";
import { formatMoney } from "@/lib/utils";
import { JsonLd, mappedProductsToJsonLd } from "@/ui/json-ld";
import { ProductPlacard } from "@/ui/products/product-placard";
import { YnsLink } from "@/ui/yns-link";
import type * as Commerce from "commerce-kit";

export const ProductList = async ({ products }: { products: Commerce.MappedProduct[] }) => {
	const locale = await getLocale();

	return (
		<>
			{/* Retícula de galería: tarjetas con filete propio, se ve bien con cualquier nº de piezas */}
			<ul className="grid grid-cols-2 gap-4 smb:grid-cols-3 sm:gap-5 lg:grid-cols-4">
				{products.map((product) => {
					const priceFormatted = product.default_price.unit_amount
						? formatMoney({
								amount: product.default_price.unit_amount,
								currency: product.default_price.currency,
								locale,
							})
						: null;
					return (
						<li key={product.id} className="group">
							<YnsLink href={`/product/${product.metadata.slug}`} className="block">
								<ProductPlacard product={product} priceFormatted={priceFormatted} />
							</YnsLink>
						</li>
					);
				})}
			</ul>
			<JsonLd jsonLd={mappedProductsToJsonLd(products)} />
		</>
	);
};

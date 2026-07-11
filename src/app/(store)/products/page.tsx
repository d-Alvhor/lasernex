import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { ProductList } from "@/ui/products/product-list";
import * as Commerce from "commerce-kit";
import type { Metadata } from "next/types";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("/products.metadata");
	return {
		title: t("title"),
		alternates: { canonical: `${publicUrl}/products` },
	};
};

export default async function AllProductsPage() {
	const products = await Commerce.productBrowse({ first: 100 });
	const t = await getTranslations("/products.page");

	return (
		<main className="pb-8">
			<h1 className="font-serif text-3xl font-normal leading-tight text-foreground my-6">{t("title")}</h1>
			<ProductList products={products} />
		</main>
	);
}

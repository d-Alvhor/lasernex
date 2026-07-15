import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { deslugify } from "@/lib/utils";
import { ProductList } from "@/ui/products/product-list";
import * as Commerce from "commerce-kit";
import { notFound } from "next/navigation";
import type { Metadata } from "next/types";

export const generateMetadata = async (props: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
	const params = await props.params;
	const products = await Commerce.productBrowse({
		first: 100,
		filter: { category: params.slug },
	});

	if (products.length === 0) {
		return notFound();
	}

	const t = await getTranslations("/category.metadata");

	return {
		title: t("title", { categoryName: deslugify(params.slug) }),
		alternates: { canonical: `${publicUrl}/category/${params.slug}` },
	};
};

export default async function CategoryPage(props: {
	params: Promise<{ slug: string }>;
}) {
	const params = await props.params;
	const products = await Commerce.productBrowse({
		first: 100,
		filter: { category: params.slug },
	});

	if (products.length === 0) {
		return notFound();
	}

	const t = await getTranslations("/category.page");

	return (
		<div className="pb-8">
			<h1 className="font-serif text-3xl font-normal leading-tight text-foreground my-6">
				{deslugify(params.slug)}
				<span className="block text-lg font-semibold text-muted-foreground">{t("title")}</span>
			</h1>
			<ProductList products={products} />
		</div>
	);
}

import { publicUrl } from "@/env.mjs";
import * as Commerce from "commerce-kit";
import type { MetadataRoute } from "next";

type Item = MetadataRoute.Sitemap[number];
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const products = await Commerce.productBrowse({ first: 100 });
	const productUrls = products.map(
		(product) =>
			({
				url: `${publicUrl}/product/${product.metadata.slug}`,
				lastModified: new Date(product.updated * 1000),
				changeFrequency: "daily",
				priority: 0.8,
			}) satisfies Item,
	);

	// Categorías en vivo desde Stripe (metadata.category) — ver nav-menu.tsx.
	const categories = await Commerce.categoryBrowse();
	const categoryUrls = categories.map(
		(slug) =>
			({
				url: `${publicUrl}/category/${slug}`,
				lastModified: new Date(),
				changeFrequency: "daily",
				priority: 0.5,
			}) satisfies Item,
	);

	const staticPages = [
		"/sobre-nosotros",
		"/como-se-fabrican",
		"/legal/aviso-legal",
		"/legal/privacidad",
		"/legal/cookies",
		"/legal/condiciones",
		"/legal/desistimiento",
	].map(
		(path) =>
			({
				url: `${publicUrl}${path}`,
				lastModified: new Date(),
				changeFrequency: "monthly",
				priority: 0.3,
			}) satisfies Item,
	);

	return [
		{
			url: publicUrl,
			lastModified: new Date(),
			changeFrequency: "always",
			priority: 1,
		},
		...productUrls,
		...categoryUrls,
		...staticPages,
	];
}

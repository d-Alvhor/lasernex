import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { ProductList } from "@/ui/products/product-list";
import { YnsLink } from "@/ui/yns-link";
import * as Commerce from "commerce-kit";
import type { Metadata } from "next/types";

export const metadata = {
	alternates: { canonical: publicUrl },
} satisfies Metadata;

export default async function Home() {
	const products = await Commerce.productBrowse({ first: 6 });
	const t = await getTranslations("/");

	return (
		<main>
			{/* Hero tipográfico: sin foto de producto hasta que haya
			    fotografía real de catálogo (ver ROADMAP.md Fase 2) */}
			<section className="rounded bg-neutral-950 py-16 sm:py-24">
				<div className="mx-auto max-w-2xl space-y-4 px-8 text-center sm:px-16">
					<h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-5xl">
						{t("hero.title")}
					</h2>
					<p className="text-pretty text-neutral-400">{t("hero.description")}</p>
					<YnsLink
						className="inline-flex h-10 items-center justify-center rounded-full bg-white px-6 font-medium text-neutral-900 transition-colors hover:bg-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-neutral-50"
						href={t("hero.link")}
					>
						{t("hero.action")}
					</YnsLink>
				</div>
			</section>

			<ProductList products={products} />
		</main>
	);
}

import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { ProductList } from "@/ui/products/product-list";
import { YnsLink } from "@/ui/yns-link";
import * as Commerce from "commerce-kit";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next/types";

export const metadata = {
	alternates: { canonical: publicUrl },
} satisfies Metadata;

export default async function Home() {
	const products = await Commerce.productBrowse({ first: 8 });
	const t = await getTranslations("/");

	return (
		<>
			{/* ── Hero editorial "Sala Blanca": sobre el papel cálido de la página, sin caja ── */}
			<section className="relative overflow-hidden border-b border-border">
				{/* Arte generativo: dígito 7 gigante en el tercio derecho sobre textura de línea de capa */}
				<div aria-hidden className="pointer-events-none absolute inset-0">
					<div className="layer-lines absolute inset-0 opacity-40" />
					<span className="absolute -right-16 top-1/2 hidden -translate-y-1/2 select-none font-serif text-[30rem] leading-none text-foreground/[0.05] lg:block">
						7
					</span>
				</div>

				<div className="relative flex min-h-[54vh] flex-col justify-center py-16 md:py-20">
					<p className="font-sans text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
						Lasernex · Fabricación aditiva bajo demanda
					</p>
					<h1 className="mt-6 max-w-[15ch] text-balance font-serif text-[clamp(2.5rem,7vw,5rem)] font-normal leading-[1.03] text-foreground">
						{t("hero.title")}
					</h1>
					<p className="mt-6 max-w-[46ch] text-pretty font-sans text-base text-muted-foreground">
						{t("hero.description")}
					</p>

					<div className="mt-10 h-px w-16 bg-border" />

					<YnsLink
						href={t("hero.link")}
						className="link-wipe mt-6 inline-flex w-fit items-center gap-2 font-sans text-sm font-medium text-foreground"
					>
						{t("hero.action")}
						<ArrowRight className="h-4 w-4" />
					</YnsLink>

					<p className="mt-10 font-sans text-[13px] font-medium text-muted-foreground">
						Fabricación bajo demanda <span className="mx-1.5 text-border">·</span> Envío 24-48 h península{" "}
						<span className="mx-1.5 text-border">·</span> Te atiende Carla
					</p>
				</div>
			</section>

			{/* ── Catálogo ─────────────────────────────────────────────── */}
			<section className="py-16">
				<div className="mb-8 flex items-end justify-between border-b border-border pb-4">
					<h2 className="font-serif text-2xl font-normal text-foreground">Catálogo</h2>
					<span className="font-sans text-sm text-muted-foreground">
						{products.length} {products.length === 1 ? "pieza" : "piezas"}
					</span>
				</div>
				<ProductList products={products} />
			</section>
		</>
	);
}

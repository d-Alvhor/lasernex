import { getTranslations } from "@/i18n/server";
import StoreConfig from "@/store.config";
import { Newsletter } from "@/ui/footer/newsletter.client";
import { YnsLink } from "@/ui/yns-link";

const legalLinks = [
	{ label: "Aviso legal", href: "/legal/aviso-legal" },
	{ label: "Privacidad", href: "/legal/privacidad" },
	{ label: "Cookies", href: "/legal/cookies" },
	{ label: "Condiciones de venta", href: "/legal/condiciones" },
	{ label: "Desistimiento", href: "/legal/desistimiento" },
];

const sections = [
	{
		header: "Productos",
		links: StoreConfig.categories.map(({ name, slug }) => ({
			label: name,
			href: `/category/${slug}`,
		})),
	},
	{
		header: "Sobre Lasernex",
		links: [
			{ label: "Sobre nosotros", href: "/sobre-nosotros" },
			{ label: "Cómo se fabrican", href: "/como-se-fabrican" },
			{ label: "Contacto", href: `mailto:${StoreConfig.contact.email}` },
		],
	},
	{
		header: "Legal",
		links: legalLinks,
	},
];

export async function Footer() {
	const t = await getTranslations("Global.footer");

	return (
		<footer className="w-full bg-neutral-50 p-6 text-neutral-800 md:py-12">
			<div className="container flex max-w-7xl flex-row flex-wrap justify-center gap-16 text-sm sm:justify-between">
				<div className="">
					<div className="flex w-full max-w-sm flex-col gap-2">
						<h3 className="font-semibold">{t("newsletterTitle")}</h3>
						<Newsletter />
					</div>
				</div>

				<nav className="grid grid-cols-2 gap-16 sm:grid-cols-3">
					{sections.map((section) => (
						<section key={section.header}>
							<h3 className="mb-2 font-semibold">{section.header}</h3>
							<ul role="list" className="grid gap-1">
								{section.links.map((link) => (
									<li key={link.label}>
										<YnsLink className="underline-offset-4 hover:underline" href={link.href}>
											{link.label}
										</YnsLink>
									</li>
								))}
							</ul>
						</section>
					))}
				</nav>
			</div>
			<div className="container mt-8 flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-neutral-500 md:flex-row">
				<div>
					<p>© {new Date().getFullYear()} Lasernex</p>
					<p>Piezas impresas en 3D, fabricadas en España</p>
				</div>
			</div>
		</footer>
	);
}

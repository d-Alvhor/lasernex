import StoreConfig from "@/store.config";
import { Newsletter } from "@/ui/footer/newsletter.client";
import { ThemeToggle } from "@/ui/theme-toggle";
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
	return (
		// La sala en negativo: footer en tinta (bg-primary) con texto papel.
		<footer className="mt-8 w-full bg-primary text-primary-foreground">
			<div className="mx-auto max-w-[1400px] px-4 pt-16 pb-10 sm:px-6 lg:px-8">
				{/* Wordmark grande */}
				<p className="font-sans text-[clamp(2rem,6vw,4rem)] font-light uppercase leading-none tracking-[0.3em] text-primary-foreground/90">
					Lasernex
				</p>

				{/* Divisor de líneas de capa FDM (firma de marca) */}
				<div
					aria-hidden
					className="mt-8 h-6 w-full opacity-40"
					style={{
						backgroundImage:
							"repeating-linear-gradient(to bottom, hsl(var(--primary-foreground) / 0.5) 0, hsl(var(--primary-foreground) / 0.5) 1px, transparent 1px, transparent 6px)",
					}}
				/>

				<div className="mt-12 grid gap-12 md:grid-cols-[1.4fr_2fr]">
					{/* Newsletter */}
					<div className="max-w-sm">
						<h3 className="font-serif text-xl font-normal">Novedades del taller</h3>
						<p className="mt-2 font-sans text-sm text-primary-foreground/60">
							Nuevas piezas y ediciones, sin spam.
						</p>
						<div className="mt-4">
							<Newsletter />
						</div>
					</div>

					{/* Secciones */}
					<nav className="grid grid-cols-2 gap-8 sm:grid-cols-3">
						{sections.map((section) => (
							<section key={section.header}>
								<h3 className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground/50">
									{section.header}
								</h3>
								<ul role="list" className="mt-4 grid gap-2.5">
									{section.links.map((link) => (
										<li key={link.label}>
											<YnsLink
												className="link-wipe font-sans text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
												href={link.href}
											>
												{link.label}
											</YnsLink>
										</li>
									))}
								</ul>
							</section>
						))}
					</nav>
				</div>

				{/* Barra final */}
				<div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-primary-foreground/15 pt-6 font-sans text-xs text-primary-foreground/55 md:flex-row md:items-center">
					<div className="flex items-center gap-4">
						<span>© {new Date().getFullYear()} Lasernex</span>
						<span aria-hidden>·</span>
						<span>Hecho en España · Envío a península</span>
					</div>
					<div className="flex items-center gap-5">
						{/* Cumplimiento AGPL-3.0 §13: oferta prominente del código fuente (ADR-007) */}
						<YnsLink
							className="link-wipe hover:text-primary-foreground"
							href="https://github.com/d-Alvhor/lasernex"
							target="_blank"
						>
							Software libre · AGPL-3.0
						</YnsLink>
						<ThemeToggle className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground" />
					</div>
				</div>
			</div>
		</footer>
	);
}

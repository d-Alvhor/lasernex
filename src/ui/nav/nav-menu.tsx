import { deslugify } from "@/lib/utils";
import { NavMobileMenu } from "@/ui/nav/nav-mobile-menu.client";
import * as Commerce from "commerce-kit";
import Link from "next/link";

export const NavMenu = async () => {
	// Categorías leídas en vivo de Stripe (metadata.category de los productos activos):
	// una categoría nueva aparece sola en el menú en cuanto exista un producto con ella,
	// sin tocar código ni redeploy.
	const categories = (await Commerce.categoryBrowse()).sort((a, b) => a.localeCompare(b, "es"));
	const links = [
		{ label: "Inicio", href: "/" },
		...categories.map((slug) => ({ label: deslugify(slug), href: `/category/${encodeURIComponent(slug)}` })),
	];

	return (
		<>
			<div className="hidden sm:block">
				<ul className="flex flex-row items-center gap-x-6">
					{links.map((link) => (
						<li key={link.href}>
							<Link
								href={link.href}
								className="link-wipe inline-flex py-2 font-sans text-[13px] text-muted-foreground transition-colors hover:text-foreground"
							>
								{link.label}
							</Link>
						</li>
					))}
				</ul>
			</div>
			<div className="flex items-center sm:hidden">
				<NavMobileMenu>
					<ul className="flex flex-col items-stretch gap-y-1 px-6 pb-10">
						{links.map((link) => (
							<li key={link.href}>
								<Link
									href={link.href}
									className="link-wipe inline-flex w-fit py-3 font-serif text-2xl text-foreground"
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</NavMobileMenu>
			</div>
		</>
	);
};

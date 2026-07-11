import StoreConfig from "@/store.config";
import { NavMobileMenu } from "@/ui/nav/nav-mobile-menu.client";
import Link from "next/link";

const links = [
	{
		label: "Inicio",
		href: "/",
	},
	...StoreConfig.categories.map(({ name, slug }) => ({
		label: name,
		href: `/category/${slug}`,
	})),
];

export const NavMenu = () => {
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

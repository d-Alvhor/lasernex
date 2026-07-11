import { CartSummaryNav } from "@/ui/nav/cart-summary-nav";
import { NavMenu } from "@/ui/nav/nav-menu";
import { SearchNav } from "@/ui/nav/search-nav";
import { SeoH1 } from "@/ui/seo-h1";
import { YnsLink } from "@/ui/yns-link";

export const Nav = async () => {
	return (
		<header className="nav-border-reveal sticky top-0 z-50 bg-background/85 py-4 backdrop-blur-md">
			<div className="mx-auto flex max-w-[1400px] flex-row items-center gap-2 px-4 sm:px-6 lg:px-8">
				<YnsLink href="/" aria-label="Lasernex, inicio">
					<SeoH1 className="whitespace-nowrap font-sans text-sm font-light uppercase tracking-[0.35em] text-foreground">
						LASERNEX
					</SeoH1>
				</YnsLink>

				<div className="ml-8 flex w-auto shrink-0 max-sm:order-2 max-sm:ml-0 sm:mr-auto">
					<NavMenu />
				</div>
				<div className="mr-2 ml-auto sm:ml-0">
					<SearchNav />
				</div>
				<CartSummaryNav />
			</div>
		</header>
	);
};

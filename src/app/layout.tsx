import "@/app/globals.css";
import { fraunces, hanken } from "@/app/fonts";
import { Toaster } from "@/components/ui/sonner";
import { env, publicUrl } from "@/env.mjs";
import { IntlClientProvider } from "@/i18n/client";
import { getLocale, getMessages, getTranslations } from "@/i18n/server";
import { ThemeProvider } from "@/ui/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import Script from "next/script";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("Global.metadata");
	return {
		title: t("title"),
		description: t("description"),
		metadataBase: new URL(publicUrl),
	};
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html
			lang={locale}
			className={`h-full antialiased ${fraunces.variable} ${hanken.variable}`}
			suppressHydrationWarning
		>
			<body className="flex min-h-full flex-col bg-background font-sans text-foreground">
				<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
					<IntlClientProvider messages={messages} locale={locale}>
						<div className="flex min-h-full flex-1 flex-col bg-background" vaul-drawer-wrapper="">
							{children}
						</div>
						<Toaster position="top-center" offset={10} />
					</IntlClientProvider>
				</ThemeProvider>
				{env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
					<Script
						async
						src="/stats/script.js"
						data-host-url={publicUrl + "/stats"}
						data-website-id={env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
					/>
				)}
				<SpeedInsights />
				<Analytics />
			</body>
		</html>
	);
}

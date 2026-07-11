import MDX from "@next/mdx";
import type { NextConfig } from "next/types";

const withMDX = MDX();

// Cabeceras de seguridad — ver SECURITY.md §1. Importante: el checkout usa
// Stripe Elements EMBEBIDO (ADR-002 en ARCHITECTURE.md), no una redirección
// a checkout.stripe.com, así que la CSP necesita permitir explícitamente
// los scripts/iframes/llamadas de Stripe.js.
const securityHeaders = [
	{
		key: "Content-Security-Policy",
		value: [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' https://js.stripe.com",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' https://files.stripe.com https://*.stripe.com https://*.blob.vercel-storage.com data: blob:",
			"font-src 'self'",
			// Umami (analítica opcional) se sirve vía rewrite en /stats/* → mismo origen, no hace falta añadirlo aquí
			"connect-src 'self' https://api.stripe.com",
			"frame-src https://js.stripe.com https://hooks.stripe.com",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'",
			"upgrade-insecure-requests",
		].join("; "),
	},
	{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

const nextConfig: NextConfig = {
	reactStrictMode: true,
	output: process.env.DOCKER ? "standalone" : undefined,
	headers: async () => [
		{
			source: "/:path*",
			headers: securityHeaders,
		},
	],
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	images: {
		remotePatterns: [
			{ hostname: "files.stripe.com" },
			{ hostname: "d1wqzb5bdbcre6.cloudfront.net" },
			{ hostname: "*.blob.vercel-storage.com" },
		],
		formats: ["image/avif", "image/webp"],
	},
	transpilePackages: ["next-mdx-remote", "commerce-kit"],
	reactCompiler: true, // graduó de experimental en Next 16
	experimental: {
		esmExternals: true,
		scrollRestoration: true,
		// ppr (ahora "cacheComponents") queda desactivado: exige marcar cada
		// boundary dinámico con Suspense; no aporta para un MVP de bajo volumen.
		cpus: 1,
		mdxRs: true,
		inlineCss: true,
	},
	webpack: (config) => {
		return {
			...config,
			resolve: {
				...config.resolve,
				extensionAlias: {
					".js": [".js", ".ts"],
					".jsx": [".jsx", ".tsx"],
				},
			},
		};
	},
	rewrites: async () => [
		{
			source: "/stats/:match*",
			destination: "https://eu.umami.is/:match*",
		},
	],
};

export default withMDX(nextConfig);

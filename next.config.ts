import MDX from "@next/mdx";
import type { NextConfig } from "next/types";

const withMDX = MDX();

const nextConfig: NextConfig = {
	reactStrictMode: true,
	output: process.env.DOCKER ? "standalone" : undefined,
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

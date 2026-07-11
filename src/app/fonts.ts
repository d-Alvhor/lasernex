import { Fraunces, Hanken_Grotesk } from "next/font/google";

// Fraunces — serif de display editorial. Titulares, nombres de producto tratados
// como cartela de museo, y cifras grandes de precio/medida. Ver ADR de diseño "Sala Blanca".
export const fraunces = Fraunces({
	subsets: ["latin"],
	variable: "--font-fraunces",
	display: "swap",
	axes: ["opsz"],
});

// Hanken Grotesk — la voz neutra del sistema. Su peso 300 clona el wordmark fino
// y muy espaciado del logotipo. Cuerpo, nav, botones, specs, precios de catálogo, legal.
export const hanken = Hanken_Grotesk({
	subsets: ["latin"],
	variable: "--font-hanken",
	display: "swap",
	weight: ["300", "400", "500", "600"],
});

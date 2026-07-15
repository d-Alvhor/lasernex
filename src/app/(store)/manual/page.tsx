import { readFile } from "node:fs/promises";
import path from "node:path";
import { publicUrl } from "@/env.mjs";
import { Markdown } from "@/ui/markdown";
import type { Metadata } from "next/types";

// Manual operativo de quien lleva la tienda (no contenido de cliente): NUNCA
// debe indexarse en Google. Tampoco se añade a src/app/sitemap.ts ni se
// enlaza desde el footer — Carla llega por el marcador que le pasa Álvaro.
export const metadata: Metadata = {
	title: "Manual",
	robots: { index: false, follow: false },
	alternates: { canonical: `${publicUrl}/manual` },
};

// Orden de lectura del manual: 00 (bienvenida) a 06 (si algo va mal).
const MANUAL_FILES = [
	"00-bienvenida.md",
	"01-subir-producto.md",
	"02-pedido-entra.md",
	"03-reembolso.md",
	"04-factura.md",
	"05-ventas-del-mes.md",
	"06-si-algo-va-mal.md",
];

// manual/ vive en la raíz del repo, no dentro de src/ — se resuelve contra el
// cwd del proceso Next.js (la raíz del proyecto).
const MANUAL_DIR = path.join(process.cwd(), "manual");

async function leerManual(): Promise<string> {
	const contenidos = await Promise.all(
		MANUAL_FILES.map((file) => readFile(path.join(MANUAL_DIR, file), "utf-8")),
	);
	return contenidos.join("\n\n---\n\n");
}

// Los manual/*.md se mantienen IDÉNTICOS a los del molde (tokens {storeName}
// y {contactoTecnico} incluidos) para que los futuros parches del manual bajen
// con un diff limpio; aquí se interpolan con los datos reales de esta tienda.
function interpolarManual(source: string): string {
	return source.replaceAll("{storeName}", "Lasernex").replaceAll("{contactoTecnico}", "Álvaro");
}

export default async function ManualPage() {
	const fuente = await leerManual();
	const contenido = interpolarManual(fuente);

	return (
		<div className="mx-auto max-w-3xl py-8">
			<article className="prose prose-neutral max-w-none prose-headings:font-bold">
				<Markdown source={contenido} />
			</article>
		</div>
	);
}

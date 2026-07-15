import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// manual/capturas/ vive fuera de public/ (junto al resto del manual, para que
// GitHub y la Wiki también las rendericen con la misma ruta relativa) — esta
// ruta las sirve a la página /manual sin duplicar los ficheros en public/.
const CAPTURAS_DIR = path.join(process.cwd(), "manual", "capturas");

export async function GET(_request: Request, props: { params: Promise<{ file: string }> }) {
	const { file } = await props.params;

	// Solo nombres de fichero PNG simples, sin barras ni "..": evita path traversal.
	if (!/^[\w-]+\.png$/.test(file)) {
		return new NextResponse("Not found", { status: 404 });
	}

	try {
		const data = await readFile(path.join(CAPTURAS_DIR, file));
		return new NextResponse(data, {
			headers: {
				"Content-Type": "image/png",
				"Cache-Control": "public, max-age=86400",
			},
		});
	} catch {
		return new NextResponse("Not found", { status: 404 });
	}
}

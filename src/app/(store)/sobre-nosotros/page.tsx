import { publicUrl } from "@/env.mjs";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
	title: "Sobre nosotros",
	description: "Quiénes somos y por qué fabricamos piezas impresas en 3D en España.",
	alternates: { canonical: `${publicUrl}/sobre-nosotros` },
};

export default function SobreNosotrosPage() {
	return (
		<div className="mx-auto max-w-3xl py-8">
			<article className="prose prose-neutral max-w-none prose-headings:font-bold">
				<h1>Sobre Lasernex</h1>

				<p>
					Lasernex es un catálogo de objetos de diseño propio, impresos en 3D capa a capa. La mayoría son
					piezas de nuestro catálogo que fabricamos <strong>cuando haces tu pedido</strong>: sin grandes
					tiradas ni almacenes llenos de stock, solo lo que de verdad se pide.
				</p>

				<h2>Por qué impresión 3D</h2>
				<p>
					La fabricación aditiva nos permite ofrecer diseños que serían imposibles o carísimos con procesos
					tradicionales, fabricar bajo demanda (sin sobreproducción) y ajustar o mejorar cada diseño sin
					depender de moldes ni tiradas mínimas.
				</p>

				<h2>Hecho en España</h2>
				<p>
					Diseñamos y fabricamos en España, y enviamos a toda la península. Puedes leer más sobre materiales y
					tiempos de fabricación en <a href="/como-se-fabrican">Cómo se fabrican nuestras piezas</a>.
				</p>

				<p className="text-sm text-neutral-500">
					<em>
						[Contenido pendiente de revisar con Álvaro: historia real del proyecto, motivación concreta, fotos
						del taller/proceso.]
					</em>
				</p>
			</article>
		</div>
	);
}

import { publicUrl } from "@/env.mjs";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
	title: "Aviso legal",
	alternates: { canonical: `${publicUrl}/legal/aviso-legal` },
};

export default function AvisoLegalPage() {
	return (
		<>
			<h1>Aviso legal</h1>

			<h2>Titular del sitio</h2>
			<p>
				Este sitio web, lasernex.es, es titularidad de Carla Manso Rojas, con NIF 29517704X y domicilio en{" "}
				<code>[DOMICILIO]</code>. Contacto: hola@lasernex.es.
			</p>

			<h2>Objeto</h2>
			<p>lasernex.es es una tienda online de venta de piezas y objetos fabricados mediante impresión 3D.</p>

			<h2>Condiciones de uso</h2>
			<p>
				El acceso al sitio es gratuito. El usuario se compromete a usar el sitio conforme a la ley y a estas
				condiciones. Los contenidos del sitio (textos, imágenes, logotipo Lasernex) son propiedad de Carla
				Manso Rojas o se usan con licencia; queda prohibida su reproducción sin autorización.
			</p>

			<h2>Responsabilidad</h2>
			<p>
				Carla Manso Rojas no responde de daños derivados de fuerza mayor, mal uso del sitio o interrupciones
				técnicas ajenas (hosting, red).
			</p>

			<h2>Ley aplicable</h2>
			<p>
				Legislación española. Para consumidores, los conflictos se someten a los juzgados del domicilio del
				consumidor. Plataforma europea de resolución de litigios en línea:{" "}
				<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
					ec.europa.eu/consumers/odr
				</a>
				.
			</p>
		</>
	);
}

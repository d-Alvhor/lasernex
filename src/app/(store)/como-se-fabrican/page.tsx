import { publicUrl } from "@/env.mjs";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
	title: "Cómo se fabrican nuestras piezas",
	description: "Materiales, proceso y tiempos de fabricación de las piezas impresas en 3D de Lasernex.",
	alternates: { canonical: `${publicUrl}/como-se-fabrican` },
};

export default function ComoSeFabricanPage() {
	return (
		<div className="mx-auto max-w-3xl py-8">
			<article className="prose prose-neutral max-w-none prose-headings:font-bold">
				<h1>Cómo se fabrican nuestras piezas</h1>

				<p>
					Cada pieza de Lasernex se fabrica mediante impresión 3D por deposición de material fundido (FDM): un
					filamento se calienta y se deposita capa a capa hasta formar la pieza completa, siguiendo el diseño
					3D exacto de cada producto.
				</p>

				<h2>Materiales</h2>
				<p>
					Trabajamos principalmente con <strong>PLA</strong> (incluyendo PLA reciclado cuando el producto lo
					indica), un material de origen vegetal, rígido y con buen acabado, ideal para piezas decorativas y
					de uso general. Para piezas que necesitan más resistencia mecánica o térmica usamos{" "}
					<strong>PETG</strong>. Cada ficha de producto indica el material concreto de esa pieza.
				</p>

				<h2>Acabado</h2>
				<p>
					Al ser fabricación aditiva, es normal apreciar unas líneas de capa muy finas en la superficie — es
					la huella natural del proceso, no un defecto. Si el producto lo requiere, aplicamos un lijado o
					acabado adicional; se indica en la descripción de cada pieza.
				</p>

				<h2>Tiempos de fabricación</h2>
				<p>
					Como cada pieza se fabrica bajo demanda (no tenemos stock preimpreso a gran escala), el plazo de
					fabricación es de <code>[X-Y]</code> días laborables, más el envío (<code>[24-72 h]</code> a
					península). Verás el plazo estimado en la página de cada producto.
				</p>

				<h2>Personalización</h2>
				<p>
					Si buscas una pieza a medida que no está en el catálogo, escríbenos — ver la sección de pedidos
					personalizados en <a href="/legal/condiciones">condiciones de venta</a>.
				</p>
			</article>
		</div>
	);
}

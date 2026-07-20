import { publicUrl } from "@/env.mjs";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
	title: "Política de cookies · Lasernex",
	description: "Qué cookies usa Lasernex y para qué.",
	alternates: { canonical: `${publicUrl}/legal/cookies` },
};

export default function CookiesPage() {
	return (
		<>
			<h1>Política de cookies</h1>

			<p>
				Esta tienda usa <strong>únicamente cookies técnicas estrictamente necesarias</strong> para funcionar.
				Por eso no encontrarás un banner de cookies: no hace falta pedir tu consentimiento para las que
				usamos.
			</p>

			<table>
				<thead>
					<tr>
						<th>Cookie</th>
						<th>Tipo</th>
						<th>Finalidad</th>
						<th>Caducidad</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>
							<code>cart</code>
						</td>
						<td>Técnica, propia</td>
						<td>Recordar el contenido de tu carrito</td>
						<td>Sesión / 30 días</td>
					</tr>
					<tr>
						<td>Cookies de Stripe (js.stripe.com, m.stripe.network)</td>
						<td>Técnicas, de Stripe</td>
						<td>
							Prevención de fraude y proceso de pago — el formulario de pago se muestra dentro de esta misma
							página con Stripe Elements, sin redirigirte a otra web
						</td>
						<td>Según Stripe (dominios propios de Stripe)</td>
					</tr>
				</tbody>
			</table>

			<p>
				Conforme al art. 22.2 de la LSSI y las guías de la Agencia Española de Protección de Datos, las
				cookies estrictamente necesarias para prestar el servicio que solicitas (mantener el carrito, procesar
				el pago) están exentas de consentimiento.
			</p>

			<p>
				Si en el futuro añadimos analítica con cookies, publicidad o contenido incrustado de terceros,
				actualizaremos esta página y añadiremos un gestor de consentimiento antes de activarlos.
			</p>
		</>
	);
}

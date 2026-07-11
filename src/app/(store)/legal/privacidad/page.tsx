import { publicUrl } from "@/env.mjs";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
	title: "Política de privacidad",
	alternates: { canonical: `${publicUrl}/legal/privacidad` },
};

export default function PrivacidadPage() {
	return (
		<>
			<h1>Política de privacidad</h1>

			<h2>Responsable</h2>
			<p>
				Carla Manso Rojas, NIF 29517704X. Contacto: shop.lasernex@gmail.com (domicilio a efectos legales
				disponible a petición).
			</p>

			<h2>Qué datos tratamos y para qué</h2>
			<table>
				<thead>
					<tr>
						<th>Datos</th>
						<th>Cuándo</th>
						<th>Finalidad</th>
						<th>Base jurídica</th>
						<th>Dónde se almacenan</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Nombre, email, dirección de envío, teléfono</td>
						<td>Al comprar</td>
						<td>Gestionar el pedido, envío y facturación</td>
						<td>Ejecución de contrato (art. 6.1.b RGPD)</td>
						<td>Stripe (encargado)</td>
					</tr>
					<tr>
						<td>Datos de pago</td>
						<td>Al pagar</td>
						<td>Cobro</td>
						<td>Ejecución de contrato</td>
						<td>Solo Stripe — nunca llegan a este sitio</td>
					</tr>
					<tr>
						<td>Email</td>
						<td>Emails transaccionales del pedido</td>
						<td>Confirmación y seguimiento</td>
						<td>Ejecución de contrato</td>
						<td>Resend (encargado)</td>
					</tr>
					<tr>
						<td>Datos fiscales (NIF si pide factura)</td>
						<td>Facturación</td>
						<td>Obligación legal</td>
						<td>Obligación legal (6.1.c)</td>
						<td>Stripe Invoicing</td>
					</tr>
				</tbody>
			</table>

			<p>
				<strong>No hay</strong>: registro de usuarios, newsletter con seguimiento (si se añade en el futuro,
				será con consentimiento explícito), cookies de seguimiento, publicidad, decisiones automatizadas ni
				elaboración de perfiles.
			</p>

			<h2>Encargados de tratamiento</h2>
			<p>
				Stripe Payments Europe Ltd (pagos y datos de pedido; Irlanda/UE, con transferencias a EE. UU.
				amparadas en el Data Privacy Framework y cláusulas contractuales tipo), Resend (emails
				transaccionales; EE. UU., cláusulas contractuales tipo), Vercel Inc. (hosting; EE. UU., cláusulas
				contractuales tipo). Cada uno actúa bajo su propio contrato de encargo (DPA), disponible en sus webs.
			</p>

			<h2>Conservación</h2>
			<p>
				Los datos de pedidos y facturación se conservan los plazos exigidos por la normativa fiscal y de
				consumo (mínimo 4-6 años). No usamos los datos para otros fines.
			</p>

			<h2>Tus derechos</h2>
			<p>
				Acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a
				shop.lasernex@gmail.com (responderemos en máximo 1 mes). Puedes reclamar ante la Agencia Española de
				Protección de Datos (
				<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
					aepd.es
				</a>
				).
			</p>
		</>
	);
}

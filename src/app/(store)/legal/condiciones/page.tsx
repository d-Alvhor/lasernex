import { publicUrl } from "@/env.mjs";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
	title: "Condiciones de venta",
	alternates: { canonical: `${publicUrl}/legal/condiciones` },
};

export default function CondicionesPage() {
	return (
		<>
			<h1>Condiciones de venta</h1>

			<ol>
				<li>
					<strong>Identidad del vendedor</strong>: <code>[TITULAR]</code>, NIF <code>[NIF]</code>,{" "}
					<code>[DOMICILIO]</code>, <code>[EMAIL_CONTACTO]</code>.
				</li>
				<li>
					<strong>Productos</strong>: piezas fabricadas por impresión 3D. Las fotos son orientativas; al ser
					fabricación aditiva pueden existir pequeñas variaciones de acabado propias del proceso (líneas de
					capa), que no constituyen defecto.
				</li>
				<li>
					<strong>Precios</strong>: en euros, IVA (21 %) incluido. Los gastos de envío se muestran antes de
					confirmar el pago.
				</li>
				<li>
					<strong>Pedido y pago</strong>: el pedido se realiza como invitado a través de Stripe (tarjeta y
					métodos habilitados). El contrato se perfecciona al recibir la confirmación de pago; se envía un
					email de confirmación con el resumen.
				</li>
				<li>
					<strong>Plazos</strong>: al ser productos fabricados bajo demanda, el plazo de fabricación es de{" "}
					<code>[X-Y]</code> días laborables más envío (<code>[24-72 h]</code> península). Envíos solo a
					España <code>[ajustar si se amplía]</code>.
				</li>
				<li>
					<strong>Entrega</strong>: por mensajería al domicilio indicado. Si el paquete llega dañado,
					comunícalo en 48 horas con fotos a <code>[EMAIL_CONTACTO]</code>.
				</li>
				<li>
					<strong>Desistimiento</strong>: 14 días naturales (ver la página de{" "}
					<a href="/legal/desistimiento">desistimiento</a>). Los pedidos personalizados (fabricados según tus
					especificaciones) no admiten desistimiento; se indicará claramente antes de comprar.
				</li>
				<li>
					<strong>Garantía</strong>: 3 años de garantía legal de conformidad. En caso de falta de conformidad:
					reparación, sustitución, rebaja o resolución del contrato.
				</li>
				<li>
					<strong>Factura</strong>: recibirás un recibo automático por email; si necesitas factura completa
					con NIF, pídela y te la emitimos.
				</li>
				<li>
					<strong>Atención al cliente</strong>: <code>[EMAIL_CONTACTO]</code>, respuesta en máximo{" "}
					<code>[2]</code> días laborables.
				</li>
			</ol>
		</>
	);
}

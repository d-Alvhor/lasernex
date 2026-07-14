import { publicUrl } from "@/env.mjs";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
	title: "Condiciones de venta",
	description: "Condiciones de venta de Lasernex: precios, envíos, pago, plazos, garantía y devoluciones.",
	alternates: { canonical: `${publicUrl}/legal/condiciones` },
};

export default function CondicionesPage() {
	return (
		<>
			<h1>Condiciones de venta</h1>

			<ol>
				<li>
					<strong>Identidad del vendedor</strong>: Carla Manso Rojas, NIF 29517704X, Calle Ada, Sevilla.
					Contacto: shop.lasernex@gmail.com.
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
					<strong>Plazos</strong>: al ser productos fabricados bajo demanda, el plazo de fabricación es de 3-7
					días laborables, más el envío (24-72 h) a España peninsular. Por ahora enviamos solo a España
					peninsular.
				</li>
				<li>
					<strong>Entrega</strong>: por mensajería al domicilio indicado. Si el paquete llega dañado,
					comunícalo en 48 horas con fotos a shop.lasernex@gmail.com.
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
					<strong>Atención al cliente</strong>: shop.lasernex@gmail.com, respuesta en máximo 2 días
					laborables.
				</li>
			</ol>
		</>
	);
}

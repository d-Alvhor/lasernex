import { publicUrl } from "@/env.mjs";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
	title: "Derecho de desistimiento · Lasernex",
	description: "Cómo ejercer tu derecho de desistimiento de 14 días en tus compras en Lasernex.",
	alternates: { canonical: `${publicUrl}/legal/desistimiento` },
};

export default function DesistimientoPage() {
	return (
		<>
			<h1>Derecho de desistimiento</h1>

			<p>
				Tienes derecho a desistir de tu compra en un plazo de <strong>14 días naturales</strong> desde que
				recibes el producto, sin necesidad de justificación.
			</p>

			<h2>Cómo ejercerlo</h2>
			<p>
				Envía un email a shop.lasernex@gmail.com indicando tu número de pedido y tu decisión de desistir
				(puedes usar el formulario de más abajo). Te indicaremos por email la dirección de devolución y, en
				los 14 días siguientes a tu comunicación, devuelve el producto en su estado original. Los gastos de
				devolución corren a tu cargo.
			</p>

			<h2>Reembolso</h2>
			<p>
				Te devolveremos el importe del producto y el envío inicial estándar en un máximo de 14 días desde que
				recibamos el producto (o la prueba de su envío), por el mismo medio de pago que usaste.
			</p>

			<h2>Excepciones</h2>
			<p>Los productos personalizados o fabricados según tus especificaciones no admiten desistimiento.</p>

			<h2>Formulario de desistimiento</h2>
			<p>Copia y pega este texto en tu email:</p>
			<blockquote>
				<p>
					A la atención de Carla Manso Rojas, shop.lasernex@gmail.com:
					<br />
					Por la presente comunico que desisto de mi contrato de venta del siguiente producto:{" "}
					<code>[nombre]</code>, pedido nº <code>[…]</code>, recibido el <code>[fecha]</code>.
					<br />
					Nombre del consumidor: <code>[…]</code> · Dirección: <code>[…]</code> · Fecha: <code>[…]</code>
				</p>
			</blockquote>
		</>
	);
}

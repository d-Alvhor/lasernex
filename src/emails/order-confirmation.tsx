import {
	Body,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Row,
	Text,
} from "@react-email/components";

export interface OrderConfirmationLine {
	name: string;
	quantity: number;
	unitAmountFormatted: string;
	personalization?: string | null;
}

export interface OrderConfirmationEmailProps {
	orderNumber: string;
	customerName: string;
	lines: OrderConfirmationLine[];
	totalFormatted: string;
	shippingAddress?: {
		line1?: string | null;
		line2?: string | null;
		city?: string | null;
		postalCode?: string | null;
		country?: string | null;
	} | null;
	/** Si el pedido incluye algún producto personalizado (sin derecho de desistimiento, art. 103.c TRLGDCU). */
	hasPersonalization?: boolean;
	storeUrl: string;
}

// Plantilla de confirmación de pedido — se envía desde el webhook de Stripe
// (payment_intent.succeeded) vía Resend. Ver ARCHITECTURE.md (flujo de
// compra) y /legal/condiciones (obligación de confirmación en soporte duradero,
// art. 98 TRLGDCU: por eso incluye enlaces a condiciones/desistimiento).
export const OrderConfirmationEmail = ({
	orderNumber,
	customerName,
	lines,
	totalFormatted,
	shippingAddress,
	hasPersonalization,
	storeUrl,
}: OrderConfirmationEmailProps) => {
	return (
		<Html lang="es">
			<Head />
			<Preview>Confirmación de tu pedido en Lasernex — nº {orderNumber}</Preview>
			<Body style={{ backgroundColor: "#f5f5f5", fontFamily: "Helvetica, Arial, sans-serif" }}>
				<Container
					style={{
						backgroundColor: "#ffffff",
						margin: "0 auto",
						padding: "32px",
						maxWidth: "560px",
						borderRadius: "8px",
					}}
				>
					<Heading style={{ fontSize: "20px", letterSpacing: "2px" }}>LASERNEX</Heading>

					<Heading as="h2" style={{ fontSize: "18px" }}>
						¡Gracias por tu pedido, {customerName}!
					</Heading>
					<Text>
						Hemos recibido tu pago correctamente. Aquí tienes el resumen de tu pedido nº{" "}
						<strong>{orderNumber}</strong>.
					</Text>

					<Hr />

					{lines.map((line, i) => (
						<Row key={i} style={{ marginBottom: "8px" }}>
							<Column>
								<Text style={{ margin: 0 }}>
									{line.name} × {line.quantity}
								</Text>
								{line.personalization && (
									<Text style={{ margin: 0, fontSize: "13px", color: "#737373" }}>
										Personalización: {line.personalization}
									</Text>
								)}
							</Column>
							<Column align="right">
								<Text style={{ margin: 0 }}>{line.unitAmountFormatted}</Text>
							</Column>
						</Row>
					))}

					<Hr />

					<Row>
						<Column>
							<Text style={{ fontWeight: "bold", margin: 0 }}>Total</Text>
						</Column>
						<Column align="right">
							<Text style={{ fontWeight: "bold", margin: 0 }}>{totalFormatted}</Text>
						</Column>
					</Row>

					{shippingAddress && (
						<>
							<Hr />
							<Text style={{ fontWeight: "bold", marginBottom: 4 }}>Dirección de envío</Text>
							<Text style={{ margin: 0, color: "#525252" }}>
								{shippingAddress.line1}
								{shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}
								<br />
								{shippingAddress.postalCode} {shippingAddress.city}
								<br />
								{shippingAddress.country}
							</Text>
						</>
					)}

					<Hr />

					{hasPersonalization ? (
						<Text style={{ fontSize: "13px", color: "#737373" }}>
							Te avisaremos por email en cuanto tu pedido salga hacia tu domicilio. Tu pedido incluye
							productos personalizados, que no admiten desistimiento (art. 103.c de la Ley General para la
							Defensa de los Consumidores); para el resto de productos dispones de 14 días naturales. Puedes
							consultar nuestras <Link href={`${storeUrl}/legal/condiciones`}>condiciones de venta</Link> y tu{" "}
							<Link href={`${storeUrl}/legal/desistimiento`}>derecho de desistimiento</Link> en cualquier
							momento.
						</Text>
					) : (
						<Text style={{ fontSize: "13px", color: "#737373" }}>
							Te avisaremos por email en cuanto tu pedido salga hacia tu domicilio. Puedes consultar nuestras{" "}
							<Link href={`${storeUrl}/legal/condiciones`}>condiciones de venta</Link> y tu{" "}
							<Link href={`${storeUrl}/legal/desistimiento`}>derecho de desistimiento</Link> (14 días
							naturales) en cualquier momento.
						</Text>
					)}

					<Text style={{ fontSize: "12px", color: "#a3a3a3", marginTop: "24px" }}>
						Lasernex · Piezas impresas en 3D, fabricadas en España
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

export default OrderConfirmationEmail;

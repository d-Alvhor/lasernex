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

export interface OrderShippedLine {
	name: string;
	quantity: number;
	unitAmountFormatted: string;
	personalization?: string | null;
}

export interface OrderShippedEmailProps {
	orderNumber: string;
	customerName: string;
	trackingNumber?: string | null;
	trackingUrl?: string | null;
	/** Líneas del pedido (con personalización) para que quede claro QUÉ se envió. */
	lines?: OrderShippedLine[] | null;
	storeUrl: string;
}

// Se dispara a mano por la dueña (ver OPERATIONS.md) cuando empaqueta y
// envía el pedido — no hay automatismo con la mensajería en el MVP.
export const OrderShippedEmail = ({
	orderNumber,
	customerName,
	trackingNumber,
	trackingUrl,
	lines,
	storeUrl,
}: OrderShippedEmailProps) => {
	return (
		<Html lang="es">
			<Head />
			<Preview>Tu pedido {orderNumber} ya está de camino</Preview>
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
						¡Tu pedido ya está de camino, {customerName}!
					</Heading>
					<Text>
						Hemos enviado tu pedido nº <strong>{orderNumber}</strong>.
					</Text>

					{lines && lines.length > 0 && (
						<>
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
						</>
					)}

					{trackingNumber && (
						<>
							<Hr />
							<Text style={{ margin: 0 }}>
								Número de seguimiento: <strong>{trackingNumber}</strong>
							</Text>
							{trackingUrl && (
								<Text style={{ margin: "8px 0 0" }}>
									<Link href={trackingUrl}>Seguir el envío</Link>
								</Text>
							)}
						</>
					)}

					<Hr />
					<Text style={{ fontSize: "13px", color: "#737373" }}>
						¿Algún problema con tu pedido? Escríbenos y te ayudamos. Consulta también tu{" "}
						<Link href={`${storeUrl}/legal/desistimiento`}>derecho de desistimiento</Link>.
					</Text>

					<Text style={{ fontSize: "12px", color: "#a3a3a3", marginTop: "24px" }}>
						Lasernex · Piezas impresas en 3D, fabricadas en España
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

export default OrderShippedEmail;

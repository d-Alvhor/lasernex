import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Row,
	Text,
} from "@react-email/components";

export interface OrderNotificationInternalLine {
	name: string;
	quantity: number;
	unitAmountFormatted: string;
	personalization?: string | null;
}

export interface OrderNotificationInternalEmailProps {
	orderNumber: string;
	customerName: string;
	lines: OrderNotificationInternalLine[];
	totalFormatted: string;
	shippingAddress?: {
		line1?: string | null;
		line2?: string | null;
		city?: string | null;
		postalCode?: string | null;
		country?: string | null;
	} | null;
	storeUrl: string;
	shipToken: string;
}

// Email interno a Carla (nunca al cliente) — se dispara desde el webhook junto
// a la confirmación al cliente. El botón lleva el token de
// SHIP_NOTIFICATION_SECRET ya resuelto: un clic marca el pedido como enviado
// sin que tenga que copiar/pegar nada (ver OPERATIONS.md §2.4).
export const OrderNotificationInternalEmail = ({
	orderNumber,
	customerName,
	lines,
	totalFormatted,
	shippingAddress,
	storeUrl,
	shipToken,
}: OrderNotificationInternalEmailProps) => {
	const shipUrl = `${storeUrl}/api/orders/${encodeURIComponent(orderNumber)}/ship?token=${encodeURIComponent(shipToken)}`;

	return (
		<Html lang="es">
			<Head />
			<Preview>Nuevo pedido — nº {orderNumber}</Preview>
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
						Nuevo pedido de {customerName}
					</Heading>
					<Text>
						Pedido nº <strong>{orderNumber}</strong>.
					</Text>

					<Hr />

					{lines.map((line, i) => (
						<Row key={i} style={{ marginBottom: "8px" }}>
							<Column>
								<Text style={{ margin: 0 }}>
									{line.name} × {line.quantity}
								</Text>
								{line.personalization && (
									<Text style={{ margin: 0, fontWeight: "bold", color: "#111111" }}>
										✏️ Personalización: {line.personalization}
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

					<Button
						href={shipUrl}
						style={{
							backgroundColor: "#111111",
							color: "#ffffff",
							padding: "12px 20px",
							borderRadius: "6px",
							fontWeight: "bold",
							textDecoration: "none",
						}}
					>
						Marcar como enviado
					</Button>

					<Text style={{ fontSize: "12px", color: "#a3a3a3", marginTop: "24px" }}>
						Este email es interno de Lasernex — no lo reenvíes al cliente.
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

export default OrderNotificationInternalEmail;

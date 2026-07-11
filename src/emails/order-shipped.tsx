import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";

export interface OrderShippedEmailProps {
	orderNumber: string;
	customerName: string;
	trackingNumber?: string | null;
	trackingUrl?: string | null;
	storeUrl: string;
}

// Se dispara a mano por la dueña (ver OPERATIONS.md) cuando empaqueta y
// envía el pedido — no hay automatismo con la mensajería en el MVP.
export const OrderShippedEmail = ({
	orderNumber,
	customerName,
	trackingNumber,
	trackingUrl,
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

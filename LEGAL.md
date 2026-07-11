# LEGAL.md — Lasernex

> ⚠️ **Textos BASE para revisar con asesor/gestoría antes del lanzamiento.** No son asesoramiento jurídico. Los huecos `[…]` se rellenan con los datos reales del negocio (los tiene Álvaro/la dueña).
> Marco: GDPR/RGPD + LOPDGDD, LSSI-CE, TRLGDCU (consumidores), IVA español.

Datos que hay que rellenar en todos los textos:
- `[TITULAR]` — nombre completo o razón social · `[NIF]` · `[DOMICILIO]` · `[EMAIL_CONTACTO]` (p. ej. hola@lasernex.es)

---

## 1. Aviso legal (`/legal/aviso-legal`)

**Titular del sitio** (art. 10 LSSI): Este sitio web, lasernex.es, es titularidad de `[TITULAR]`, con NIF `[NIF]` y domicilio en `[DOMICILIO]`. Contacto: `[EMAIL_CONTACTO]`.

**Objeto**: lasernex.es es una tienda online de venta de piezas y objetos fabricados mediante impresión 3D.

**Condiciones de uso**: El acceso al sitio es gratuito. El usuario se compromete a usar el sitio conforme a la ley y a estas condiciones. Los contenidos del sitio (textos, imágenes, logotipo Lasernex) son propiedad de `[TITULAR]` o se usan con licencia; queda prohibida su reproducción sin autorización.

**Responsabilidad**: `[TITULAR]` no responde de daños derivados de fuerza mayor, mal uso del sitio o interrupciones técnicas ajenas (hosting, red).

**Ley aplicable**: legislación española. Para consumidores, los conflictos se someten a los juzgados del domicilio del consumidor. Plataforma europea de resolución de litigios en línea: https://ec.europa.eu/consumers/odr

---

## 2. Política de privacidad (`/legal/privacidad`)

**Responsable**: `[TITULAR]`, NIF `[NIF]`, `[DOMICILIO]`, `[EMAIL_CONTACTO]`.

**Qué datos tratamos y para qué**:

| Datos | Cuándo | Finalidad | Base jurídica | Dónde se almacenan |
|---|---|---|---|---|
| Nombre, email, dirección de envío, teléfono | Al comprar | Gestionar el pedido, envío y facturación | Ejecución de contrato (art. 6.1.b RGPD) | Stripe (encargado) |
| Datos de pago | Al pagar | Cobro | Ejecución de contrato | **Solo Stripe** — nunca llegan a este sitio |
| Email | Emails transaccionales del pedido | Confirmación y seguimiento | Ejecución de contrato | Resend (encargado) |
| Datos fiscales (NIF si pide factura) | Facturación | Obligación legal (normativa fiscal) | Obligación legal (6.1.c) | Stripe Invoicing |

**No hay**: registro de usuarios, newsletter (si se añade en el futuro, será con consentimiento explícito), cookies de seguimiento, publicidad, decisiones automatizadas ni elaboración de perfiles.

**Encargados de tratamiento**: Stripe Payments Europe Ltd (pagos y datos de pedido; Irlanda/UE, con transferencias a EE. UU. amparadas en el Data Privacy Framework y CCT), Resend (emails transaccionales; EE. UU., CCT), Vercel Inc. (hosting; EE. UU., CCT). Cada uno actúa bajo contrato de encargo (DPA) disponible en sus webs.

**Conservación**: los datos de pedidos y facturación se conservan los plazos exigidos por la normativa fiscal y de consumo (mínimo 4-6 años). No usamos los datos para otros fines.

**Derechos**: acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a `[EMAIL_CONTACTO]` (responderemos en máx. 1 mes). Reclamaciones: Agencia Española de Protección de Datos (aepd.es).

---

## 3. Política de cookies (`/legal/cookies`) — y por qué NO hay banner

**Decisión de arquitectura**: la tienda usa **únicamente cookies técnicas estrictamente necesarias**:

| Cookie | Tipo | Finalidad | Caducidad |
|---|---|---|---|
| `cart` (o equivalente) | Técnica, propia | Recordar el contenido del carrito | Sesión / 30 días |
| Cookies de Stripe en checkout.stripe.com | Técnicas, de Stripe | Prevención de fraude y proceso de pago | Según Stripe (dominio propio de Stripe) |

Conforme al art. 22.2 LSSI y las guías de la AEPD, las cookies estrictamente necesarias para prestar el servicio solicitado por el usuario (mantener el carrito, procesar el pago) **están exentas de consentimiento** → **no se requiere banner de cookies**. Solo se publica esta página informativa.

**Regla dura para el futuro**: si algún día se añade analytics con cookies (GA4…), publicidad o embeds de terceros (YouTube, Instagram), habrá que añadir gestor de consentimiento ANTES de cargarlos. Mientras tanto, la ventaja competitiva es una tienda sin fricción y sin banner. (Vercel Analytics sin cookies es compatible con no tener banner.)

---

## 4. Condiciones de venta (`/legal/condiciones`)

1. **Identidad del vendedor**: `[TITULAR]`, NIF `[NIF]`, `[DOMICILIO]`, `[EMAIL_CONTACTO]`.
2. **Productos**: piezas fabricadas por impresión 3D. Las fotos son orientativas; al ser fabricación aditiva pueden existir pequeñas variaciones de acabado propias del proceso (líneas de capa), que no constituyen defecto.
3. **Precios**: en euros, **IVA (21 %) incluido**. Los gastos de envío se muestran antes de confirmar el pago.
4. **Pedido y pago**: el pedido se realiza como invitado a través de Stripe (tarjeta y métodos habilitados). El contrato se perfecciona al recibir la confirmación de pago; se envía email de confirmación con el resumen.
5. **Plazos**: al ser productos fabricados bajo demanda, el plazo de fabricación es de `[X-Y]` días laborables + envío `[24-72 h]` península. Envíos solo a España `[ajustar si se amplía]`.
6. **Entrega**: por mensajería al domicilio indicado. Si el paquete llega dañado, comunicarlo en 48 h con fotos a `[EMAIL_CONTACTO]`.
7. **Desistimiento**: 14 días naturales (ver §5). **Excepción legal**: los pedidos **personalizados** (fabricados según especificaciones del cliente, art. 103.c TRLGDCU) no admiten desistimiento; se indicará claramente antes de comprar. *(Aplicable a la fase 2 de pedidos a medida; el catálogo estándar SÍ admite desistimiento.)*
8. **Garantía**: 3 años de garantía legal de conformidad para bienes (TRLGDCU reformado). En caso de falta de conformidad: reparación, sustitución, rebaja o resolución.
9. **Factura**: recibo automático por email; factura completa con NIF a petición (se emite vía Stripe Invoicing).
10. **Atención al cliente**: `[EMAIL_CONTACTO]`, respuesta en máx. `[2]` días laborables.

---

## 5. Derecho de desistimiento (`/legal/desistimiento`)

Tienes derecho a desistir de tu compra en un plazo de **14 días naturales desde que recibes el producto**, sin necesidad de justificación.

**Cómo ejercerlo**: envía un email a `[EMAIL_CONTACTO]` indicando tu número de pedido y tu decisión de desistir (puedes usar el formulario de abajo). Devuelve el producto en su estado original a `[DOMICILIO/DIRECCIÓN DE DEVOLUCIONES]` en los 14 días siguientes a tu comunicación. **Los gastos de devolución corren a cargo del cliente** (se informa aquí conforme al art. 108 TRLGDCU).

**Reembolso**: te devolveremos el importe del producto y el envío inicial estándar en un máximo de 14 días desde que recibamos el producto (o prueba de su envío), por el mismo medio de pago (Stripe procesa la devolución a tu tarjeta).

**Excepciones**: productos personalizados o fabricados según tus especificaciones (art. 103.c TRLGDCU).

**Formulario de desistimiento** (copiar y pegar en el email):
> A la atención de `[TITULAR]`, `[EMAIL_CONTACTO]`:
> Por la presente comunico que desisto de mi contrato de venta del siguiente producto: `[nombre]`, pedido nº `[…]`, recibido el `[fecha]`.
> Nombre del consumidor: `[…]` · Dirección: `[…]` · Fecha: `[…]`

---

## 6. Integración en la tienda (Fase 2)

- Las 5 páginas viven en `/legal/*` como páginas estáticas, enlazadas **desde el footer** en todas las vistas.
- En el flujo de compra, antes del botón de pago: enlace visible a Condiciones de venta y desistimiento (checkbox no obligatorio legalmente si hay aviso claro tipo "Al pagar aceptas las condiciones de venta", pero el asesor decide).
- El email de confirmación (Fase 3) incluye enlace a condiciones y desistimiento — obligación de confirmación en soporte duradero (art. 98 TRLGDCU).
- Checklist con el asesor antes de lanzar: NIF y datos del titular, alta censal de la actividad de venta online (IAE), textos revisados, y política de devoluciones operativa.

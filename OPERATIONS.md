# OPERATIONS.md — Manual de la tienda Lasernex

> **Para ti, que llevas la tienda.** No necesitas saber programar: todo se hace desde la página de Stripe (dashboard.stripe.com) con tu usuario y contraseña. Este manual va paso a paso. Si algo no cuadra con lo que ves en pantalla, avisa: Stripe cambia los menús de vez en cuando.
>
> **La regla de oro**: todo lo de la tienda (productos, precios, pedidos, devoluciones, facturas) vive en Stripe. La web solo "enseña" lo que hay en Stripe. Tú nunca tocas la web.

---

## 1. Subir un producto nuevo

1. Entra en **dashboard.stripe.com** con tu email y contraseña.
2. En el menú de la izquierda: **Catálogo de productos** (Product catalog) → botón **+ Añadir producto**.
3. Rellena:
   - **Nombre**: el que verá el cliente. Ej.: "Maceta hexagonal 12 cm".
   - **Descripción**: qué es, material, medidas, colores. Este texto aparece en la web y en Google — escríbelo pensando en el cliente.
   - **Imágenes**: sube las fotos. ⚠️ **La primera foto es la principal** (la que sale en el catálogo y cuando alguien comparte el enlace): usa una buena, en horizontal si puedes, de al menos 1200 px de ancho.
4. En **Precio**: pon el precio **con IVA incluido** (lo que paga el cliente, ej. 24,90 €), moneda **EUR**, tipo **Único** (no recurrente).
5. Si el producto tiene **variantes** (color, tamaño): de momento, la forma sencilla es crear **un precio por variante** o **un producto por variante** ("Maceta 12 cm — Blanca", "Maceta 12 cm — Negra"). Te dejaremos montado un ejemplo para copiar.
6. Guarda. **En la web aparece solo, como mucho en 1 hora.** (Si quieres verlo ya: abre el enlace "refrescar tienda" que te daremos guardado en favoritos.)

**Para retirar un producto** (se agotó el material, ya no lo haces): abre el producto en Stripe → **Archivar**. Desaparece de la web solo. Para volver a venderlo: **Desarchivar**.

**Para cambiar un precio**: en Stripe no se "edita" un precio: se **añade un precio nuevo** y se archiva el viejo. (Los pedidos ya hechos no cambian.)

---

## 2. Cuando entra un pedido

Te llegará un **email de Stripe** avisando de cada pago. Además:

1. En **dashboard.stripe.com → Pagos** ves todos los pedidos: quién compró, qué, cuánto y su **dirección de envío**.
2. Haz clic en el pago para ver el detalle completo (productos, dirección, email del cliente).
3. Fabrica/prepara el paquete y envíalo por mensajería.
4. Cuando lo envíes, dispara el **email de "pedido enviado"** al cliente pegando esta dirección en la barra de tu navegador (o guárdala como marcador/atajo):

   ```
   https://lasernex.es/api/orders/EL_ID_DEL_PAGO/ship?token=TU_SECRETO
   ```

   - **EL_ID_DEL_PAGO**: lo copias de la URL del pago en el Dashboard de Stripe (empieza por `pi_...`).
   - **TU_SECRETO**: el código que se configuró una vez al lanzar la tienda (pregúntale a Álvaro si no lo tienes).
   - Si tienes número de seguimiento de la mensajería, añádelo al final: `&tracking=1234567890`.

   Al abrir el enlace verás un mensaje confirmando que el email se ha enviado. No hace falta contraseña ni iniciar sesión en nada — es un enlace de un solo uso por pedido.

Consejo: usa la vista **Pagos** como tu lista de tareas — lo de arriba es lo más nuevo. Si un día hay mucho movimiento, apúntate en una libreta o nota del móvil cuáles ya enviaste.

---

## 3. Hacer un reembolso (devolución de dinero)

Cuando un cliente devuelve un producto (tiene 14 días de plazo legal) o hay algún problema:

1. **Pagos** → busca el pedido (puedes buscar por email del cliente o importe).
2. Abre el pago → botón **Reembolsar** (Refund).
3. Elige **reembolso total** o pon la cantidad exacta si es parcial (por ejemplo, solo un producto de varios).
4. Confirma. El dinero vuelve **a la misma tarjeta** del cliente en unos 5-10 días. Stripe le manda aviso automático — no tienes que escribirle tú (aunque un email tuyo amable siempre queda bien).

⚠️ Lo que Stripe te cobró de comisión por ese pago **no se devuelve**: es el pequeño coste de una devolución.

---

## 4. Emitir una factura (cuando el cliente la pide con su NIF)

El cliente siempre recibe un **recibo automático** por email. Si además pide **factura** (típico de empresas o autónomos):

1. Pídele por email: **nombre o razón social, NIF y dirección fiscal**.
2. En Stripe: **Clientes** → busca al cliente por su email → ábrelo y rellena sus datos fiscales (NIF en "ID fiscal", dirección en facturación).
3. **Facturas** (Invoicing) → **+ Crear factura** → elige el cliente → añade el/los producto(s) del pedido con su precio → revisa que el IVA aparezca correcto → **como ya pagó**, marca la factura como pagada al emitirla (o usa "cobrar del pago existente" si Stripe lo ofrece).
4. **Enviar**: el cliente recibe la factura en PDF por email.

La numeración de facturas es automática y correlativa (se configura una sola vez con tu NIF y tus datos — eso ya te lo dejamos hecho). **No borres facturas emitidas**: si hay un error, se hace una rectificativa (pregunta a la gestoría).

---

## 5. Ver las ventas del mes

1. **dashboard.stripe.com → Informes** (Reports).
2. Arriba eliges el periodo: "Este mes", "Mes pasado", o fechas concretas.
3. Verás: **volumen bruto** (todo lo cobrado), **comisiones de Stripe**, reembolsos y el **neto** (lo que llega a tu banco).
4. Para la gestoría: **Informes → Exportar** te baja un Excel/CSV con todos los movimientos del periodo. Envíaselo tal cual cada mes o trimestre.

El dinero llega a tu cuenta bancaria automáticamente (por defecto cada pocos días — el ritmo se ve en **Configuración → Transferencias**).

---

## 6. Si algo va mal

| Problema | Qué hacer |
|---|---|
| Un producto no aparece en la web | ¿Está **activo** (no archivado) en Stripe y tiene precio en EUR? Espera 1 h o usa el enlace de refrescar. Si sigue sin salir, avisa a Álvaro. |
| Un cliente dice que pagó pero no ves el pago | En **Pagos**, busca por su email. Si no está, no se completó el pago: pídele que lo intente de nuevo. |
| Email de Stripe sobre una "disputa" (chargeback) | El cliente reclamó al banco. Entra en el aviso, aporta lo que Stripe pida (justificante de envío, emails). Tiene fecha límite: no lo dejes pasar. |
| La web está caída | Avisa a Álvaro. (Los pagos en curso en Stripe no se pierden.) |
| Te piden borrar sus datos (GDPR) | Reenvía el email a Álvaro; hay obligación de responder en un mes. |

**Tu sesión de Stripe es la llave de la caja**: contraseña fuerte, activa la verificación en dos pasos (Stripe te lo ofrecerá), y no la compartas.

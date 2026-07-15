# OPERATIONS.md — Manual de la tienda Lasernex

> **Para ti, que llevas la tienda.** No necesitas saber programar: todo se hace desde la página de Stripe (dashboard.stripe.com) con tu usuario y contraseña. Este manual va paso a paso. Si algo no cuadra con lo que ves en pantalla, avisa: Stripe cambia los menús de vez en cuando.
>
> **La regla de oro**: todo lo de la tienda (productos, precios, pedidos, devoluciones, facturas) vive en Stripe. La web solo "enseña" lo que hay en Stripe. Tú nunca tocas la web.

---

## 1. Subir un producto nuevo

> 🔴 **ANTES DE NADA — mira que estás en "Modo real".** Arriba del todo en Stripe hay un interruptor que pone **Modo de prueba** / *Test mode* (suele estar a la derecha, en naranja). Tiene que estar **APAGADO**. Si lo dejas encendido, creas los productos en un "Stripe de mentira" para pruebas y **NO aparecen en la tienda de verdad**. La web solo enseña lo que hay en **Modo real**. Si dudas: si ves colores naranjas o la palabra "prueba/test" por la pantalla, apágalo antes de seguir.

1. Entra en **dashboard.stripe.com** con tu email y contraseña.
2. En el menú de la izquierda: **Catálogo de productos** (Product catalog) → botón **+ Añadir producto**.
3. Rellena:
   - **Nombre**: el que verá el cliente. Ej.: "Maceta hexagonal 12 cm".
   - **Descripción**: qué es, material, medidas, colores. Este texto aparece en la web y en Google — escríbelo pensando en el cliente.
   - **Imágenes**: sube las fotos. ⚠️ **La primera foto es la principal** (la que sale en el catálogo y cuando alguien comparte el enlace): usa una buena, en horizontal si puedes, de al menos 1200 px de ancho.
4. En **Precio**: pon el precio **con IVA incluido** (lo que paga el cliente, ej. 24,90 €), moneda **EUR**, tipo **Único** (no recurrente).
5. Si el producto tiene **variantes** (color, tamaño): de momento, la forma sencilla es crear **un precio por variante** o **un producto por variante** ("Maceta 12 cm — Blanca", "Maceta 12 cm — Negra"). Te dejaremos montado un ejemplo para copiar.
5.b **Si el producto se personaliza con un nombre/texto** (una taza grabada, una figura con un nombre, etc.): baja hasta la sección **Metadatos** (Metadata) del formulario del producto → **+ Añadir metadato** → en **Clave** pon exactamente `preview` (todo en minúsculas, sin espacios) → en **Valor** escribe el texto que verá el cliente encima del campo, por ejemplo `Nombre para grabar` o `¿Qué texto quieres en la pieza?`. Guarda. En la web aparecerá un cuadro de texto obligatorio antes de "Añadir al carrito" con esa misma frase, y el cliente no podrá comprarlo sin rellenarlo. Si el producto NO se personaliza, simplemente no añadas ese metadato.
5.c **Otros metadatos que entiende la web** (en la misma sección **Metadatos**, un metadato por línea):
   - **Clave** `category` → **Valor**: en qué categoría de la web sale el producto (ej. `macetas`). Escríbelo **en minúsculas y sin tildes**. Ojo: una palabra NUEVA crea una categoría nueva en el menú automáticamente — cuidado con las erratas (`macetas` y `maceta` serían DOS categorías distintas). Si te pasa, se corrige editando el **Valor** del metadato, no hay que borrar nada más.
   - **Clave** `stock` → **Valor**: número de unidades que tienes (ej. `5`). La web pone **"Agotado" automáticamente al llegar a 0** y descuenta las unidades sola con cada venta — no tienes que tocarlo tras cada pedido, solo cuando fabriques más.
   - **Clave** `order` → **Valor**: orden de aparición en el catálogo — **el número más bajo sale primero** (ej. `1` sale antes que `10`). Si no lo pones, el producto sale detrás de los que sí lo tienen.
6. Guarda. **Normalmente aparece en la web en segundos, solo.** En algún caso raro (sobre todo justo al crear un producto muy nuevo) su ficha individual puede tardar un par de minutos aunque ya salga en el catálogo — si tarda más, abre este enlace guardado en marcadores para forzar el refresco:

   ```
   https://lasernex.es/api/revalidate?token=TU_SECRETO
   ```

   (**TU_SECRETO**: pregúntale a Álvaro si no lo tienes guardado — es distinto del secreto de "pedido enviado".) Verás un mensaje de confirmación al abrirlo.

**Para retirar un producto** (se agotó el material, ya no lo haces): abre el producto en Stripe → **Archivar**. Desaparece de la web solo. Para volver a venderlo: **Desarchivar**.

**Para cambiar un precio**: en Stripe no se "edita" un precio: se **añade un precio nuevo** y se archiva el viejo. (Los pedidos ya hechos no cambian.)

---

## 2. Cuando entra un pedido

Te llegarán **dos emails** por cada venta: uno de **Stripe** avisando del pago, y otro **nuestro** a tu correo titulado **"Nuevo pedido"** con el resumen y un botón **"Marcar como enviado"** ya preparado — no tienes que copiar ni pegar nada.

1. En **dashboard.stripe.com → Pagos** ves todos los pedidos: quién compró, qué, cuánto y su **dirección de envío**.
2. Haz clic en el pago para ver el detalle completo (productos, dirección, email del cliente).
3. **Si el producto era personalizado**: el texto que escribió el cliente aparece destacado con ✏️ en el email "Nuevo pedido" (justo debajo del nombre del producto), y también en el propio pago dentro de Stripe, bajando hasta la sección **Metadatos** del pago (busca una clave que empieza por `personalization_`). Revísalo antes de fabricar la pieza.
4. Fabrica/prepara el paquete y envíalo por mensajería.
5. Cuando lo envíes, abre el email **"Nuevo pedido"** de esa venta y pulsa **"Marcar como enviado"**. Eso dispara al cliente el email de "tu pedido ya va de camino".

   **Para añadir el número de seguimiento** (opcional): antes de pulsar, puedes editar esa URL y añadir al final `&tracking=1234567890` (el número tal cual) y `&trackingUrl=https://...` (el enlace de seguimiento de la mensajería). Si pones `trackingUrl`, el cliente recibe un enlace clicable "Seguir el envío" en su email; con solo `tracking` ve el número, sin enlace.

   **Si ese email no te llegó** (mira spam) puedes construir el enlace tú misma, pegando esto en la barra de tu navegador:

   ```
   https://lasernex.es/api/orders/EL_ID_DEL_PAGO/ship?token=TU_SECRETO
   ```

   - **EL_ID_DEL_PAGO**: lo copias de la URL del pago en el Dashboard de Stripe (empieza por `pi_...`).
   - **TU_SECRETO**: el código que se configuró una vez al lanzar la tienda (pregúntale a Álvaro si no lo tienes).

   Al abrir el enlace verás un mensaje confirmando que el email se ha enviado. No hace falta contraseña ni iniciar sesión en nada.

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
| Un producto no aparece en la web | ¿Está **activo** (no archivado) en Stripe y tiene precio en EUR? Usa el enlace de "refrescar tienda" (§1). Si sigue sin salir, avisa a Álvaro. |
| Un cliente dice que pagó pero no ves el pago | En **Pagos**, busca por su email. Si no está, no se completó el pago: pídele que lo intente de nuevo. |
| Email de Stripe sobre una "disputa" (chargeback) | El cliente reclamó al banco. Entra en el aviso, aporta lo que Stripe pida (justificante de envío, emails). Tiene fecha límite: no lo dejes pasar. |
| La web está caída | Avisa a Álvaro. (Los pagos en curso en Stripe no se pierden.) |
| Te piden borrar sus datos (GDPR) | Reenvía el email a Álvaro; hay obligación de responder en un mes. |

**Tu sesión de Stripe es la llave de la caja**: contraseña fuerte, activa la verificación en dos pasos (Stripe te lo ofrecerá), y no la compartas.

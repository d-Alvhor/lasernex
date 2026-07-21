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
5. Si el producto tiene **variantes** (color, tamaño): puedes hacerlo como productos totalmente aparte, cada uno con su propio Nombre ("Maceta 12 cm — Blanca", "Maceta 12 cm — Negra") — la forma más simple. O, si quieres que el cliente los vea todos juntos en una sola ficha con un selector, crea un producto por variante pero con **el mismo Nombre exacto en todos**, y añade la casilla de metadata `variant` con un valor distinto en cada uno (`blanca`, `negra`...). Ver el aviso de §1.5.d sobre qué pasa si dos productos comparten Nombre por accidente.
5.b **Si el producto se personaliza con un nombre/texto** (una taza grabada, una figura con un nombre, etc.): baja hasta la sección **Metadatos** (Metadata) del formulario del producto → **+ Añadir metadato** → en **Clave** pon exactamente `preview` (todo en minúsculas, sin espacios) → en **Valor** escribe el texto que verá el cliente encima del campo, por ejemplo `Nombre para grabar` o `¿Qué texto quieres en la pieza?`. Guarda. En la web aparecerá un cuadro de texto obligatorio antes de "Añadir al carrito" con esa misma frase, y el cliente no podrá comprarlo sin rellenarlo. Si el producto NO se personaliza, simplemente no añadas ese metadato.
5.c **Otros metadatos que entiende la web** (en la misma sección **Metadatos**, un metadato por línea):
   - **Clave** `category` → **Valor**: en qué categoría de la web sale el producto (ej. `macetas`). Escríbelo **en minúsculas y sin tildes**. Ojo: una palabra NUEVA crea una categoría nueva en el menú automáticamente — cuidado con las erratas (`macetas` y `maceta` serían DOS categorías distintas). Si te pasa, se corrige editando el **Valor** del metadato, no hay que borrar nada más.
   - **Clave** `stock` → **Valor**: número de unidades que tienes (ej. `5`). La web pone **"Agotado" automáticamente al llegar a 0** y descuenta las unidades sola con cada venta — no tienes que tocarlo tras cada pedido, solo cuando fabriques más.
   - **Clave** `order` → **Valor**: orden de aparición en el catálogo — **el número más bajo sale primero** (ej. `1` sale antes que `10`). Si no lo pones, el producto sale detrás de los que sí lo tienen.
5.d ⚠️ **Si dos productos acaban con el mismo Nombre por accidente** (un despiste, no porque sean variantes) y ninguno lleva la casilla `variant`, la web se da cuenta sola y no rompe nada: al segundo le añade automáticamente un "-2" al final de su dirección web para que ambos sigan funcionando. Puede quedar raro (dos fichas con el mismo Nombre visible pero direcciones distintas) — si lo ves, o le pones un Nombre distinto a cada uno, o rellenas `variant` en los dos.
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
5. Cuando lo envíes, abre el email **"Nuevo pedido"** de esa venta y pulsa **"Marcar como enviado"**. Se abre una página con los datos del pedido y un botón **"Sí, marcar como enviado"** — dos clics en vez de uno a propósito, para que un simple vistazo automático al enlace (por ejemplo, un antivirus de correo) no dispare el aviso al cliente sin que tú lo hayas confirmado. Al pulsar ese botón sí se envía el email de "tu pedido ya va de camino".

   **Para añadir el número de seguimiento** (opcional): antes de pulsar el enlace del email, puedes editar esa URL y añadir al final `&tracking=1234567890` (el número tal cual) y `&trackingUrl=https://...` (el enlace de seguimiento de la mensajería). Si pones `trackingUrl`, el cliente recibe un enlace clicable "Seguir el envío" en su email; con solo `tracking` ve el número, sin enlace.

   **Si ese email no te llegó** (mira spam) puedes construir el enlace tú misma, pegando esto en la barra de tu navegador:

   ```
   https://lasernex.es/api/orders/EL_ID_DEL_PAGO/ship?token=TU_SECRETO
   ```

   - **EL_ID_DEL_PAGO**: lo copias de la URL del pago en el Dashboard de Stripe (empieza por `pi_...`).
   - **TU_SECRETO**: el código que se configuró una vez al lanzar la tienda (pregúntale a Álvaro si no lo tienes).

   Al abrir el enlace verás la página de confirmación del pedido; pulsa el botón para enviar de verdad el email. No hace falta contraseña ni iniciar sesión en nada.

Consejo: usa la vista **Pagos** como tu lista de tareas — lo de arriba es lo más nuevo. Si un día hay mucho movimiento, apúntate en una libreta o nota del móvil cuáles ya enviaste.

**Red de seguridad, por si el email interno alguna vez falla** (clave de email caducada, cuota agotada — nunca debería pasar, pero por si acaso): si llevas varios días sin recibir NINGÚN email de "Nuevo pedido" aunque sepas que tu tienda tiene visitas, entra directamente a **Pagos** en Stripe y comprueba si hay ventas que no te avisaron. Es buena costumbre echar un vistazo a Pagos una vez por semana aunque los emails lleguen bien, solo para confirmar que todo cuadra.

**Si algún día necesitas cambiar el secreto de estos enlaces** (por ejemplo, si sospechas que uno se ha filtrado): quien tenga acceso al panel de Vercel del proyecto puede ir a **Settings → Environment Variables**, generar un valor nuevo (un texto largo al azar) para `SHIP_NOTIFICATION_SECRET` o `STORE_REFRESH_SECRET`, y guardar — Vercel vuelve a desplegar la web sola con el nuevo valor. Los enlaces antiguos (los que ya tengas guardados o en emails viejos) dejan de funcionar en cuanto lo cambies.

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

**Para hacerte una idea de si el negocio va bien o mal**: compara el neto de este mes con el del mes anterior (no hace falta más que eso para empezar). Si los reembolsos de un mes se acercan a una parte importante de las ventas de ese mismo mes, es una señal de que algo no está yendo bien (producto, envío, expectativas del cliente) y merece la pena pararse a pensar por qué.

---

## 6. Si algo va mal

| Problema | Qué hacer |
|---|---|
| Un producto no aparece en la web | ¿Está **activo** (no archivado) en Stripe y tiene precio en EUR? Usa el enlace de "refrescar tienda" (§1). Si tiene el mismo Nombre que otro producto tuyo, mira §1.5.b — es la causa más habitual. Si sigue sin salir tras unos minutos, abre el producto y guárdalo de nuevo sin cambiar nada. Si aun así no aparece, mira el aviso final sobre pedir ayuda técnica. |
| Un cliente dice que pagó pero no ves el pago | En **Pagos**, busca por su email. Si no está, no se completó el pago: pídele que lo intente de nuevo. |
| Email de Stripe sobre una "disputa" (chargeback) | El cliente reclamó al banco. Entra en el aviso, aporta lo que Stripe pida (justificante de envío, capturas de conversación con el cliente). **Tiene fecha límite corto: no lo dejes pasar.** Si la pierdes, se pierde el producto Y el dinero, más una comisión. Un número alto de disputas puede además poner en riesgo la cuenta de Stripe entera — si te pasa más de una vez, revisa con calma qué está fallando (entrega, comunicación con el cliente). |
| La web está caída | Primero comprueba que no es solo tu conexión: pruébala desde el móvil con datos, sin wifi. Si sigue sin cargar para todo el mundo, es un problema técnico real (mira el aviso final sobre pedir ayuda). Mientras tanto, tranquila: **los pagos que ya se hicieron no se pierden**, viven en Stripe, no en la web. |
| Te piden borrar sus datos (GDPR) | No lo decidas tú sola: consulta con tu **gestoría/asesor fiscal** (el mismo que te lleva las facturas) — ellos saben qué datos hay que conservar por obligación legal (facturas, varios años) y cuáles sí se pueden borrar. Hay un mes de plazo para responder al cliente. |
| Se te olvida la contraseña de Stripe, o pierdes el acceso a tu email | Es tu cuenta, no depende de nadie más: en la pantalla de acceso de Stripe usa "¿Olvidaste tu contraseña?". Si además perdiste el acceso al email con el que te diste de alta, contacta directamente con el **soporte de Stripe** (dashboard.stripe.com/support o help.stripe.com) — te pedirán verificar tu identidad. |
| Quieres pausar la tienda (vacaciones, sin stock de nada) | Selecciona todos tus productos en el Catálogo → **Archivar** en bloque. La web se queda sin productos activos hasta que los desarchives. Si tienes pedidos ya pagados en curso, avisa a esos clientes del retraso dentro del plazo de fabricación que prometes en las condiciones (§4 legal). |
| Quieres subir precios en bloque, o cambia el IVA | No hay un botón de "subir todos los precios un X%" en Stripe: hay que repetir el proceso de "cambiar un precio" (§1) producto por producto. El tipo de IVA (21% ahora mismo) solo cambiaría si cambia la ley española — si eso pasa alguna vez, pregunta a tu gestoría el nuevo tipo y pide ayuda técnica para actualizarlo en el código (no se edita desde Stripe). |

**Tu sesión de Stripe es la llave de la caja**: contraseña fuerte, activa la verificación en dos pasos (Stripe te lo ofrecerá), y no la compartas. Considera añadir un segundo acceso de confianza (⚙️ → **Configuración** → **Equipo**) para no depender de una sola contraseña o un solo email.

### Si necesitas ayuda técnica de verdad y no puedes contactar con Álvaro

El código de esta tienda es público y libre (licencia AGPL-3.0), pensado exactamente para esto: no
dependes obligatoriamente de una persona concreta. Cualquier programador que sepa Next.js/React puede
coger el repositorio, entenderlo (empieza por el fichero `CLAUDE.md`, que explica toda la tienda) y
arreglar o cambiar lo que haga falta.

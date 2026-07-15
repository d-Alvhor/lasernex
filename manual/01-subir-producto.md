# 1. Subir un producto nuevo

> 🔴 **ANTES DE NADA — mira que estás en "Modo real".** Arriba del todo en Stripe hay un interruptor que pone **Modo de prueba** / *Test mode* (suele estar a la derecha, en naranja). Tiene que estar **APAGADO**. Si lo dejas encendido, creas los productos en un "Stripe de mentira" para pruebas y **NO aparecen en la tienda de verdad**. La web de {storeName} solo enseña lo que hay en **Modo real**. Si dudas: si ves colores naranjas o la palabra "prueba/test" por la pantalla, apágalo antes de seguir.

1. Entra en **dashboard.stripe.com** con tu email y contraseña.
2. En el menú de la izquierda: **Catálogo de productos** (Product catalog) → botón **+ Añadir producto**.

   ![Pantalla de "+ Añadir producto" en el Catálogo de productos de Stripe](/manual/capturas/01-anadir-producto.png)

3. Rellena:
   - **Nombre**: el que verá el cliente. Ej.: "Producto de ejemplo" o "Artículo azul, talla M".
   - **Descripción**: qué es, material, medidas, colores... Este texto aparece en la web y en Google — escríbelo pensando en el cliente.
   - **Imágenes**: sube las fotos. ⚠️ **La primera foto es la principal** (la que sale en el catálogo y cuando alguien comparte el enlace): usa una buena, en horizontal si puedes, de al menos 1200 px de ancho.
4. En **Precio**: pon el precio **con IVA incluido** (lo que paga el cliente, ej. 24,90 €), moneda **EUR**, tipo **Único** (no recurrente).

   ![Formulario de creación de producto con Nombre/Descripción/Imágenes/Precio rellenos](/manual/capturas/02-formulario-relleno.png)

5. Si el producto tiene **variantes** (color, tamaño): de momento, la forma sencilla es crear **un precio por variante** o **un producto por variante** (ej. "Producto de ejemplo — Azul", "Producto de ejemplo — Negro").
6. Guarda. En la web de {storeName} normalmente aparece en segundos — la tienda se refresca sola. Si tarda en salir, abre el enlace de **"refrescar tienda"** que {contactoTecnico} te dejó guardado en marcadores.

**Para retirar un producto** (se agotó el material, ya no lo haces): abre el producto en Stripe → **Archivar**. Desaparece de la web solo. Para volver a venderlo: **Desarchivar**.

**Para cambiar un precio**: en Stripe no se "edita" un precio: se **añade un precio nuevo** y se archiva el viejo. (Los pedidos ya hechos no cambian.)

## Cómo hacer que el producto salga en su categoría

Cuando ya has puesto Nombre, Descripción, Imágenes y Precio, en esa misma pantalla busca más abajo donde pone **"Más opciones"** y haz clic para abrirlo. Dentro verás una sección que pone **"Metadata"** — no le hagas caso al nombre, es solo dos casillas en blanco una al lado de la otra: una dice **Clave** y la otra **Valor**.

1. En la casilla **Clave**, escribe exactamente: `category`
2. En la casilla **Valor**, escribe el nombre de la categoría, todo en **minúsculas y sin tildes** (por ejemplo, "Decoración" se escribiría `decoracion`). Puedes **inventar una categoría nueva** simplemente escribiéndola aquí: aparecerá sola en el menú de la web, sin pedir nada a nadie. Si otro producto ya usa esa categoría, escribe exactamente la misma palabra para que salgan juntos.

⚠️ **Muy importante**: cuidado con las erratas. Si en un producto escribes `figuras` y en otro `figura` (o "Figuras" con mayúscula), la web creará **dos categorías distintas en el menú**, cada una con parte de los productos. No es grave ni se rompe nada: se arregla abriendo el producto equivocado y corrigiendo el **Valor** para que sea idéntico al del resto. Si ves una categoría duplicada o un producto que no sale donde esperabas, lo primero que hay que mirar es esto.

### Dos casillas más, opcionales (no hacen falta para empezar)

Si quieres, puedes añadir dos parejas de Clave/Valor más, del mismo modo (clic en "+ Añadir" para que salga una casilla nueva):

- Clave `stock`, Valor un número (ej. `10`): la web pondrá "Agotado" automáticamente en cuanto se vendan esas 10 unidades — se va descontando solo, no tienes que tocar nada. Si no pones esta casilla, se entiende que nunca se agota.
- Clave `order`, Valor un número (ej. `1`, `2`, `3`...): decide en qué orden salen los productos en la web. El número más bajo sale el primero.
- Clave `preview`, Valor la etiqueta del campo que verá el cliente (ej. `Nombre a grabar`): convierte el producto en **personalizable** — en la web aparece un campo de texto **obligatorio** con esa etiqueta, y el cliente no puede comprarlo sin rellenarlo. Lo que escriba te llega con el pedido (ver la sección 2 del manual). Solo para productos que de verdad se personalizan; los demás, sin esta casilla.

No hace falta tocar nada más: la dirección web del producto (la parte de `/product/...`) se rellena sola a partir del Nombre en cuanto guardas.

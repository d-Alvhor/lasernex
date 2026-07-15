# 2. Cuando entra un pedido

Cada venta en {storeName} te avisa por dos caminos a la vez:

1. **Email de Stripe** avisando del pago — es automático, no tienes que hacer nada con él, solo sirve de confirmación.
2. **Email nuestro**, con el asunto "Nuevo pedido", que llega a tu correo de la tienda: trae el resumen del pedido (qué compró, cuánto y la dirección de envío) y un botón **Marcar como enviado**. Este es el que usarás para trabajar cada pedido. Si el pedido llevaba **personalización** (un producto con campo de texto, ej. "Nombre a grabar"), el texto del cliente llega **destacado con ✏️** en este email — revísalo bien antes de fabricar.
3. Fabrica/prepara el paquete y envíalo por mensajería.
4. Cuando lo envíes, simplemente haz clic en el botón **Marcar como enviado** de ese email — no hace falta copiar nada a mano. Al cliente le llega su aviso de envío automáticamente.

![Email interno de "Nuevo pedido" con el botón de marcar como enviado](/manual/capturas/03-email-nuevo-pedido.png)

### Consultar todos los pedidos de un vistazo

También puedes ver todos los pedidos, en cualquier momento, en **dashboard.stripe.com → Pagos**: quién compró, qué, cuánto y su dirección de envío. Haz clic en un pago para ver el detalle completo (productos, dirección, email del cliente).

![Vista de Pagos en el Dashboard de Stripe](/manual/capturas/04-vista-pagos.png)

Consejo: usa esa vista como tu lista de tareas si quieres repasar todo junto — lo de arriba es lo más nuevo.

---

### Si por lo que sea no te llega el email interno

Esto es una vía de emergencia, no lo que usarás normalmente. Si el email de "Nuevo pedido" no llega (puede pasar: filtro de spam, fallo puntual), puedes marcar el envío a mano:

1. Ve a **dashboard.stripe.com → Pagos** y abre el pedido en cuestión.
2. Copia el identificador del pago de la URL del navegador (empieza por `pi_...`).
3. Pega esta dirección en la barra de tu navegador, sustituyendo lo que corresponda:

   ```
   https://TU-DOMINIO/api/orders/EL_ID_DEL_PAGO/ship?token=TU_SECRETO&tracking=NUMERO_OPCIONAL
   ```

   - **EL_ID_DEL_PAGO**: el `pi_...` que acabas de copiar.
   - **TU_SECRETO**: el código que se configuró una vez al lanzar la tienda. {contactoTecnico} lo tiene guardado si no lo encuentras.
   - **NUMERO_OPCIONAL**: si tienes número de seguimiento de la mensajería, ponlo aquí; si no, borra `&tracking=NUMERO_OPCIONAL` entero.
   - Si además tienes el **enlace de seguimiento** de la mensajería (la dirección web donde se ve el paquete), añade también `&trackingUrl=` con ese enlace: el cliente recibirá un botón clicable "Seguir el envío". Con solo `&tracking=`, el cliente ve el número, sin enlace.

4. Al abrir el enlace verás un mensaje confirmando que el email se ha enviado al cliente. No hace falta contraseña ni iniciar sesión en nada.

# 3. Hacer un reembolso (devolución de dinero)

Cuando un cliente devuelve un producto (tiene 14 días de plazo legal) o hay algún problema:

1. **Pagos** → busca el pedido (puedes buscar por email del cliente o importe).
2. Abre el pago → botón **Reembolsar** (Refund).

   ![Un pago abierto en Stripe con el botón "Reembolsar" visible](/manual/capturas/05-pago-boton-reembolsar.png)

3. Elige **reembolso total** o pon la cantidad exacta si es parcial (por ejemplo, solo un producto de varios).

   ![El diálogo de reembolso con las opciones de total/parcial](/manual/capturas/06-dialogo-reembolso.png)

4. Confirma. El dinero vuelve **a la misma tarjeta** del cliente en unos 5-10 días. Stripe le manda aviso automático — no tienes que escribirle tú (aunque un email tuyo amable siempre queda bien).

⚠️ Lo que Stripe cobró de comisión por ese pago **no se devuelve**: es el pequeño coste de una devolución.

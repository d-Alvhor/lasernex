# 4. Emitir una factura (cuando el cliente la pide con su NIF)

El cliente siempre recibe un **recibo automático** por email. Si además pide **factura** (típico de empresas o autónomos):

1. Pídele por email: **nombre o razón social, NIF y dirección fiscal**.
2. En Stripe: **Clientes** → busca al cliente por su email → ábrelo y rellena sus datos fiscales (NIF en "ID fiscal", dirección en facturación).

   ![La ficha de un cliente en Stripe con los campos de NIF y dirección de facturación](/manual/capturas/07-cliente-nif-direccion.png)

3. **Facturas** (Invoicing) → **+ Crear factura** → elige el cliente → añade el/los producto(s) del pedido con su precio → revisa que el IVA aparezca correcto → **como ya pagó**, marca la factura como pagada al emitirla (o usa "cobrar del pago existente" si Stripe lo ofrece).

   ![La pantalla "+ Crear factura" con el cliente y los productos añadidos](/manual/capturas/08-crear-factura.png)

4. **Enviar**: el cliente recibe la factura en PDF por email.

La numeración de facturas es automática y correlativa (se configura una sola vez con el NIF y los datos de {storeName} — {contactoTecnico} ya te lo deja hecho al montar la tienda). **No borres facturas emitidas**: si hay un error, se hace una rectificativa (pregunta a la gestoría).

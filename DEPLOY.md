# DEPLOY.md — Estado del despliegue

> **La tienda ya está desplegada y funcionando** en Vercel (proyecto `lasernex`, cuenta `carlamansorojas@gmail.com`, vinculado a GitHub con auto-deploy en cada push a `main`). Este documento registra lo hecho y lo único que falta.

## ✅ Ya hecho (2026-07-11)

- Proyecto `lasernex` creado en Vercel y **vinculado al repo `d-Alvhor/lasernex`** → cada push a `main` despliega solo.
- Variables de entorno configuradas en Vercel (Production + Preview): `NEXT_PUBLIC_URL=https://lasernex.es`, claves **de test** de Stripe (`pk_test`/`sk_test`), `STRIPE_CURRENCY=eur`, `NEXT_PUBLIC_LANGUAGE=es-ES`, `STRIPE_WEBHOOK_SECRET` (del webhook de producción), `SHIP_NOTIFICATION_SECRET` (generado), `RESEND_FROM_EMAIL`.
- **Webhook de producción de Stripe** creado apuntando a `https://lasernex.vercel.app/api/stripe-webhook` (evento `payment_intent.succeeded`) y **verificado en vivo** con una compra de prueba: firma verificada, stock decrementado, `receipt_email` fijado, entrega OK (`pending_webhooks: 0`).
- Dominio `lasernex.es` (y `www`) **añadido al proyecto y verificada la propiedad**.
- La tienda es accesible ya en **https://lasernex.vercel.app** (en modo TEST de Stripe: se puede "comprar" con tarjetas de prueba, no con tarjetas reales — es lo correcto hasta completar el paso a producción).

## ⚠️ Lo único que falta para que funcione en lasernex.es: cambiar 2 registros DNS

El dominio está comprado en **Dinahosting** y ahora mismo apunta a su IP de aparcamiento (`82.98.135.43`), no a Vercel. Hay que entrar en el panel de Dinahosting (dinahosting.com → "Mis servicios" → dominio lasernex.es → **Editar zona DNS / DNS**) y cambiar:

| Tipo | Nombre / Host | Valor actual | Valor nuevo (Vercel) |
|---|---|---|---|
| `A` | `@` (o `lasernex.es`, la raíz) | `82.98.135.43` | **`76.76.21.21`** |
| `CNAME` | `www` | (lo que haya) | **`cname.vercel-dns.com`** |

Guardar. La propagación tarda de unos minutos a un par de horas. En cuanto propague, `https://lasernex.es` servirá la tienda y Vercel emite el **certificado HTTPS automáticamente**. No hay que tocar nada más en Vercel.

> Si Dinahosting no deja poner un registro `A` en la raíz con ese valor, la alternativa es un registro `ALIAS`/`ANAME` de la raíz a `cname.vercel-dns.com` (Dinahosting sí soporta ALIAS). Cualquiera de las dos vale.

## Pendiente para el paso a producción real (vender con dinero de verdad)

1. **Claves LIVE de Stripe**: en Vercel, cambiar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` y `STRIPE_SECRET_KEY` de `pk_test`/`sk_test` a `pk_live`/`sk_live`, y crear un webhook LIVE en Stripe (modo live) apuntando a la misma URL, poniendo su `whsec` en `STRIPE_WEBHOOK_SECRET`. Redeploy.
2. **`RESEND_API_KEY`**: crear cuenta en Resend, verificar el dominio `lasernex.es` (SPF/DKIM), y poner la clave en Vercel para que se envíen los emails de confirmación de marca. Sin ella, el pedido y el recibo de Stripe funcionan igual; solo no sale el email con diseño propio de Lasernex.
3. **Domicilio fiscal** en las páginas legales (único dato que falta) y **datos fiscales en Stripe Invoicing** (NIF de Carla ya lo tenemos: 29517704X).
4. **Logo real** en Stripe → Configuración → Marca (para los recibos/checkout de Stripe).

## Cómo se hizo (referencia técnica)

El deploy se orquestó vía la API REST de Vercel con un token de cuenta completo. El `SHIP_NOTIFICATION_SECRET` generado está guardado en Vercel (encriptado); para dárselo a Carla y que dispare el email de "pedido enviado" (ver `OPERATIONS.md`), consúltalo en Vercel → Project → Settings → Environment Variables, o pídeselo a quien montó el deploy.

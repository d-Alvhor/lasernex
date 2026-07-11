# DEPLOY.md — Guía de despliegue en Vercel

> Para cuando alguien tenga acceso completo a la cuenta de Vercel correcta (la de `carlamansorojas@gmail.com`, la misma cuenta ya usada en Stripe — ver `CLAUDE.md`). El token `vck_...` que se dio en Fase 1 es de **solo lectura** y no sirve para crear el proyecto; hace falta un token con scope de cuenta completo, o hacerlo desde el dashboard.

## Opción recomendada: importar desde GitHub (deploy automático)

1. Entra en [vercel.com/new](https://vercel.com/new) con la cuenta correcta.
2. **Import Git Repository** → autoriza el acceso a GitHub si hace falta → selecciona `d-Alvhor/lasernex` (repo privado).
3. Framework: Vercel detecta **Next.js** solo. Directorio raíz: `.` (por defecto).
4. **Antes de pulsar Deploy**, añade las variables de entorno (botón "Environment Variables"), copiadas de `.env.example`:

   | Variable | Entorno | Valor |
   |---|---|---|
   | `NEXT_PUBLIC_URL` | Production | `https://lasernex.es` |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production | `pk_test_…` (test) — cambiar a `pk_live_…` en Fase 4 |
   | `STRIPE_SECRET_KEY` | Production | `sk_test_…` (test) — cambiar a `sk_live_…` en Fase 4 |
   | `STRIPE_WEBHOOK_SECRET` | Production | *(se genera en el paso 6, dejar vacío por ahora y volver a editarlo)* |
   | `STRIPE_CURRENCY` | Production | `eur` |
   | `NEXT_PUBLIC_LANGUAGE` | Production | `es-ES` |
   | `RESEND_API_KEY` | Production | *(cuando exista cuenta de Resend)* |
   | `RESEND_FROM_EMAIL` | Production | `Lasernex <pedidos@lasernex.es>` |
   | `SHIP_NOTIFICATION_SECRET` | Production | genera uno con `openssl rand -hex 32` y guárdalo también en `OPERATIONS.md`/donde la dueña lo consulte |

5. **Deploy**. Tarda ~1-2 minutos. Al terminar da una URL tipo `lasernex-xxxx.vercel.app` — pruébala antes de conectar el dominio.

6. **Conectar el dominio**: Project → Settings → Domains → añade `lasernex.es` (y `www.lasernex.es` si se quiere, con redirect). Vercel da 1-2 registros DNS (normalmente un `A` a `76.76.21.21` y/o un `CNAME`) — hay que darlos de alta en el panel del registrador donde se compró el dominio. Tarda de minutos a un par de horas en propagar.

7. **Configurar el webhook de Stripe en producción**: Dashboard de Stripe (mismo modo, test o live) → Developers → Webhooks → **Add endpoint** → URL: `https://lasernex.es/api/stripe-webhook` → eventos: al menos `payment_intent.succeeded`. Stripe da un `whsec_…` nuevo (distinto al de `stripe listen` en local) — pégalo en la variable `STRIPE_WEBHOOK_SECRET` de Vercel y haz un redeploy (Vercel → Deployments → ⋯ → Redeploy) para que se recoja.

8. **Prueba real**: compra de prueba completa con tarjeta de test `4242 4242 4242 4242`, cualquier fecha futura y CVC. Confirma que: el pedido aparece en Stripe, el webhook procesa (Stripe → Developers → Webhooks → ver intentos), llega el email de confirmación (si `RESEND_API_KEY` ya está puesta) y el recibo automático de Stripe.

## Alternativa: CLI (si alguien prefiere no usar GitHub)

Con un token de cuenta completo:

```bash
npx vercel login   # o: npx vercel --token <TOKEN_COMPLETO>
npx vercel link    # vincula esta carpeta a un proyecto de Vercel
npx vercel env add STRIPE_SECRET_KEY production   # repetir por cada variable de la tabla de arriba
npx vercel --prod  # despliega a producción
```

Esta vía **no** monta auto-deploy en cada push — hay que repetir `vercel --prod` manualmente cada vez, o conectar el repo desde el dashboard más tarde. Por eso se recomienda la Opción 1 (importar desde GitHub).

## Después del primer deploy

- Verificar cabeceras de seguridad reales: `curl -sI https://lasernex.es | grep -iE 'content-security|strict-transport'` (ver `SECURITY.md` §1).
- Verificar accesibilidad/rendimiento con [PageSpeed Insights](https://pagespeed.web.dev/) contra `https://lasernex.es` (Lighthouse no se pudo correr en local en esta sesión — ver `CLAUDE.md`).
- Dar de alta el sitio en [Google Search Console](https://search.google.com/search-console) y enviar `https://lasernex.es/sitemap.xml` (ver `SEO.md`).
- Seguir el resto de la checklist de `ROADMAP.md` Semana 4 antes de anunciar la tienda públicamente (claves live, licencia AGPL/Comercial resuelta, revisión legal).

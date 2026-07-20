# SECURITY.md — Lasernex

> Principio: la superficie de ataque es mínima por diseño (sin BD, sin auth, sin datos de tarjeta en nuestro dominio). Este documento cubre lo que SÍ es nuestro: cabeceras, webhook, secretos y rutas API.

---

## 1. Cabeceras de seguridad

Se configuran en `next.config.ts` (`headers()`) para TODAS las rutas. **Implementado y verificado en Fase 1** (`curl -sI` contra el build de producción local confirma las 6 cabeceras; el checkout con Stripe Elements se probó cargando sin errores de consola bajo esta CSP):

```ts
// next.config.ts — cabeceras de seguridad globales
// ⚠️ El checkout usa Stripe Elements EMBEBIDO, no una redirección a
// checkout.stripe.com (ver ADR-002 en ARCHITECTURE.md — corregido en Fase 1
// tras probar el flujo real). Por eso script-src/frame-src SÍ necesitan
// permitir explícitamente js.stripe.com/hooks.stripe.com.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com", // Next hidrata con inline + Stripe.js
      "style-src 'self' 'unsafe-inline'",  // Tailwind/inlineCss inyectan estilos inline
      "img-src 'self' https://files.stripe.com https://*.stripe.com https://*.blob.vercel-storage.com data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com", // Stripe.js llama directo a la API para tokenizar
      "frame-src https://js.stripe.com https://hooks.stripe.com", // 3D Secure / desafíos de Stripe Elements
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  // HSTS: fuerza HTTPS 2 años, incluye subdominios. Vercel ya sirve HTTPS;
  // esto evita el primer request en claro. Añadir a preload list tras Fase 4.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },            // redundante con frame-ancestors, pero cubre navegadores viejos
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" }, // payment=(self): Elements puede necesitarlo para Apple/Google Pay
];
```

**Verificación (Fase 4, en producción real)**: `curl -sI https://lasernex.es | grep -iE 'content-security|strict-transport|x-frame'` + [securityheaders.com](https://securityheaders.com) → objetivo nota A.

> **Nota — `'unsafe-inline'` en `script-src` es deliberado**: Next hidrata con scripts inline y migrar a nonces/hashes tiene un coste (plumbing en cada render + riesgo de romper Stripe.js) que no compensa en esta superficie (sin contenido generado por usuarios, sin auth). No lo "arregles" sin medir antes el beneficio real.

---

## 2. Webhook de Stripe: verificación de firma (obligatoria)

El webhook **no** es la única ruta con efectos (ver §3-4 para `ship` y `revalidate`), pero sí la más crítica (email de confirmación, cobro). **Nunca** se procesa un evento sin verificar la firma. Patrón para App Router:

```ts
// app/api/stripe-webhook/route.ts
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  // 1. Cuerpo CRUDO: la firma se calcula sobre los bytes exactos.
  //    No usar req.json() antes de verificar.
  const payload = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) return new Response("Falta firma", { status: 400 });

  let event: Stripe.Event;
  try {
    // 2. constructEvent verifica firma HMAC y tolerancia de timestamp (5 min)
    //    → protege contra manipulación y contra replay attacks.
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return new Response("Firma inválida", { status: 400 });
  }

  // 3. Idempotencia: Stripe puede reenviar eventos. El envío de email debe
  //    tolerar duplicados (Resend con header Idempotency-Key = event.id).
  switch (event.type) {
    case "payment_intent.succeeded":
      // enviar email de confirmación vía Resend (Fase 3). El checkout real es
      // Stripe Elements embebido sobre un PaymentIntent (ADR-002), no Checkout
      // Session hosted: por eso el evento es payment_intent.succeeded, no
      // checkout.session.completed.
      break;
    case "product.created":
    case "product.updated":
      // auto-slug + revalidateTag("product") — ver código real del webhook.
      break;
    default:
      // Evento no manejado: 200 para que Stripe no reintente.
      break;
  }
  return new Response("ok", { status: 200 });
}
```

Reglas:
- Responder **rápido** (<10 s) y en 2xx; el trabajo pesado, tras responder o tolerando reintentos.
- En local se prueba con `stripe listen --forward-to localhost:3000/api/stripe-webhook` (el CLI da su propio `whsec_…`).
- Un `STRIPE_WEBHOOK_SECRET` **distinto por entorno** (el de producción se genera al crear el endpoint en el Dashboard).
- **Idempotencia de emails — riesgo residual aceptado**: la deduplicación usa el `Idempotency-Key` de Resend, cuya ventana es de **24 h**, mientras que Stripe reintenta eventos hasta **~3 días**. Un reintento más allá de las 24 h podría producir un email duplicado. Es un riesgo puramente cosmético (nunca un doble cobro) y se acepta; no añadir BD/estado propio para cerrarlo.

---

## 3. Secretos: qué claves usa cada entorno

| Variable | Test (local + preview) | Producción | Expuesta al cliente |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` | `sk_live_…` | ❌ nunca |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` | `pk_live_…` | ✅ (es pública por diseño) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (CLI / endpoint test) | `whsec_…` (endpoint live) | ❌ |
| `RESEND_API_KEY` | clave de test/sandbox | clave live (dominio verificado) | ❌ |
| `NEXT_PUBLIC_URL` | `http://localhost:3000` / URL preview | `https://lasernex.es` | ✅ |
| `SHIP_NOTIFICATION_SECRET` | token de prueba | token real, distinto | ❌ (va en la URL del enlace de "pedido enviado", solo la dueña la tiene) |
| `STORE_REFRESH_SECRET` | token de prueba | token real, distinto | ❌ (va en la URL del enlace de "refrescar tienda", solo la dueña la tiene) |
| `TRIEVE_API_KEY` | opcional (solo si se usa el buscador) | opcional | ❌ |

Gestión en Vercel:
- Los secretos se meten en **Vercel → Settings → Environment Variables**, marcando el entorno (`Production` / `Preview` / `Development`). **Nunca** en el repo.
- `.env.local` (gitignored) para desarrollo; `.env.example` en el repo **sin valores**, solo nombres documentados.
- Las claves live se introducen SOLO en Fase 4 (checklist de lanzamiento) y solo en `Production`.
- Si una clave se filtra: revocar/rotar en el Dashboard de Stripe (Roll key) y en Resend; Vercel redeploya al cambiarla.
- **Tokens de `ship`/`revalidate` viajan por GET — riesgo aceptado**: `SHIP_NOTIFICATION_SECRET` y `STORE_REFRESH_SECRET` van en la URL (query string), así que aparecen en los logs de Vercel y en el historial del navegador de la dueña. Se acepta por usabilidad (la dueña solo hace clic en un enlace, sin formularios ni cabeceras) y porque el daño potencial es bajo (email de envío / refresco de caché, no dinero). `revalidate` sigue siendo un único GET (su único efecto es refrescar caché, sin coste). `ship` dejó de serlo (2026-07-21): el GET solo enseña una página de confirmación sin efecto — hace falta además un POST (clic real en el botón) para enviar el email. Esto evita que un escáner de seguridad de email o una vista previa de enlace dispare el aviso solo con visitar la URL; el token filtrado por sí solo ya no basta para accionar el envío. **Procedimiento si se sospecha fuga**: rotar el secreto en las variables de entorno de Vercel (redeploya solo) y regenerar los enlaces guardados.
- Regla de PR: ningún commit puede contener `sk_live`, `sk_test`, `whsec_` ni `re_` (grep en revisión; opcional hook de pre-commit).

---

## 4. Rate limiting en rutas API

Contexto real (no hay Checkout Session hosted, ver ADR-002): las rutas/acciones con efectos son (1) el webhook, (2) `findOrCreateCartIdFromCookiesAction` (Server Action que crea el PaymentIntent/carrito), (3) `addToCartAction` (añade líneas y escribe metadata de personalización en el PaymentIntent), (4) `/api/orders/[paymentIntentId]/ship` (dispara email de envío) y (5) `/api/revalidate` (refresca el catálogo). Sin Redis/BD propios (presupuesto 0), la defensa es por capas:

1. **Webhook**: no necesita rate limit clásico — la firma HMAC rechaza cualquier tráfico que no venga de Stripe con coste ~0. Devuelve 401 inmediato.
2. **Creación de carrito/PaymentIntent, `addToCartAction`, `ship` y `revalidate`**: limitador **best-effort en memoria** por IP, **implementado** en `src/lib/rate-limit.ts` y aplicado en los cuatro puntos (el coste del abuso es bajo: crear carritos no cobra dinero; `ship`/`revalidate` están además protegidos por un secreto compartido comparado en tiempo constante):

```ts
// src/lib/rate-limit.ts — best-effort por instancia serverless (sin dependencias).
// Suficiente para <100 pedidos/mes; si algún día hay abuso real,
// migrar a Vercel WAF o Upstash (tiene capa gratuita).
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit; // false → responder 429
}
```

3. **Vercel** aporta mitigación DDoS de plataforma en todas las capas (gratuita).
4. Validación estricta de entrada con **Zod** en toda ruta API: cantidades (1–99), `price_id` con formato `price_…` y verificado contra Stripe antes de crear el PaymentIntent (nunca se aceptan precios/importes del cliente).

---

## 5. Matriz de responsabilidad

| Riesgo | Lo cubre | Nosotros hacemos |
|---|---|---|
| Datos de tarjeta, PCI-DSS | **Stripe** (Elements embebido, SAQ A-EP — ver ADR-002) | No tocar jamás datos de tarjeta |
| 3D Secure / SCA (PSD2) | **Stripe** | Nada (automático vía Stripe Elements/PaymentIntent) |
| Fraude en pagos | **Stripe Radar** | Revisar avisos en Dashboard |
| HTTPS/TLS, certificados | **Vercel** | Forzar HSTS |
| DDoS de red | **Vercel** | Rate limit aplicativo best-effort |
| Parcheo de SO/runtime | **Vercel** | Mantener deps de `package.json` al día (Dependabot) |
| Entregabilidad y spoofing de email | **Resend** + DNS | Configurar SPF/DKIM/DMARC en lasernex.es |
| Falsificación de pedidos (webhook) | — | **Nuestro**: verificación de firma (§2) |
| Manipulación de precios/carrito | — | **Nuestro**: precios siempre desde Stripe, validación Zod (§4) |
| XSS / clickjacking / inyección | — | **Nuestro**: CSP + cabeceras (§1), sin `dangerouslySetInnerHTML` con datos externos |
| Secretos filtrados | — | **Nuestro**: §3, rotación inmediata |
| GDPR/LSSI (textos, consentimiento) | — | **Nuestro**: ver `src/app/(store)/legal/*` (fuente de verdad viva) |

**Lo que NO existe aquí y por tanto no es riesgo**: contraseñas de usuarios, sesiones de login, BD inyectable (no hay SQL), panel de administración propio.

---

## 6. Auditoría (Fase 4)

- [ ] securityheaders.com → A
- [ ] Webhook: petición sin firma → 400; con firma inválida → 400; replay >5 min → 400
- [ ] Intento de checkout con `price_id` inexistente o cantidad 0/negativa → 4xx limpio
- [ ] `git log -p | grep -cE 'sk_(test|live)|whsec_|re_[A-Za-z0-9]{20,}'` → 0
- [ ] npm audit / `bun audit` sin críticas
- [ ] Claves live solo en Vercel Production; test en Preview/Development

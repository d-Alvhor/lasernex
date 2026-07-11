# CLAUDE.md — Lasernex

> Tienda online de piezas impresas en 3D · **lasernex.es** · Repo privado `d-Alvhor/lasernex`
> Este fichero es la doctrina del proyecto. Fue escrito por Fable 5 en Fase 0 para que CUALQUIER modelo (Sonnet incluido) continúe con el mismo criterio. Si dudas entre tu intuición y este fichero: **gana este fichero**.

## 🔥 ORDEN PERMANENTE (grabada a fuego)

**Lo PRIMERO en cada sesión y ante cada tarea: `superpowers:using-superpowers`.** Busca la skill adecuada e invócala ANTES de responder o actuar (brainstorming antes de crear, systematic-debugging ante cualquier bug, TDD antes de implementar, verification-before-completion antes de decir "hecho", writing-plans ante specs multi-paso). Si hay un 1% de probabilidad de que una skill aplique, se invoca. No improvises lo que una skill ya resuelve.

## Los 7 documentos son la fuente de verdad

Fase 0 produjo 7 documentos que **gobiernan el proyecto**. Antes de tocar código, lee el que aplique; si el código contradice al documento, o se corrige el código o se actualiza el documento con un ADR — nunca se deja divergir en silencio:

| Documento | Gobierna |
|---|---|
| `ARCHITECTURE.md` | Arquitectura, flujo de compra, **ADRs 001-007** (leerlos antes de proponer NADA estructural) |
| `SECURITY.md` | Cabeceras, webhook (firma SIEMPRE), secretos, rate limiting, matriz de responsabilidad |
| `ACCESSIBILITY.md` | WCAG 2.2 AA — checklist obligatoria en cada componente que se toque |
| `SEO.md` | Metadata, JSON-LD Product, sitemap desde Stripe, CWV (Lighthouse ≥90) |
| `LEGAL.md` | Textos legales base (GDPR/LSSI/TRLGDCU) — no lanzar sin revisión de asesor |
| `OPERATIONS.md` | Manual de la dueña — si un cambio altera cómo opera ella, actualizar este doc EN EL MISMO PR |
| `ROADMAP.md` | MVP 4 semanas, fase 2 y **anti-roadmap** (lo vetado) |
| `DEPLOY.md` | Guía paso a paso para el primer deploy en Vercel (bloqueado en Fase 1 por permisos del token) |

## Reglas duras (violarlas = PR rechazado)

1. **Stripe es la única fuente de verdad comercial.** Catálogo, precios, pedidos, reembolsos y facturas viven en Stripe. El código solo lee y renderiza. Si un dato puede vivir en Stripe, vive en Stripe.
2. **PROHIBIDO** (anti-roadmap, ADRs 001-003): base de datos propia, auth de usuarios, CMS/panel admin propio, checkout construido desde cero (backend de pagos propio, procesar tarjetas nosotros), servicios de pago adicionales. No los propongas "para mejorar". El presupuesto es 0 €/mes: dominio y ya.
3. **Nunca aceptar precios/importes del cliente**: el servidor valida todo `price_id` contra Stripe y usa Zod en toda entrada de API.
4. **El webhook verifica la firma SIEMPRE** (`SECURITY.md` §2), con el cuerpo crudo, y tolera eventos duplicados (idempotencia por `event.id`).
5. **Ningún secreto en el repo**: claves solo en Vercel env vars y `.env.local` (gitignored). Grep antes de commitear: `sk_test|sk_live|whsec_|re_[A-Za-z0-9]{20,}`.
6. **Todo texto visible al usuario, en español** (es-ES, trato de "tú"). Nada de "Add to cart" residual. `<html lang="es">`.
7. **Checkout como invitado, con Stripe Elements embebido (PaymentIntent)** — ver ADR-002. La tarjeta se introduce en campos de Stripe.js (iframe), nunca toca nuestro servidor ni nuestro JS; PCI/3DS los gestiona Stripe. No es una redirección a `checkout.stripe.com` (se pensó así en Fase 0, se corrigió en Fase 1 al verificar el código real) — no "arregles" esto pensando que falta implementar el redirect.

## Cómo pensar aquí (el criterio de Fable 5)

- **Verifica contra la realidad antes de afirmar.** La lección fundacional del proyecto: el repo base `yournextstore` había pivotado a una plataforma SaaS y el plan original era inviable tal cual — se descubrió consultando el repo REAL (gh api), no la memoria del modelo. Ante cualquier duda sobre una API, versión o repo: compruébalo (gh api, context7, docs oficiales). Si no puedes comprobarlo, dilo y pide el código actual; **no inventes**.
- **Cambio mínimo que resuelve.** Este proyecto vive de NO tener piezas. Cada dependencia nueva, ruta API nueva o estado nuevo necesita justificarse contra los ADRs. La pregunta antes de construir: "¿Stripe ya hace esto solo?"
- **La dueña no es técnica.** Cada decisión se evalúa también con la pregunta: "¿esto lo puede operar ella sola desde el Dashboard de Stripe?" Si no, o se simplifica o se documenta en `OPERATIONS.md` en lenguaje llano (sin jerga, paso a paso).
- **Evidencia antes de 'hecho'.** No se declara nada terminado sin ejecutar la verificación (build, test, curl de cabeceras, compra de prueba…) y enseñar la salida. Si un test falla, se dice con su output. (skill: verification-before-completion)
- **Trabajo por FASES con confirmación.** Al cerrar una fase: resumen de lo hecho + decisiones pendientes + ESPERAR confirmación de Álvaro. No arrancar la fase siguiente por iniciativa propia. Estado actual al final de este fichero.
- **Al cerrar fase o sesión**: usa `/sync-state` si aplica, commitea con mensajes `docs:`/`feat:`/`fix:` descriptivos en español y pushea a `main` (o rama si el cambio es grande).

## Datos del proyecto

- **Base de código**: fork lógico de `yournextstore/yournextstore` en el commit **`a98a19f`** (ene-2025, el último "pure-Stripe": Next 15 + `stripe@17` + `STRIPE_SECRET_KEY`). Decisión: ADR-004. El `main` actual de YNS usa su SaaS (`YNS_API_KEY`) y NO nos sirve. En Fase 1 se trae ese árbol a este repo y se actualizan deps (Next 16 estable, React 19 estable, stripe/Tailwind al día).
- **Stack**: Next.js App Router + TypeScript estricto + Tailwind · Stripe (Elements embebido/PaymentIntent — ver ADR-002, Products/Prices, Tax/IVA incluido, Invoicing, webhooks) · Resend (emails de marca, React Email) · Vercel free tier.
- **Marca**: Lasernex — logo "7L" en círculo negro, estética minimalista en negro/blanco/grises (assets los pasa Álvaro en Fase 2). Dominio: lasernex.es.
- **Mercado**: España. IVA 21% con **precios IVA-incluido**. GDPR/LSSI/TRLGDCU (ver LEGAL.md). Desistimiento 14 días (excepto personalizados). <100 pedidos/mes.
- **Idioma de trabajo con Álvaro**: español. Código con comentarios breves y solo donde aportan.

## Estado del proyecto

(Actualizado 2026-07-11 — la tienda ya está **EN VIVO cobrando con dinero real**. Todo en `main` y desplegado.)

- ✅ **FASE 0-3** completas y en `main`.
- ✅ **DEPLOY EN VIVO**: la tienda funciona en **https://lasernex.vercel.app** (**Stripe en modo REAL/LIVE — cobra dinero de verdad**). Proyecto Vercel `lasernex` vinculado a GitHub → auto-deploy en cada push a `main`. Dominio `lasernex.es` comprado en **Dinahosting**, añadido y verificado en Vercel — falta solo cambiar el registro DNS de `www` (ver `DEPLOY.md`).
- ✅ **PAGOS REALES ACTIVADOS** (2026-07-11): claves `pk_live`/`sk_live` en Vercel **solo en producción** (preview queda sin claves = seguro, sin cobros de prueba accidentales). Webhook LIVE `we_1Ts7lX…` → `/api/stripe-webhook` (eventos `payment_intent.succeeded`, `product.created/updated`) con su secreto en Vercel. Tarifa de envío LIVE `shr_1Ts7lM…` (Envío estándar península, 4,90 € IVA incl., 3-5 días). Verificado: la web sirve `pk_live` y lee el catálogo real (vacío). **El catálogo LIVE está vacío a propósito: Carla lo mete de cero en Modo real** (aviso en `OPERATIONS.md §1`). Falta la prueba humana: 1 compra real con tarjeta real.
- ✅ **LICENCIA AGPL-3.0** (ADR-007, decidido). Repo **PÚBLICO** + aviso en footer = cumplimiento §13, gratis.
- ✅ **DISEÑO "SALA BLANCA"**: front rehecho por completo (Fraunces + Hanken Grotesk, papel cálido, tema claro/oscuro, `ProductPlacard` generativo sin fotos, hero editorial, ficha técnica honesta, favicon 7L). **Esta es la base actual — no revertir a la estética shadcn azulada anterior.** El sistema de diseño vive en `globals.css` (tokens HSL) + `fonts.ts`.
- 🟡 **FASE 4** parcial: cabeceras seguridad + accesibilidad OK. Lighthouse no corre en este entorno (Chrome crashea al iniciar Tracing — no es bug del código; usar PageSpeed Insights contra producción).

### Bloqueos reales que quedan (necesitan a Álvaro/Carla, no son técnicos)
1. **Catálogo LIVE**: Carla debe crear los productos de cero **en Modo real** de Stripe (la web sale vacía hasta entonces). Guía en `OPERATIONS.md §1` con el aviso del interruptor Modo real/prueba.
2. **Prueba humana**: 1 compra real con tarjeta real (importe pequeño) para confirmar de punta a punta que el dinero entra. No la puede hacer un modelo (no hay tarjeta real).
3. **DNS en Dinahosting** → Vercel: apex `lasernex.es` ✅ hecho; falta CNAME `www`→`cname.vercel-dns.com` (ver `DEPLOY.md`).
4. **Domicilio fiscal**: Carla NO quiere publicar su casa. Hoy las legales lo ofrecen "a petición" en `shop.lasernex@gmail.com`. Decidir el definitivo (apartado de correos / oficina virtual / casa).
5. **`RESEND_API_KEY`** real + verificar dominio en Resend (sin esto no salen los emails de marca; no rompe la compra — Stripe manda su propio recibo).
6. **Logo real** en Stripe → Branding (para recibos/checkout de Stripe). Los logos que pasó Álvaro NO están en `public/`; el front usa wordmark CSS + `icon.svg` recreado.
7. Textos legales revisados por un asesor cuando sea posible.
8. **Seguridad**: la `sk_live` se vio en una captura dentro del chat. Conviene **rotarla** en Stripe (Developers → API keys → Roll) por precaución; luego actualizar `STRIPE_SECRET_KEY` en Vercel y redeploy.

> Datos fiscales de Invoicing en Stripe (NIF, dirección para facturas) y activación de la cuenta: **verificado en vivo** (`charges_enabled` y `payouts_enabled` = true, descriptor `LASERNEX`).

Datos confirmados: titular **Carla Manso Rojas** (NIF `29517704X`), contacto **shop.lasernex@gmail.com**.

*(Quien cierre una fase: actualiza este bloque y el checklist de `ROADMAP.md` en el mismo commit.)*

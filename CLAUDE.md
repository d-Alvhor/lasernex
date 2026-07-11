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

(Actualizado 2026-07-11 por Sonnet 5, tras una sesión larga de Fases 1-4 en autónomo. `main` ya tiene todo esto mergeado y pusheado.)

- ✅ **FASE 0** — 7 documentos + `CLAUDE.md` (Fable 5)
- ✅ **FASE 1** — Código traído y actualizado (ver ADR-006), auth propio eliminado, Stripe test con producto/precio/tarifa de envío, flujo completo probado en navegador. **Único pendiente real**: deploy en Vercel (ver bloqueo abajo). Dominio lasernex.es **ya comprado por Álvaro**.
- ✅ **FASE 2** — Marca Lasernex aplicada (wordmark tipográfico, hero oscuro), traducción es-ES 100% real (incluido checkout/envío/país, no solo placeholder), páginas legales `/legal/*` + footer, `/sobre-nosotros` y `/como-se-fabrican`. Falta: logo real (hoy vacío en Stripe → Branding) y fotos reales de producto/proceso.
- ✅ **FASE 3** — Webhook verificado con Stripe CLI end-to-end; Resend integrado (código completo, falta `RESEND_API_KEY` real); **bug real corregido**: `receipt_email` nunca se fijaba, así que Stripe nunca hubiera mandado su recibo automático pese a prometerlo en `condiciones` — arreglado y verificado con compra de prueba real; mecanismo "pedido enviado" sin panel propio (ADR-003). Falta: Invoicing con NIF real, dominio verificado en Resend.
- 🟡 **FASE 4** (parcial) — Cabeceras de seguridad implementadas y verificadas; pasada de accesibilidad hecha (skip link que faltaba, textos de lector de pantalla sueltos en inglés, contraste verificado con fórmula WCAG real). **Lighthouse no se pudo correr**: Chrome crashea (`Inspector.targetCrashed`) al iniciar Tracing en este entorno sandboxed — probado con 5+ combinaciones de flags, no es un bug del código. Pendiente para cuando alguien lo corra en una máquina normal o contra producción real.

### Bloqueos reales (no técnicos, necesitan a Álvaro/Carla)
1. **Deploy en Vercel**: el token que se dio (`vck_...`) es de **solo lectura** (confirmado con CLI y API REST: crear proyecto da 403 forbidden). Hace falta un token de acceso completo (vercel.com/account/tokens, scope de cuenta completo) o hacerlo directamente desde el dashboard de Vercel importando el repo `d-Alvhor/lasernex` de GitHub (más recomendable: así queda auto-deploy en cada push a `main`).
2. **`RESEND_API_KEY` real** + dominio lasernex.es verificado en Resend (SPF/DKIM) — sin esto los emails de marca no se envían (no rompe nada, solo se loguea un aviso).
3. **Invoicing en Stripe**: NIF/CIF y datos fiscales reales del titular.
4. **Logo real** en Stripe → Configuración → Marca, y fotos reales de producto/proceso de fabricación.
5. **ADR-007 (licencia AGPL/Comercial de YNS)**: decisión legal pendiente antes de lanzar en público — ver `ARCHITECTURE.md`.
6. Textos legales (`LEGAL.md`, placeholders `[TITULAR]`/`[NIF]`/etc.) revisados por un asesor con los datos fiscales reales.

*(Quien cierre una fase: actualiza este bloque y el checklist de `ROADMAP.md` en el mismo commit.)*

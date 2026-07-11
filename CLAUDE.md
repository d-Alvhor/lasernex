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

- ✅ **FASE 0** — 7 documentos + este CLAUDE.md (2026-07-11, Fable 5)
- ⏳ **FASE 1** (rama `fase-1-setup`, worktree `.worktrees/fase-1-setup`) — Hecho y verificado en local con claves de test reales: código base traído, deps actualizadas (ver ADR-006), auth propio eliminado, producto + precio + tarifa de envío de prueba creados en Stripe test, flujo catálogo→producto→carrito→método de envío probado de principio a fin en el navegador. Pendiente: deploy en Vercel + dominio lasernex.es (falta comprar el dominio — ver `OPERATIONS.md`/decisión pendiente con Álvaro sobre dónde).
- ⬜ FASE 2 — Marca, español, legales, "Sobre nosotros"/"Cómo se fabrican"
- ⬜ FASE 3 — Webhook + Resend + Invoicing + "pedido enviado"
- ⬜ FASE 4 — Auditorías, Lighthouse ≥90, paso a live, formación de la dueña

*(Quien cierre una fase: actualiza este bloque y el checklist de `ROADMAP.md` en el mismo commit.)*

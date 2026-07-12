# CLAUDE.md — Lasernex · **fichero canónico de agentes**

> Tienda online de piezas impresas en 3D · **lasernex.es** · Repo **público** `d-Alvhor/lasernex` (AGPL-3.0, §13).
> Esta es la doctrina del proyecto. La escribió Fable 5 en Fase 0 y la mantiene vitaminada para que **CUALQUIER agente** —Claude, Codex, Gemini, Cursor, Copilot, un humano— continúe con el mismo criterio. Si dudas entre tu intuición y este fichero: **gana este fichero**.

## 📎 Un solo cerebro para todos los agentes

Este fichero es la **fuente única de instrucciones**. Los demás formatos de agente son **enlaces simbólicos** a él, no copias — se editan aquí y solo aquí:

| Fichero | Lo lee | Es |
|---|---|---|
| `CLAUDE.md` | Claude Code / Claude en IDE | **canónico (este)** |
| `AGENTS.md` | Codex, Cursor, Aider, Jules, Zed… (estándar abierto) | symlink → `CLAUDE.md` |
| `GEMINI.md` | Gemini CLI | symlink → `CLAUDE.md` |

Si editas la doctrina, edita `CLAUDE.md`. Nunca dupliques su contenido en otro sitio: la réplica silenciosa es deuda. (En Windows o con `core.symlinks=false` un symlink se ve como un fichero de una línea con la ruta destino; en Mac/Linux se resuelve solo.)

## 🚀 Protocolo de arranque (30 segundos, haz esto ANTES de nada)

1. **Activa tu sistema de skills/procedimientos.** Si eres Claude Code: invoca `superpowers:using-superpowers` lo PRIMERO. Si eres Codex o Gemini: las skills de Superpowers también cargan en tu entorno (Codex nativo; Gemini vía `activate_skill`) — úsalas igual. Sea cual sea tu runtime, la regla es la misma: **busca el procedimiento adecuado y aplícalo antes de responder o actuar**. Si hay un 1 % de probabilidad de que una skill/procedimiento aplique, se usa.
2. **Lee el documento de gobierno que aplique** a tu tarea (tabla abajo) antes de tocar código.
3. **Interioriza las 7 reglas duras.** Violar una = trabajo rechazado.
4. **Verifica contra la realidad, no contra tu memoria** (API, versión, repo, estado de Stripe/Vercel): `gh api`, `context7`, docs oficiales. Si no puedes comprobarlo, dilo; **no inventes**.
5. **Trabaja por fases y con evidencia.** Nada es "hecho" sin ejecutar la verificación y enseñar su salida.

### 🚩 Antipatrones (si te descubres pensando esto, PARA)
- "Monto una base de datos / login / panel de admin para mejorarlo" → **vetado** (regla 2). La gestión es el Dashboard de Stripe.
- "Reescribo el checkout / lo mando a checkout.stripe.com" → **no**, es Elements embebido a propósito (regla 7, ADR-002).
- "Acepto el precio que manda el cliente" → **nunca** (regla 3): el precio se valida contra Stripe.
- "Escribo texto de UI en inglés y ya lo traduzco" → **no**, es-ES desde el primer carácter (regla 6).
- "Creo que la API funciona así" sin comprobarlo → **verifica** (lección fundacional, abajo).
- "Digo que está hecho porque debería funcionar" → **enseña la salida** de build/test/curl primero.

## Los documentos de gobierno son la fuente de verdad

Fase 0 produjo los documentos que **gobiernan el proyecto**. Antes de tocar código, lee el que aplique; si el código contradice al documento, o se corrige el código o se actualiza el documento con un ADR — **nunca se deja divergir en silencio**:

| Documento | Gobierna |
|---|---|
| `ARCHITECTURE.md` | Arquitectura, flujo de compra, **ADRs 001-007** (leerlos antes de proponer NADA estructural) |
| `SECURITY.md` | Cabeceras, webhook (firma SIEMPRE), secretos, rate limiting, matriz de responsabilidad |
| `ACCESSIBILITY.md` | WCAG 2.2 AA — checklist obligatoria en cada componente que se toque |
| `SEO.md` | Metadata, JSON-LD Product, sitemap desde Stripe, CWV (Lighthouse ≥90) |
| `src/app/(store)/legal/*` | Textos legales EN VIVO (GDPR/LSSI/TRLGDCU) — son la fuente de verdad, no un doc aparte. Cualquier cambio de datos del titular pasa por revisión de asesor. |
| `OPERATIONS.md` | Manual de la dueña — si un cambio altera cómo opera ella, actualizar este doc EN EL MISMO PR |
| `ROADMAP.md` | MVP 4 semanas, fase 2 y **anti-roadmap** (lo vetado) |

Los detalles de infraestructura de deploy (dominio, DNS, cuentas) se llevan en privado — no en el repo público.

## Reglas duras (violarlas = PR rechazado)

1. **Stripe es la única fuente de verdad comercial.** Catálogo, precios, pedidos, reembolsos y facturas viven en Stripe. El código solo lee y renderiza. Si un dato puede vivir en Stripe, vive en Stripe.
2. **PROHIBIDO** (anti-roadmap, ADRs 001-003): base de datos propia, auth de usuarios, CMS/panel admin propio, checkout construido desde cero (backend de pagos propio, procesar tarjetas nosotros), servicios de pago adicionales. No los propongas "para mejorar". El presupuesto es 0 €/mes: dominio y ya.
3. **Nunca aceptar precios/importes del cliente**: el servidor valida todo `price_id` contra Stripe y usa Zod en toda entrada de API.
4. **El webhook verifica la firma SIEMPRE** (`SECURITY.md` §2), con el cuerpo crudo, y tolera eventos duplicados (idempotencia por `event.id`).
5. **Ningún secreto en el repo**: claves solo en Vercel env vars y `.env.local` (gitignored). Grep antes de commitear: `sk_test|sk_live|whsec_|re_[A-Za-z0-9]{20,}`.
6. **Todo texto visible al usuario, en español** (es-ES, trato de "tú"). Nada de "Add to cart" residual. `<html lang="es">`.
7. **Checkout como invitado, con Stripe Elements embebido (PaymentIntent)** — ver ADR-002. La tarjeta se introduce en campos de Stripe.js (iframe), nunca toca nuestro servidor ni nuestro JS; PCI/3DS los gestiona Stripe. No es una redirección a `checkout.stripe.com` (se pensó así en Fase 0, se corrigió en Fase 1 al verificar el código real) — no "arregles" esto pensando que falta implementar el redirect.

## Cómo pensar aquí (el criterio de Fable 5)

- **Verifica contra la realidad antes de afirmar.** La lección fundacional del proyecto: el repo base `yournextstore` había pivotado a una plataforma SaaS y el plan original era inviable tal cual — se descubrió consultando el repo REAL (`gh api`), no la memoria del modelo. Ante cualquier duda sobre una API, versión o repo: compruébalo (`gh api`, context7, docs oficiales). Si no puedes comprobarlo, dilo y pide el código actual; **no inventes**.
- **Cambio mínimo que resuelve.** Este proyecto vive de NO tener piezas. Cada dependencia nueva, ruta API nueva o estado nuevo necesita justificarse contra los ADRs. La pregunta antes de construir: "¿Stripe ya hace esto solo?"
- **La dueña no es técnica.** Cada decisión se evalúa también con la pregunta: "¿esto lo puede operar ella sola desde el Dashboard de Stripe?" Si no, o se simplifica o se documenta en `OPERATIONS.md` en lenguaje llano (sin jerga, paso a paso).
- **Evidencia antes de 'hecho'.** No se declara nada terminado sin ejecutar la verificación (build, test, curl de cabeceras, compra de prueba…) y enseñar la salida. Si un test falla, se dice con su output. (skill: verification-before-completion)
- **Trabajo por FASES con confirmación.** Al cerrar una fase: resumen de lo hecho + decisiones pendientes + ESPERAR confirmación de Álvaro. No arrancar la fase siguiente por iniciativa propia. Estado actual al final de este fichero.
- **Al cerrar fase o sesión**: usa `/sync-state` si aplica, commitea con mensajes `docs:`/`feat:`/`fix:` descriptivos en español y pushea a `main` (o rama si el cambio es grande). Cuerpo de commit ≤100 caracteres por línea; termina con `Co-Authored-By`.

## Datos del proyecto

- **Base de código**: fork lógico de `yournextstore/yournextstore` en el commit **`a98a19f`** (ene-2025, el último "pure-Stripe": Next 15 + `stripe@17` + `STRIPE_SECRET_KEY`). Decisión: ADR-004. El `main` actual de YNS usa su SaaS (`YNS_API_KEY`) y NO nos sirve. `commerce-kit` está **clavado en 0.0.39** (ADR-006): desde ~0.10.0 depende del SaaS de YNS. No hay upstream del que traer mejoras: el mantenimiento (parches de seguridad de Next/React/stripe) recae en este árbol.
- **Stack**: Next.js 16 App Router + TypeScript estricto (5.9.3) + Tailwind 4 · Stripe vía `commerce-kit@0.0.39` (Elements embebido/PaymentIntent — ver ADR-002, Products/Prices, Tax/IVA incluido, Invoicing, webhooks) · Resend (emails de marca, React Email) · Vercel free tier. Gestor: **bun**. Lint: **biome**. Tests: **vitest**.
- **Marca**: Lasernex — logo "7L" en círculo negro, estética minimalista. Dominio: lasernex.es. Diseño actual **"Sala Blanca"** (Fraunces + Hanken Grotesk, papel cálido, tema claro/oscuro, `ProductPlacard` generativo) — tokens en `globals.css`, fuentes en `fonts.ts`. **No revertir** a la estética shadcn azulada anterior.
- **Mercado**: España. IVA 21% con **precios IVA-incluido**. GDPR/LSSI/TRLGDCU (ver `src/app/(store)/legal/*`, fuente de verdad viva). Desistimiento 14 días (excepto personalizados). <100 pedidos/mes.
- **Idioma de trabajo con Álvaro**: español. Código con comentarios breves y solo donde aportan.

## Estado del proyecto

La tienda está **en producción, desplegada y operativa**. El seguimiento detallado de estado (IDs de infraestructura, bloqueos operativos, datos fiscales, incidencias de seguridad) se lleva **fuera de este repo público** — en el histórico privado del equipo, no en `CLAUDE.md`. Si necesitas contexto operativo actual (deploy, DNS, claves, catálogo), pregunta directamente en vez de asumir que este fichero lo tiene: un repo público no es el sitio para llevar ese registro.

*(Quien cierre una fase: actualiza el checklist de `ROADMAP.md`. El estado operativo detallado vive en canales privados, no aquí.)*

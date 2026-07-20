# ARCHITECTURE.md — Lasernex

> Tienda online de piezas impresas en 3D · lasernex.es
> Stack: Next.js (App Router, TypeScript estricto, Tailwind) + Stripe + Resend + Vercel
> Principio rector: **cero infraestructura propia**. Sin base de datos, sin servidor, sin autenticación de usuarios. Stripe es la única fuente de verdad.

---

## 1. Diagrama de arquitectura

```mermaid
flowchart TB
    subgraph Cliente["🧑 Cliente (navegador)"]
        A[Catálogo /] --> B["Página de producto /product/[slug]"]
        B --> C[Carrito<br/>cookie firmada, sin BD]
    end

    subgraph Vercel["▲ Vercel (capa gratuita) — lasernex.es"]
        direction TB
        N[Next.js App Router<br/>RSC + ISR/cache]
        W["/api/stripe-webhook<br/>verificación de firma"]
        S[Sitemap dinámico<br/>robots.txt · JSON-LD]
    end

    subgraph Stripe["💳 Stripe (fuente de verdad)"]
        direction TB
        P[Products + Prices<br/>= catálogo<br/>gestionado por la dueña<br/>desde el Dashboard]
        CK[PaymentIntent<br/>+ Stripe Elements embebido<br/>3DS · PCI · envío]
        T[Stripe Tax / IVA 21%]
        I[Recibos + Invoicing<br/>facturas ES]
        E[payment_intent.succeeded<br/>y demás eventos]
    end

    subgraph Resend["📧 Resend"]
        R1[Email confirmación de pedido]
        R2[Email pedido enviado]
    end

    Cliente -->|HTTPS| Vercel
    N -->|API Stripe<br/>lectura de catálogo| P
    C -->|Elements embebido<br/>mismo /cart, sin redirect| CK
    CK --> T
    CK -->|pago OK| E
    E -->|webhook firmado| W
    W --> R1
    CK -.->|recibo automático| I

    Dueña["👩 Dueña (no técnica)"] -->|Dashboard de Stripe:<br/>productos · pedidos · reembolsos| Stripe
    Dueña -->|dispara| R2
```

---

## 2. Flujo de compra paso a paso

1. **Catálogo (`/`)** — El servidor (RSC) lee `Products` + `Prices` activos de la API de Stripe. Se cachea (ISR) para no golpear la API en cada visita; revalidación periódica o bajo demanda.
2. **Página de producto (`/product/[slug]`)** — Datos del producto desde Stripe (nombre, descripción, imágenes, precio, variantes via metadata). Incluye JSON-LD `schema.org/Product` y Open Graph. Si el producto tiene metadata `preview`, la ficha exige un texto de personalización que viaja en la metadata del PaymentIntent (clave `personalization_<productId>`) hasta el webhook y los emails; el producto personalizado queda sin desistimiento (art. 103.c TRLGDCU).
3. **Carrito** — Estado en cookie firmada (líneas: `price_id` + cantidad). **No hay BD**: el carrito vive en el navegador del cliente.
4. **Checkout** — En `/cart`, una Server Action crea/actualiza un **PaymentIntent** (`commerce-kit`: `cartCreate`/`updatePaymentIntent`) con las líneas del carrito, dirección de envío limitada a `ES`, tarifa de envío elegida e IVA. Los campos de tarjeta son **Stripe Elements embebido** (`@stripe/react-stripe-js`) montados en la misma página: la tarjeta nunca toca nuestro servidor ni nuestro JS, sin redirección a un dominio de Stripe (ver ADR-002).
5. **Pago completado** — Stripe emite `payment_intent.succeeded` → nuestro endpoint `/api/stripe-webhook` **verifica la firma** con `STRIPE_WEBHOOK_SECRET`.
6. **Email de confirmación** — El webhook dispara un email transaccional de marca vía **Resend** (plantilla React Email en español con resumen del pedido).
7. **Recibo y factura** — Stripe envía su recibo automático; con **Stripe Invoicing** se emite factura con NIF/CIF y numeración correcta cuando el cliente la necesita.
8. **Gestión del pedido** — La dueña ve el pedido en el Dashboard de Stripe, prepara el paquete y, al enviarlo, dispara el email de "pedido enviado" (Fase 3: mecanismo simple, sin panel propio).
9. **Vuelta a la tienda** — Tras confirmar el pago (`stripe.confirmPayment` con Elements), el propio cliente navega a `/order/success?payment_intent=...&payment_intent_client_secret=...` (página de gracias propia, sin redirección de Stripe; sin datos sensibles más allá de los ids del PaymentIntent).

**Reembolsos y desistimiento (14 días)**: la dueña lo hace desde el Dashboard de Stripe (botón "Reembolsar"). Stripe notifica al cliente. Sin código propio.

---

## 3. Qué vive en Stripe vs qué vive en el código

| Responsabilidad | Stripe | Código (Next.js en Vercel) |
|---|---|---|
| Catálogo (productos, precios, fotos, variantes) | ✅ Products/Prices + metadata | Solo lectura y render |
| Carrito | — | ✅ Cookie firmada en el cliente |
| Pago, 3DS, PCI-DSS | ✅ Elements embebido + PaymentIntent (SAQ A-EP) | Monta los campos, nunca toca datos de tarjeta |
| Impuestos (IVA 21%) | ✅ Stripe Tax o precios IVA incluido | Configuración |
| Envíos (zonas y tarifas España) | ✅ Shipping rates | Formulario propio en `/cart` para elegirla |
| Pedidos (listado, estado, búsqueda) | ✅ Dashboard | — |
| Reembolsos / devoluciones | ✅ Dashboard | — |
| Recibos y facturas | ✅ Recibos automáticos + Invoicing | — |
| Emails de marca (confirmación, enviado) | — | ✅ Webhook → Resend |
| SEO, sitemap, JSON-LD, OG | — | ✅ Next.js |
| Páginas legales, contenido, marca | — | ✅ Páginas estáticas |
| Antifraude | ✅ Stripe Radar (incluido) | — |
| HTTPS, CDN, deploy | Vercel ✅ | Configuración |

**Regla de oro**: si un dato puede vivir en Stripe, vive en Stripe. El código nunca es fuente de verdad de nada comercial.

---

## 4. ADRs (Architecture Decision Records)

### ADR-001 — Sin base de datos propia
- **Decisión**: no hay BD. Catálogo y pedidos viven en Stripe; el carrito, en una cookie.
- **Por qué**: coste 0 €/mes real (una BD gestionada gratis siempre acaba teniendo límites o coste), cero mantenimiento, cero backups, cero migraciones, y una única fuente de verdad que la dueña ya usa (Dashboard de Stripe). Con <100 pedidos/mes no existe ningún requisito que Stripe no cubra.
- **Contrapartida**: consultas complejas de catálogo (filtros avanzados, búsqueda full-text) están limitadas; con un catálogo pequeño es irrelevante. Si en Fase 2+ hiciera falta, se añade caché/índice sin cambiar la fuente de verdad.

### ADR-002 — Checkout con Stripe Elements embebido (PaymentIntent) — ⚠️ CORREGIDO en Fase 1
- **Decisión original (Fase 0)**: se asumió Stripe Checkout hosted (redirección a `checkout.stripe.com`).
- **Corrección (verificada en Fase 1 probando el flujo real de principio a fin)**: el código de `a98a19f` **no usa Checkout Sessions hosted**. Usa **Stripe Elements embebido** (`@stripe/react-stripe-js`, `stripe-elements-container.tsx`, `stripe-payment.tsx`) sobre un **PaymentIntent** creado y actualizado por `commerce-kit` (`cartCreate`/`updatePaymentIntent`), con un formulario propio en `/cart` para dirección y método de envío, y los campos de tarjeta de Stripe Elements montados ahí mismo (no hay redirección a un dominio de Stripe).
- **Por qué se mantiene así (no se revierte a hosted)**: cambiar a Checkout Sessions hosted sería reescribir la capa de carrito/checkout de `commerce-kit`, un cambio grande fuera de alcance de "traer y actualizar deps". Elements sigue delegando la introducción de datos de tarjeta a iframes de Stripe (Stripe.js) — **la tarjeta nunca toca nuestro servidor ni nuestro JS**, manteniendo un alcance PCI reducido (SAQ A-EP en vez de SAQ-A) y 3D Secure/SCA gestionado por Stripe (`automatic_payment_methods`).
- **Efecto en el resto de documentos**: `SECURITY.md` §2 sigue aplicando igual (el webhook verifica `payment_intent.succeeded`, ya lo hacía el código base). `ACCESSIBILITY.md` necesita cubrir el formulario propio de checkout (dirección + envío), no solo el carrito — se añade a la checklist de Fase 2/3. Ningún ADR de "sin BD"/"sin auth" se ve afectado.
- **Verificado en Fase 1**: catálogo → producto → carrito → selección de método de envío (tarifa de España creada de prueba) funcionando de principio a fin en local con claves de test reales.

### ADR-003 — Checkout como invitado (sin cuentas de usuario)
- **Decisión**: no hay registro ni login de clientes.
- **Por qué**: para <100 pedidos/mes las cuentas no aportan valor y sí coste: gestión de contraseñas, recuperación, más superficie GDPR (derecho de acceso/supresión sobre cuentas), más fricción de compra. El cliente recibe todo por email; el historial vive en Stripe.
- **Contrapartida**: sin área "mis pedidos". Si algún día se necesita, Stripe soporta customer portal / links de recibo sin construir auth propia.

### ADR-004 — Base de partida: fork de YNS "pure-Stripe" ✅ DECIDIDO (opción A, 2026-07-11)
- **Contexto (verificado el 2026-07-11 contra el repo real)**: `yournextstore/yournextstore` **pivotó a finales de 2025**. El `main` actual (Next 16 canary, Bun, commerce-kit 0.53) **ya no usa Stripe como catálogo**: requiere `YNS_API_KEY` y los productos se gestionan en la plataforma SaaS `yns.store` (su admin propio, con auth y editor). Eso rompe tres requisitos del proyecto: dueña gestionando desde el **Dashboard de Stripe**, **0 €/mes** y sin dependencia de terceros adicionales.
- **Opciones**:
  - **A (recomendada)**: partir del último commit "pure-Stripe" (`a98a19f`, ene-2025: Next 15, `stripe@17`, `STRIPE_SECRET_KEY`, catálogo directo de Stripe) y actualizar nosotros a Next 16 estable + deps al día. Se mantiene el stack cerrado tal cual.
  - **B**: usar el `main` actual y aceptar la plataforma YNS (contradice el stack cerrado; pricing/lock-in fuera de nuestro control).
  - **C**: usar el `main` actual solo como referencia de UI y reescribir la capa de datos contra Stripe (más trabajo que A, beneficio dudoso).
- **Estado**: **Álvaro confirmó la opción A** (2026-07-11). En Fase 1: traer el código de `a98a19f` a este repo privado (un fork de GitHub no puede ser privado) y actualizar a Next 16 estable + dependencias al día.

### ADR-005 — Emails transaccionales con Resend (no solo los de Stripe)
- **Decisión**: Stripe envía recibos/facturas; los emails de marca (confirmación con diseño propio, "pedido enviado") van por Resend.
- **Por qué**: capa gratuita (3.000 emails/mes ≫ volumen esperado), plantillas React Email versionadas en el repo, dominio propio verificado (SPF/DKIM) para entregabilidad y confianza.

### ADR-006 — `commerce-kit` fijado en `0.0.39` (no actualizar) ⚠️ HALLAZGO DE FASE 1
- **Contexto (verificado 2026-07-11 inspeccionando los tarballs de npm de commerce-kit desde 0.0.39 hasta 0.53.0)**: el paquete `commerce-kit` —la capa que traduce el catálogo de Stripe a la tienda— sufrió el MISMO pivote que motivó el ADR-004. La versión `0.0.39` (la de nuestro commit base) es la última que habla directo con Stripe (`STRIPE_SECRET_KEY`, `new Stripe(...)`). A partir de `~0.10.0` el paquete empieza a depender de la plataforma SaaS de YNS (mismo patrón `YNS_API_KEY`/`yns.store`); las versiones intermedias (`0.1.0`–`0.9.x`) ya estaban en transición.
- **Decisión**: NO actualizar `commerce-kit` más allá de `0.0.39` bajo ningún concepto, aunque `bun outdated` lo marque como muy desactualizado. Si algún día hace falta una función nueva de una versión posterior, evaluar caso a caso si esa versión concreta sigue funcionando sin `YNS_API_KEY` (repetir la inspección de tarballs) antes de tocarlo.
- **Efecto colateral**: esto fija también `typescript` (`5.9.3`) y `@types/node` (`22.20.1`) por debajo de sus últimas versiones (`7.x`/`26.x`), ya que son `peerDependencies` declaradas por `commerce-kit@0.0.39` (`^5.5.4`, `^20||^22`). Actualizar TS/node más allá de eso rompe la instalación (`npm error ERESOLVE`).
- **Parche `patches/commerce-kit@0.0.39.patch` (2026-07-20/21, mantenimiento sobre el árbol congelado)**: `productGet({slug})` y `productBrowse({filter:{category}})` usaban `stripe.products.search(...)` (Search API), que tiene retraso de indexado — Stripe documenta explícitamente "do not use Search for read-after-write flows" (searchable en <1 min "bajo condiciones normales", sin cota superior garantizada). Efecto real: al subir un producto nuevo, el nombre de categoría aparecía al instante en el nav (`categoryBrowse` usa `products.list`, tiempo real) pero la ficha del producto y su página de categoría devolvían "no existe" durante ese margen. Parcheado con `bun patch` para que ambas funciones usen `products.list` + filtro en memoria por `metadata.slug`/`metadata.category` — mismo patrón que ya usaba la rama sin filtro de `productBrowse`, sin tocar deduplicado/orden/validación de variantes existentes. **Corrección posterior (mismo parche, un día después)**: la primera versión dejaba `limit:100` fijo sin paginar — con más de 100 productos activos, los más antiguos (Stripe ordena por creación descendente) desaparecían de golpe de listado/ficha/categoría/sitemap sin aviso. El parche ahora incluye un helper `__listAllActiveProducts` que pagina de verdad con `starting_after`/`has_more` hasta traer el catálogo activo completo, usado por las tres funciones que antes hacían una única llamada de 100. El diff se reaplica solo en cada `bun install` (`patchedDependencies` en `package.json`); si se actualiza `commerce-kit` alguna vez, revisar si el parche sigue aplicando limpio.

### ADR-007 — Licencia del código base: **AGPL-3.0** ✅ DECIDIDO (2026-07-11, delegado por Álvaro a la IA)
- **Contexto**: `yournextstore` se distribuye con doble licencia: AGPL-3.0-only (gratis) o comercial (de pago, contacto `hi@yournextstore.com`). La AGPL-3.0 tiene cláusula de "copyleft de red" (§13): al ejecutar una versión modificada como servicio accesible por red (una tienda online lo es), hay que ofrecer el código fuente correspondiente a quien interactúe con el servicio, "desde un servidor de red".
- **Decisión: AGPL-3.0.** Álvaro delegó explícitamente la elección ("la que veas mejor... mi hermana no tiene dinero para pagar un gestor"). Descartadas: (b) licencia comercial → cuesta dinero que no hay; (c) "confiar en que la cláusula no aplica" → jurídicamente inseguro, no es responsable montarlo así.
- **Por qué AGPL es la opción correcta aquí**: es **gratis**; el cumplimiento tiene **coste ~0**; y el "coste competitivo" de compartir el código es casi nulo — es un fork de YNS (no hay salsa secreta en el storefront; el valor está en los productos, la marca y la ejecución, no en el código). Cualquier competidor podría obtener un fork de YNS de la propia YNS.
- **Cómo se cumple (§13, "código fuente desde un servidor de red")**:
  1. **Repositorio público** `github.com/d-Alvhor/lasernex` — es la vía estándar y customary de "poner el código a disposición desde un servidor de red". No expone nada sensible: los secretos viven en variables de entorno de Vercel (nunca commiteados) y el NIF del titular ya es público por ley en el propio aviso legal del sitio.
  2. **Aviso en el footer** del sitio, en todas las páginas: "Software libre bajo AGPL-3.0 · Código fuente" con enlace al repo. Esto es el "prominently offer" que exige §13.
  3. `LICENSE` (texto AGPL-3.0 completo) en la raíz del repo; `package.json` → `"license": "AGPL-3.0-only"`.
- **Nota honesta (no es asesoramiento legal)**: esta es la decisión de una IA a la que se le delegó explícitamente por falta de presupuesto para un abogado. Es la interpretación estándar y de buena fe de la AGPL-3.0. Si en el futuro Lasernex quisiera mantener el código cerrado (p. ej. por ventaja competitiva real), la vía correcta sería comprar la licencia comercial a YNS y entonces el repo podría volver a privado.
- **Estado**: ✅ implementado. Se elimina `LICENSE-Commercial.md` (no aplica) y `LICENSE-AGPL.md` se renombra a `LICENSE`.

---

## 5. Entornos

| | Test | Producción |
|---|---|---|
| Stripe | Claves `sk_test_…` / modo test | Claves `sk_live_…` |
| Webhook | Stripe CLI local / endpoint de preview | Endpoint firmado en lasernex.es |
| Resend | Dominio sandbox | `lasernex.es` verificado (SPF/DKIM) |
| Vercel | Preview deployments por rama | `main` → lasernex.es |

El detalle de claves por entorno y su gestión se documenta en `SECURITY.md` (documento 2).

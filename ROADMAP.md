# ROADMAP.md — Lasernex

> MVP en 4 semanas con el stack cerrado; todo lo que no bloquee la primera venta se aparta a Fase 2. Regla: **antes de añadir nada, preguntarse si Stripe ya lo hace solo.**

---

## MVP — 4 semanas

### Semana 1 — Fundaciones (= FASE 1 del plan de trabajo)
- [x] Traer el código base al repo privado desde `yournextstore@a98a19f` (último commit pure-Stripe; ADR-004)
- [x] Actualizar dependencias: Next 16 estable, React 19 estable, `stripe` al día, Tailwind 4; TypeScript estricto
- [x] Cuenta Stripe en **modo test**: negocio, IVA 21% (precios con IVA incluido — confirmado: NO se activa Stripe Tax, coherente con la política de precios de `src/app/(store)/legal/*`), zonas de envío España con tarifas
- [x] Primer producto de prueba con variantes (metadata) — falta foto real (Stripe no tiene `images` todavía, solo texto)
- [x] `.env.example` documentado
- [x] Deploy en Vercel + dominio lasernex.es con HTTPS — en producción, verificado (apex y `www` con HSTS, ver `DEPLOY.md`)
- **Hito**: la tienda carga en lasernex.es y muestra el producto de prueba

### Semana 2 — Marca y contenido (= FASE 2)
- [x] Home, catálogo y página de producto con la marca Lasernex (logo tipográfico, negro/blanco) — falta subir el logo real en Stripe → Configuración → Marca (branding), hoy está vacío
- [x] Traducción 100% al español de todos los textos de la plantilla (incluido checkout, envío y selector de país)
- [x] Páginas legales en `/legal/*` + footer (fuente de verdad viva, sin doc aparte)
- [x] "Sobre nosotros" y "Cómo se fabrican" (contenido genérico de FDM/PLA/PETG; faltan fotos reales del proceso)
- [ ] Checklist `ACCESSIBILITY.md` aplicada a cada componente tocado; metadata y JSON-LD de `SEO.md` (parcial: 2026-07-12 se cerraron varios gaps reales — ver auditoría)
- **Hito**: la tienda parece Lasernex, no una plantilla

### Semana 3 — Pedidos y emails (= FASE 3)
- [x] Webhook `/api/stripe-webhook` con verificación de firma (`SECURITY.md` §2) — ya existía en el código base, verificado con Stripe CLI
- [x] Email de confirmación con React Email + Resend (español, resumen del pedido, enlaces legales) — probado en producción con `RESEND_API_KEY` real y dominio verificado (2026-07-12)
- [x] Recibos automáticos de Stripe — arreglado un bug real: el checkout nunca fijaba `receipt_email` en el PaymentIntent, así que Stripe jamás habría mandado su recibo pese a prometerlo en `condiciones`. El webhook lo fija tras el pago (verificado con una compra de prueba real)
- [ ] Invoicing configurado (NIF/CIF, numeración ES) — necesita los datos fiscales reales de Álvaro/la dueña en Stripe, no es código
- [x] Mecanismo "pedido enviado" accionable por la dueña sin tocar código (enlace con secreto compartido, ver `OPERATIONS.md`) — ampliado 2026-07-12 con email automático "Nuevo pedido" con el botón ya resuelto
- [x] Dominio lasernex.es verificado en Resend (SPF/DKIM/DMARC) — verificado 2026-07-12, email de prueba real entregado
- **Hito**: compra de prueba completa → email de marca + recibo en la bandeja (probado en local con Stripe CLI y claves live activas en producción; falta la compra REAL con tarjeta de verdad, ver Semana 4)

### Semana 4 — Calidad y lanzamiento (= FASE 4)
- [x] Cabeceras de seguridad de `SECURITY.md` §1 implementadas y verificadas (CSP adaptada a Stripe Elements embebido, ver ADR-002)
- [ ] Resto de la auditoría contra `SECURITY.md` §6 y `ACCESSIBILITY.md` §3 (parcial: rate limiting, XSS del JSON-LD, alt text y aria-label de carrito ya cerrados 2026-07-12)
- [x] Lighthouse ≥ 90 en las 4 categorías (móvil, URL de producción) — medido 2026-07-15 con PageSpeed Insights v5 sobre home, ficha de producto y categoría: móvil 96-98 performance / 99-100 accessibility / 100 best-practices / 100 seo (escritorio 98-99/99-100/100/100). Único hallazgo menor: `heading-order` en `/category/decoracion` (accessibility 99, no bloquea el objetivo)
- [ ] Paso a producción: claves live ✅ y webhook live ✅ (2026-07-12) — falta la prueba de compra REAL (y su reembolso)
- [ ] Textos legales validados con el asesor; datos fiscales reales en Stripe
- [ ] Validar con el asesor el texto de excepción de desistimiento del email de confirmación (art. 103.c)
- [x] **Licencia del código base resuelta (ARCHITECTURE.md ADR-007)**: AGPL-3.0 elegida, repo público, aviso en footer con enlace al código
- [ ] Google Search Console + sitemap enviado
- [x] Sesión de formación con la dueña usando `OPERATIONS.md` — Carla subió su primer producto real en Modo real (2026-07-12)
- **Hito**: 🚀 lanzamiento

---

## Fase 2 — Después de vender (orden sugerido por valor/esfuerzo)

| Mejora | Qué aporta | Esfuerzo | Nota |
|---|---|---|---|
| **Cupones de descuento** | Marketing básico, recuperar carritos | 🟢 Bajo | Stripe Coupons/Promotion Codes: solo activar `allow_promotion_codes` en Checkout. Casi gratis — primera candidata |
| ~~**Tracking de envío en el email**~~ | Menos "¿dónde está mi pedido?" | 🟢 Bajo | ✅ **Hecho**: campo de nº de seguimiento en el email "enviado" |
| **Pedidos personalizados de impresión 3D** | Diferenciador real del negocio | 🔴 Alto | La **personalización simple de texto** (nombre/grabado vía metadata `preview`) ya está **en producción (13-jul-2026)**; esta fila cubre solo encargos con archivo/presupuesto: formulario de solicitud (archivo STL/foto) + presupuesto manual + Stripe Payment Link por encargo. Sin desistimiento (art. 103.c) — ya contemplado en `/legal/desistimiento`. Definir bien antes de construir |
| **Reseñas de clientes** | Confianza y SEO (rich results con estrellas) | 🟡 Medio | Sin BD propia exige decisión: servicio externo o algo creativo. **No** meter una BD solo para esto — reevaluar ADR-001 si llega el momento |
| **Bizum en Checkout** | Método de pago local muy usado | 🟢 Bajo | Activarlo en Stripe cuando esté disponible para la cuenta |
| **Expansión UE** | Más mercado | 🟡 Medio | Stripe Tax para IVA por país (OSS con la gestoría), zonas de envío UE, quizá inglés — revisar `src/app/(store)/legal/*` |
| **Newsletter** | Fidelización | 🟡 Medio | Exige consentimiento GDPR y proveedor; solo si hay tracción |
| **Búsqueda/filtros avanzados** | UX con catálogo grande | 🟡 Medio | Solo si el catálogo supera ~30-40 productos; mientras, categorías por metadata bastan |

**Anti-roadmap** (decidido que NO, para que nadie lo "mejore" por su cuenta): panel de administración propio, base de datos, cuentas de usuario, CMS, app móvil, multi-idioma en MVP, checkout propio construido desde cero (procesar tarjetas nosotros — no confundir con el checkout embebido de Stripe Elements de ADR-002, que sí es la implementación actual y correcta). Cada uno rompe el principio de coste-0/mantenimiento-0 (ADRs 001-003).

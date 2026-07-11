# ROADMAP.md — Lasernex

> MVP en 4 semanas con el stack cerrado; todo lo que no bloquee la primera venta se aparta a Fase 2. Regla: **antes de añadir nada, preguntarse si Stripe ya lo hace solo.**

---

## MVP — 4 semanas

### Semana 1 — Fundaciones (= FASE 1 del plan de trabajo)
- [ ] Traer el código base al repo privado desde `yournextstore@a98a19f` (último commit pure-Stripe; ADR-004)
- [ ] Actualizar dependencias: Next 16 estable, React 19 estable, `stripe` al día, Tailwind 4; TypeScript estricto
- [ ] Cuenta Stripe en **modo test**: negocio, IVA 21% (precios con IVA incluido), zonas de envío España con tarifas
- [ ] Primer producto de prueba con variantes (metadata) y fotos
- [ ] `.env.example` documentado; deploy en Vercel + dominio lasernex.es con HTTPS
- **Hito**: la tienda carga en lasernex.es y muestra el producto de prueba

### Semana 2 — Marca y contenido (= FASE 2)
- [ ] Home, catálogo y página de producto con la marca Lasernex (logo, negro/blanco, tipografía)
- [ ] Traducción 100% al español de todos los textos de la plantilla
- [ ] Páginas legales de `LEGAL.md` en `/legal/*` + footer
- [ ] "Sobre nosotros" y "Cómo se fabrican" (materiales, tiempos, fotos del proceso)
- [ ] Checklist `ACCESSIBILITY.md` aplicada a cada componente tocado; metadata y JSON-LD de `SEO.md`
- **Hito**: la tienda parece Lasernex, no una plantilla

### Semana 3 — Pedidos y emails (= FASE 3)
- [ ] Webhook `/api/stripe-webhook` con verificación de firma (`SECURITY.md` §2)
- [ ] Email de confirmación con React Email + Resend (español, resumen del pedido, enlaces legales)
- [ ] Recibos automáticos de Stripe activados; Invoicing configurado (NIF/CIF, numeración ES)
- [ ] Mecanismo "pedido enviado" accionable por la dueña sin tocar código
- [ ] Dominio lasernex.es verificado en Resend (SPF/DKIM/DMARC)
- **Hito**: compra de prueba completa → email de marca + recibo en la bandeja

### Semana 4 — Calidad y lanzamiento (= FASE 4)
- [ ] Auditoría contra `SECURITY.md` §6 y `ACCESSIBILITY.md` §3
- [ ] Lighthouse ≥ 90 en las 4 categorías (móvil, URL de producción)
- [ ] Paso a producción: claves live, webhook live, prueba de compra REAL (y su reembolso)
- [ ] Textos legales validados con el asesor; datos fiscales reales en Stripe
- [ ] Google Search Console + sitemap enviado
- [ ] Sesión de formación con la dueña usando `OPERATIONS.md` (que suba ella un producto de verdad)
- **Hito**: 🚀 lanzamiento

---

## Fase 2 — Después de vender (orden sugerido por valor/esfuerzo)

| Mejora | Qué aporta | Esfuerzo | Nota |
|---|---|---|---|
| **Cupones de descuento** | Marketing básico, recuperar carritos | 🟢 Bajo | Stripe Coupons/Promotion Codes: solo activar `allow_promotion_codes` en Checkout. Casi gratis — primera candidata |
| **Tracking de envío en el email** | Menos "¿dónde está mi pedido?" | 🟢 Bajo | Campo de nº de seguimiento en el email "enviado" (Fase 3 ya deja la base) |
| **Pedidos personalizados de impresión 3D** | Diferenciador real del negocio | 🔴 Alto | Formulario de solicitud (archivo STL/foto) + presupuesto manual + Stripe Payment Link por encargo. Sin desistimiento (art. 103.c) — ya contemplado en LEGAL.md. Definir bien antes de construir |
| **Reseñas de clientes** | Confianza y SEO (rich results con estrellas) | 🟡 Medio | Sin BD propia exige decisión: servicio externo o algo creativo. **No** meter una BD solo para esto — reevaluar ADR-001 si llega el momento |
| **Bizum en Checkout** | Método de pago local muy usado | 🟢 Bajo | Activarlo en Stripe cuando esté disponible para la cuenta |
| **Expansión UE** | Más mercado | 🟡 Medio | Stripe Tax para IVA por país (OSS con la gestoría), zonas de envío UE, quizá inglés — revisar LEGAL.md |
| **Newsletter** | Fidelización | 🟡 Medio | Exige consentimiento GDPR y proveedor; solo si hay tracción |
| **Búsqueda/filtros avanzados** | UX con catálogo grande | 🟡 Medio | Solo si el catálogo supera ~30-40 productos; mientras, categorías por metadata bastan |

**Anti-roadmap** (decidido que NO, para que nadie lo "mejore" por su cuenta): panel de administración propio, base de datos, cuentas de usuario, CMS, app móvil, multi-idioma en MVP, checkout embebido. Cada uno rompe el principio de coste-0/mantenimiento-0 (ADRs 001-003).

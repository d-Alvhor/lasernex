# SEO.md — Lasernex

> Objetivo: que cada producto sea indexable, con rich results de precio/disponibilidad en Google, y Core Web Vitals en verde. Todo el SEO se genera desde los datos de Stripe: si la dueña edita un producto en el Dashboard, el SEO se actualiza solo.

---

## 1. Metadata API de Next.js

Layout raíz — plantilla de títulos y metadatos base:

```ts
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://lasernex.es"),
  title: { default: "Lasernex — Piezas impresas en 3D", template: "%s · Lasernex" },
  description: "Tienda de piezas impresas en 3D, fabricadas en España y enviadas a toda la península.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "es_ES", siteName: "Lasernex" },
  robots: { index: true, follow: true },
};
```

Por producto — `generateMetadata` lee de Stripe (mismo fetch cacheado que usa la página, no una llamada extra):

```ts
// app/product/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct((await params).slug); // desde Stripe, cacheado
  if (!product) return { title: "Producto no encontrado", robots: { index: false } };
  return {
    title: product.name,
    description: product.description?.slice(0, 155),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.description ?? undefined,
      images: product.images.map((url) => ({ url, width: 1200, height: 630 })),
    },
  };
}
```

Reglas:
- **Canonical en todas las páginas** (evita duplicados por parámetros de URL).
- Páginas sin valor de búsqueda (`/carrito`, `/pedido/confirmado`) → `robots: { index: false }`.
- La primera imagen del producto en Stripe hace de imagen OG: se documenta en `OPERATIONS.md` que la primera foto es "la buena" (mín. 1200px de ancho).

---

## 2. JSON-LD schema.org/Product (rich results con precio y stock)

```tsx
// components/product-jsonld.tsx — se renderiza en la página de producto
export function ProductJsonLd({ product }: { product: StoreProduct }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.id, // id de Stripe como SKU estable
    brand: { "@type": "Brand", name: "Lasernex" },
    offers: {
      "@type": "Offer",
      url: `https://lasernex.es/product/${product.slug}`,
      priceCurrency: "EUR",
      price: (product.unitAmount / 100).toFixed(2), // Stripe da céntimos
      // Sin gestión de stock propia: activo en Stripe = disponible.
      // (Fabricación bajo demanda encaja con esto; si se desactiva un
      // producto en Stripe, desaparece del catálogo y del sitemap.)
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      // Obligatorio para rich results de merchant en la UE:
      shippingDetails: { "@type": "OfferShippingDetails", shippingDestination: { "@type": "DefinedRegion", addressCountry: "ES" } },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "ES",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14, // derecho de desistimiento
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      },
    },
  };
  return (
    <script type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", "\\u003c") }} />
  );
}
```

(El escape de `<` evita inyección si algún texto de Stripe contuviera HTML. Es el único `dangerouslySetInnerHTML` permitido en el proyecto.)

**Validación**: [Rich Results Test](https://search.google.com/test/rich-results) por cada plantilla en Fase 4.

---

## 3. Sitemap dinámico desde Stripe + robots.txt

```ts
// app/sitemap.ts — se regenera con el catálogo real
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllActiveProducts(); // Stripe, cacheado
  const staticPages = ["", "/sobre-nosotros", "/como-se-fabrican",
    "/legal/aviso-legal", "/legal/privacidad", "/legal/cookies",
    "/legal/condiciones", "/legal/desistimiento",
  ].map((p) => ({ url: `https://lasernex.es${p}`, changeFrequency: "monthly" as const }));

  return [
    ...staticPages,
    ...products.map((p) => ({
      url: `https://lasernex.es/product/${p.slug}`,
      lastModified: new Date(p.updated * 1000), // Stripe da epoch
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
```

```ts
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/carrito", "/pedido/"] }],
    sitemap: "https://lasernex.es/sitemap.xml",
  };
}
```

Tras el lanzamiento: alta en **Google Search Console** (propiedad de dominio) y envío del sitemap. Es el único paso manual.

---

## 4. Core Web Vitals

| Métrica | Objetivo | Cómo se consigue aquí |
|---|---|---|
| **LCP** < 2.5s | Imagen de producto | `next/image` con `priority` en la imagen hero/primera del grid, tamaños responsive (`sizes`), formato AVIF/WebP automático |
| **CLS** < 0.1 | Sin saltos | `width/height` siempre en imágenes (aspect-ratio reservado), fuentes con `next/font` (self-hosted, sin FOIT), skeletons con las mismas dimensiones que el contenido |
| **INP** < 200ms | Interacción | RSC: casi cero JS de cliente; el carrito es el único componente interactivo pesado. Sin librerías de cliente innecesarias |

Prácticas de soporte:
- Catálogo y producto renderizados en servidor y **cacheados** (ISR/`"use cache"`): TTFB bajo y sin esperar a Stripe en cada visita. Revalidación cada ~1h + endpoint de revalidación bajo demanda (documentado en `OPERATIONS.md` como "el cambio tarda ≤1 h en verse, o pulsa el enlace de refrescar").
- Imágenes de Stripe (`files.stripe.com`) pasan por el optimizador de `next/image` (añadir el dominio a `images.remotePatterns`).
- Cero scripts de terceros en el MVP (sin analytics de cliente; Vercel Analytics solo si se activa, es beacon ligero).
- Presupuesto Lighthouse (Fase 4): **≥90 en Performance, Accessibility, Best Practices y SEO**, medido en móvil sobre la URL de producción.

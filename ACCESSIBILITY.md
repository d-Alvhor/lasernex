# ACCESSIBILITY.md — Lasernex

> Objetivo: **WCAG 2.2 nivel AA** en todo el flujo de compra. La accesibilidad no es una capa final: cada componente que se toque en Fase 2 debe pasar esta checklist antes de darse por hecho. Base legal: en España la accesibilidad web de comercios se apoya en el RD 1112/2018 y la EN 301 549 (además de ser exigible bajo la Ley de Accesibilidad Europea desde junio 2025 para e-commerce).

---

## 1. Checklist WCAG 2.2 AA aplicada a esta tienda

### Percepción
- [ ] **Contraste texto ≥ 4.5:1** (3:1 para texto grande ≥24px o ≥19px bold). La estética Lasernex es oscura (fondo negro, texto blanco = 21:1 ✅), pero cuidado con los **grises del logo/subtítulos**: gris sobre negro debe mantenerse ≥ #767676 equivalente. Verificar cada par con el contrast checker en Fase 2.
- [ ] **Contraste no textual ≥ 3:1**: bordes de inputs, iconos del carrito, indicadores de variante seleccionada.
- [ ] **El color nunca es el único indicador**: variante seleccionada = borde + check, no solo cambio de color; errores de formulario = icono + texto, no solo borde rojo.
- [ ] **Alt text de productos**: descriptivo y útil ("Maceta hexagonal impresa en 3D, PLA blanco, 12 cm", no "producto" ni el nombre repetido). Se escribe en la descripción de imagen al subir el producto (ver `OPERATIONS.md`). Imágenes decorativas → `alt=""`.
- [ ] **Zoom 200%** sin pérdida de contenido ni scroll horizontal (layout fluido, sin alturas fijas).
- [ ] **Reflow a 320px** de ancho: la tienda es usable en móvil estrecho.

### Operabilidad
- [ ] **Todo operable por teclado**: catálogo, selector de variantes, añadir al carrito, abrir/cerrar carrito, ir a pagar. Sin trampas de foco (el drawer del carrito atrapa el foco MIENTRAS está abierto y lo devuelve al botón que lo abrió al cerrarse — eso sí es correcto).
- [ ] **Focus visible** (WCAG 2.2 — 2.4.7/2.4.11): anillo de foco con contraste ≥3:1 en fondo oscuro (p. ej. `focus-visible:ring-2 ring-offset-2` con color claro). **Nunca** `outline: none` sin reemplazo. El elemento enfocado no queda oculto tras el header sticky.
- [ ] **Objetivo táctil ≥ 24×24 px** (2.5.8, nuevo en 2.2): botones de cantidad +/-, cierre del drawer, miniaturas.
- [ ] **Orden de tabulación lógico**: header → contenido → carrito → footer.
- [ ] **Skip link** "Saltar al contenido" como primer elemento enfocable.
- [ ] Sin contenido que parpadee ni carruseles con autoplay sin pausa.

### Comprensión
- [ ] `<html lang="es">` (y textos 100% en español — sin mezcla "Add to cart").
- [ ] **Formularios** (los pocos que hay: cantidad, y en Fase 2 contacto):
  - Cada input con `<label>` visible y asociado (no placeholder como única etiqueta).
  - Errores accesibles: mensaje de texto junto al campo, `aria-describedby` apuntando al error, `aria-invalid="true"`, y foco movido al primer campo erróneo al enviar. El resumen de errores usa `role="alert"`.
  - Autocompletado: `autocomplete` correcto donde aplique (email…).
- [ ] Precios con unidad clara ("24,90 € — IVA incluido"), sin abreviaturas ambiguas.
- [ ] Botones con verbo: "Añadir al carrito", "Finalizar compra" (no "OK", no iconos solos sin `aria-label`).

### Robustez
- [ ] HTML semántico: `<nav>`, `<main>`, `<header>`, `<footer>`, headings jerárquicos (un solo `<h1>` por página; el nombre del producto es el `<h1>` de su página).
- [ ] Componentes Radix/shadcn del repo base ya traen ARIA correcto — **no** desmontarlo al personalizar estilos.

---

## 2. ARIA en el carrito (patrón concreto)

```tsx
// Botón del carrito en el header: estado siempre audible
<button aria-label={`Carrito, ${count} artículos`} aria-haspopup="dialog">
  <ShoppingCartIcon aria-hidden="true" />
  <span aria-hidden="true">{count}</span>
</button>

// Anuncio de cambios sin robar el foco (al añadir un producto):
<div aria-live="polite" className="sr-only">
  {lastAction /* "Maceta hexagonal añadida al carrito" */}
</div>

// El drawer del carrito: role="dialog" aria-modal="true"
// aria-labelledby="cart-title" — Radix Dialog ya lo hace; no romperlo.
```

Reglas del carrito:
- Al **añadir**: anunciar por `aria-live="polite"` (no mover el foco, no abrir el drawer automáticamente si interrumpe).
- Al **eliminar** una línea: el foco pasa a la línea siguiente (o al título si era la última) y se anuncia "Producto eliminado".
- Los botones +/- de cantidad llevan `aria-label="Aumentar cantidad de {producto}"`.
- El total lleva markup textual normal (los lectores lo leen); cambios de total se anuncian junto con la acción.

**El checkout es Stripe Elements EMBEBIDO en `/cart`** (ver ADR-002 en `ARCHITECTURE.md`), no una página hosted de Stripe: la accesibilidad de los campos de tarjeta (iframes de Stripe.js) la mantiene Stripe, pero el resto del formulario propio en esa misma página (dirección, método de envío, botón "Finalizar compra") **es responsabilidad nuestra**, igual que el resto del carrito.

---

## 3. Verificación (en cada PR de Fase 2 y auditoría de Fase 4)

| Herramienta | Qué valida | Objetivo |
|---|---|---|
| Lighthouse (a11y) | Automático básico | ≥ 95 |
| axe DevTools | Reglas WCAG automáticas | 0 violaciones |
| Navegación solo teclado | Flujo completo catálogo→checkout | Sin bloqueos, foco siempre visible |
| VoiceOver (macOS/iOS) | Flujo de compra completo | Todo anunciado con sentido |
| Zoom navegador 200% + móvil 320px | Reflow | Sin scroll horizontal ni contenido cortado |

Lo automático caza ~30-40% de los problemas: la pasada manual de teclado + VoiceOver del flujo completo de compra es **obligatoria** antes del lanzamiento.

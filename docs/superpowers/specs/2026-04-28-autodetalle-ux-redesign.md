# AutoDetalle UX Redesign — Design Spec

**Date:** 2026-04-28
**Status:** Approved
**File:** `src/pages/AutoDetalle.jsx`

## Goals

- Información organizada y fácil de leer (problema actual: desorden visual)
- Personalidad visual distintiva (problema actual: se ve genérico)
- Conversiones balanceadas: WhatsApp + Agendar siempre accesibles
- Funciona igual en mobile y desktop (50/50 audience split)

---

## Layout — "Story" (secciones apiladas)

La página se divide en 7 secciones verticales más 2 elementos sticky. El usuario hace scroll lineal de arriba abajo.

### Elemento sticky: Header superior

Siempre visible mientras se scrollea. Contiene:
- Enlace `← Catálogo`
- Nombre del auto + año·km (tipografía compacta)
- Precio destacado en rojo (`$359,000`)
- Botón WhatsApp verde

Se oculta en el estado initial (solo aparece al hacer scroll pasado la banda de datos), para no duplicar info con el título visible.

### Sección 1 — Galería oscura

- Fondo `#0f172a` (dark navy) para que las fotos resalten
- Imagen principal con `aspect-ratio: 4/3`, `border-radius: 12px`
- Badge de contador `1 / N` en esquina inferior derecha
- Strip de thumbnails scrolleable horizontalmente debajo de la imagen principal
- Clic en imagen principal o thumbnail abre el **Lightbox** existente
- `loading="eager"` en imagen 1, `loading="lazy"` en el resto

### Sección 2 — Banda de datos clave

Barra horizontal de fondo rojo (`#dc2626`) con los 4 datos más buscados:
- Año · Kilómetros · Transmisión · Combustible
- Texto blanco, separadores verticales con opacidad
- En mobile: se comprimen a 2×2 si el espacio no alcanza

### Sección 3 — Título + precio + status

- Badge de status (`Disponible` / `Reservado` / `Vendido`) + badge de marca
- H1: nombre del modelo, tipografía bold/900
- Subtítulo: año, color, puertas
- Precio grande en rojo a la derecha, "MXN · Precio final" como subtexto

### Sección 4 — Descripción + equipamiento

- Barra roja vertical izquierda (acento visual)
- Texto de descripción (`auto.descripcion`)
- Pills de equipamiento derivados únicamente de campos booleanos en `auto.ficha`:
  - `aire: true` → ❄️ Clima
  - `infoentretenimiento` (non-empty string) → 📱 Pantalla táctil
  - Solo se muestra un pill si el campo existe y es truthy. No se deriva nada del texto libre de `descripcion`.

### Sección 5 — Ficha técnica

Reemplaza la tabla HTML actual. Nuevo diseño: **grid 2 columnas**, fondo blanco, separado en celdas con gap de 1px sobre fondo `#f1f5f9` (efecto de líneas).

Cada celda:
- Label en gris claro: "AÑO", "KILOMETRAJE", etc. (uppercase, pequeño)
- Valor en negro bold: "2022", "48,000 km", etc.

Campos mostrados (mismos que hoy): año, kilometraje, transmisión, combustible, motor, tracción, color (con muestra de color), puertas.

### Sección 6 — Calculadora de financiamiento

Mantiene la lógica actual. Cambios visuales:
- Slider de enganche: estilo pill con indicador rojo
- Plazo: botones pill en lugar de radio buttons, rojo activo
- **Resultado**: tarjeta oscura (`#111 → #1e293b` gradient), pago mensual en tipografía grande blanca, totales en fila debajo
- Nota de disclaimer en gris

### Sección 7 — Autos relacionados

- Título "También te puede interesar" + enlace "Ver catálogo →"
- Grid de 3 tarjetas (mismo componente de tarjeta que el catálogo)
- Sin cambios en la lógica de selección (misma marca o rango de precio)

### Elemento sticky: Barra CTA inferior

Visible solo en mobile (`lg:hidden` o similar). Posición `fixed bottom-0`.
- Dos botones de igual tamaño: **WhatsApp** (verde) + **Agendar visita** (rojo)
- Padding interior para safe area en iPhone (`pb-safe` o `padding-bottom: env(safe-area-inset-bottom)`)
- En desktop, los CTAs viven dentro de la sección 3 (junto al precio)

---

## Componentes afectados

| Componente | Cambio |
|---|---|
| `AutoDetalle` (export default) | Restructura completa del JSX según el layout |
| `Lightbox` | Sin cambios en lógica, ajuste cosmético opcional |
| `FinancingCalculator` | Sin cambios en lógica, rediseño visual completo |
| Ficha técnica (inline) | Reemplaza `<table>` por grid CSS |

---

## Implementación — lo que NO cambia

- Lógica de fetch desde Supabase
- Lógica del lightbox (teclado, índice)
- Cálculo de mensualidad en `FinancingCalculator`
- Lógica de autos relacionados
- SEO / Helmet tags
- Share por WhatsApp y link copy
- Slug-based routing

---

## Tokens de diseño

| Token | Valor |
|---|---|
| Rojo principal | `#dc2626` |
| Dark gallery bg | `#0f172a` |
| Dark card bg | `#111` / `#1e293b` |
| Verde WhatsApp | `#25d366` |
| Gray label | `#94a3b8` |
| Separador | `#f1f5f9` |
| Border radius cards | `12px` |

---

## Notas de implementación

- El header sticky requiere `useRef` + `IntersectionObserver` para aparecer solo después de pasar la galería, evitando duplicar el título.
- La barra CTA fija inferior debe tener `z-index` mayor que el lightbox overlay (`z-50` → usar `z-40` para la barra, `z-50` para lightbox).
- Los pills de equipamiento se generan desde `auto.ficha` (campos booleanos como `aire`). Si el campo no existe en el objeto, no se muestra el pill.
- En desktop (`lg:`), la barra sticky inferior se oculta. Los CTAs en sección 3 se muestran siempre.

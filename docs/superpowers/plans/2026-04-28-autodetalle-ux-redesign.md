# AutoDetalle UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar `AutoDetalle.jsx` con layout "Story" — galería oscura, banda roja de datos clave, header sticky, specs en grid limpio, calculadora con tarjeta oscura y barra CTA fija en mobile.

**Architecture:** Todo el cambio vive en un solo archivo (`src/pages/AutoDetalle.jsx`). Se extraen dos nuevos sub-componentes inline: `DarkGallery` y `StickyHeader`. `Lightbox` y `FinancingCalculator` conservan su lógica; solo cambia el JSX visual de `FinancingCalculator`. El layout pasa de `grid lg:grid-cols-2` a secciones apiladas full-width.

**Tech Stack:** React 19, Tailwind CSS 3, Heroicons, react-icons/fa, react-hot-toast, Supabase. Se elimina la dependencia de `react-responsive-carousel`.

---

## File Map

| Archivo | Acción |
|---|---|
| `src/pages/AutoDetalle.jsx` | Modificar — restructura completa del JSX |

---

### Task 1: Eliminar Carousel, agregar DarkGallery

**Files:**
- Modify: `src/pages/AutoDetalle.jsx`

- [ ] **Step 1: Eliminar el import de react-responsive-carousel**

En `src/pages/AutoDetalle.jsx`, reemplaza las líneas:
```js
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
```
Por nada (elimínalas). También elimina `useRef` del import de React si no se usa aún (se agregará en Task 2). Agrega `Fragment` al import:
```js
import { useEffect, useState, useCallback, useMemo, useRef, Fragment } from 'react';
```

- [ ] **Step 2: Agregar el componente DarkGallery antes de `Lightbox`**

Inserta este componente antes de la función `Lightbox`:

```jsx
function DarkGallery({ imagenes, onImageClick }) {
  const [current, setCurrent] = useState(0)

  if (imagenes.length === 0) {
    return (
      <div className="bg-[#0f172a] aspect-[4/3] flex items-center justify-center text-gray-500 text-sm">
        Sin imágenes disponibles
      </div>
    )
  }

  return (
    <div className="bg-[#0f172a]">
      {/* Main image */}
      <div className="relative cursor-zoom-in" onClick={() => onImageClick(current)}>
        <img
          src={imagenes[current]}
          alt={`Foto ${current + 1}`}
          loading="eager"
          className="w-full aspect-[4/3] object-cover"
        />
        <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {current + 1} / {imagenes.length}
        </span>
        <span className="absolute bottom-3 left-3 bg-black/50 text-white/70 text-xs px-2.5 py-1 rounded-full">
          Toca para ampliar
        </span>
      </div>
      {/* Thumbnails */}
      {imagenes.length > 1 && (
        <div className="flex gap-1.5 p-2 overflow-x-auto">
          {imagenes.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-all ${
                i === current ? 'border-red-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-75'
              }`}
            >
              <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Reemplazar el bloque `<Carousel>` en el JSX principal**

Busca el bloque que empieza en `{/* Carousel */}` y termina en `</div>` (alrededor de línea 292–327). Reemplázalo por:

```jsx
{/* Gallery */}
<div ref={galleryRef}>
  <DarkGallery imagenes={imagenes} onImageClick={setLightbox} />
</div>
```

Nota: `galleryRef` se define en Task 2. Por ahora puedes dejar `ref={galleryRef}` y definirlo como `const galleryRef = useRef(null)` temporalmente en el componente principal.

- [ ] **Step 4: Verificar en browser**

```bash
npm run dev
```

Abre `http://localhost:5173/autos/<cualquier-slug>`. Debes ver:
- Galería oscura con la foto principal
- Thumbnails abajo si hay más de 1 imagen
- Click en foto abre el lightbox existente

- [ ] **Step 5: Lint**

```bash
npx eslint src/pages/AutoDetalle.jsx
```

Sin errores nuevos.

- [ ] **Step 6: Commit**

```bash
git add src/pages/AutoDetalle.jsx
git commit -m "feat(autodetalle): replace Carousel with custom DarkGallery"
```

---

### Task 2: Sticky header con IntersectionObserver

**Files:**
- Modify: `src/pages/AutoDetalle.jsx`

- [ ] **Step 1: Agregar el componente StickyHeader antes de DarkGallery**

```jsx
function StickyHeader({ auto, waUrl, visible }) {
  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/catalogo" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 shrink-0 transition-colors">
            <ArrowLeftIcon className="h-3.5 w-3.5" /> Catálogo
          </Link>
          <div className="w-px h-4 bg-gray-200 shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate">{auto.marca} {auto.modelo}</span>
            <span className="text-xs text-gray-400 ml-2">
              {auto.año}{auto.kilometraje ? ` · ${Number(auto.kilometraje).toLocaleString('es-MX')} km` : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-bold text-red-600 hidden sm:block">{formatPrice(auto.precio)}</span>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] hover:bg-[#1ebe5b] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <FaWhatsapp className="h-3.5 w-3.5" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Agregar estado y ref en el componente principal**

Dentro de `export default function AutoDetalle()`, agrega después de los `useState` existentes:

```jsx
const [stickyVisible, setStickyVisible] = useState(false)
const galleryRef = useRef(null)
```

- [ ] **Step 3: Agregar el useEffect del IntersectionObserver**

Después del `useEffect` que carga el auto, agrega:

```jsx
useEffect(() => {
  const el = galleryRef.current
  if (!el || !auto) return
  const observer = new IntersectionObserver(
    ([entry]) => setStickyVisible(!entry.isIntersecting),
    { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
  )
  observer.observe(el)
  return () => observer.disconnect()
}, [auto])
```

- [ ] **Step 4: Montar StickyHeader en el JSX**

Justo antes del `return` principal (después de los guards de `loading` y `!auto`), agrega `<StickyHeader>` como primer hijo del wrapper. El wrapper actual es `<div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">`. Cámbialo a:

```jsx
return (
  <>
    <StickyHeader auto={auto} waUrl={waUrl} visible={stickyVisible} />
    <div className="pb-20 lg:pb-0">
      <SEO ... />
      {/* resto del contenido */}
    </div>
  </>
)
```

El `pb-20 lg:pb-0` reserva espacio para la barra CTA fija en mobile (se agrega en Task 7).

- [ ] **Step 5: Eliminar el `<Link>` de "Volver a vehículos"**

Ese link ya no es necesario porque el header sticky tiene el `← Catálogo`. Elimina el bloque:
```jsx
{/* Back link */}
<Link to="/#autos" ... >
  <ArrowLeftIcon ... />
  Volver a vehículos
</Link>
```

- [ ] **Step 6: Verificar en browser**

```bash
npm run dev
```

Abre la página de un auto y scrollea hacia abajo. Al pasar la galería debe aparecer el header sticky con el nombre, precio y botón WhatsApp. Al scrollear hacia arriba debe desaparecer.

- [ ] **Step 7: Commit**

```bash
git add src/pages/AutoDetalle.jsx
git commit -m "feat(autodetalle): add sticky header with IntersectionObserver"
```

---

### Task 3: Banda roja de datos clave + sección de título

**Files:**
- Modify: `src/pages/AutoDetalle.jsx`

- [ ] **Step 1: Eliminar el wrapper `grid lg:grid-cols-2`**

El JSX actual tiene `<div className="grid lg:grid-cols-2 gap-10 items-start">` que divide la página en dos columnas. Elimina ese div wrapper y el div de `{/* Info */}` que lo contiene. Las secciones ahora van apiladas verticalmente.

El resultado en el JSX principal debe quedar así (después del `<SEO>`):

```jsx
{/* Gallery — ref para sticky header */}
<div ref={galleryRef}>
  <DarkGallery imagenes={imagenes} onImageClick={setLightbox} />
</div>

{/* Quick facts band */}
{/* ... Task 3 Step 2 */}

{/* Title + price */}
{/* ... Task 3 Step 3 */}
```

- [ ] **Step 2: Agregar la banda roja de datos clave**

Justo después del bloque `<div ref={galleryRef}>`:

```jsx
{/* Quick facts band */}
<div className="bg-red-600 px-4 sm:px-6 py-3 flex justify-around items-center flex-wrap gap-y-2">
  {[
    { label: 'Año',         value: auto.año },
    { label: 'Kilómetros',  value: auto.kilometraje ? Number(auto.kilometraje).toLocaleString('es-MX') : '—' },
    { label: 'Transmisión', value: auto.transmision ?? '—' },
    { label: 'Combustible', value: auto.combustible ?? '—' },
  ].map((item, i, arr) => (
    <Fragment key={item.label}>
      <div className="text-center text-white">
        <div className="text-sm font-bold">{item.value}</div>
        <div className="text-xs opacity-75 uppercase tracking-wider">{item.label}</div>
      </div>
      {i < arr.length - 1 && <div className="w-px h-5 bg-white/30" />}
    </Fragment>
  ))}
</div>
```

- [ ] **Step 3: Agregar sección de título + precio + status**

Justo después de la banda roja:

```jsx
{/* Title + price + status */}
<div className="px-4 sm:px-6 pt-5 pb-4 bg-white border-b border-gray-100 flex justify-between items-start gap-4">
  <div className="min-w-0">
    <div className="flex items-center gap-2 mb-2 flex-wrap">
      {auto.estado && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[auto.estado] ?? 'bg-gray-100 text-gray-600'}`}>
          ● {STATUS_LABELS[auto.estado] ?? auto.estado}
        </span>
      )}
      <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">
        {auto.marca}
      </span>
    </div>
    <h1 className="font-heading text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
      {auto.modelo}
    </h1>
    <p className="text-sm text-gray-400 mt-1">
      {auto.año}
      {auto.color ? ` · ${auto.color}` : ''}
      {auto.puertas ? ` · ${auto.puertas} puertas` : ''}
    </p>
  </div>
  <div className="text-right shrink-0">
    <div className="text-2xl sm:text-3xl font-black text-red-600 leading-tight">
      {formatPrice(auto.precio)}
    </div>
    <div className="text-xs text-gray-400 mt-0.5">MXN · Precio final</div>
    {/* Desktop CTAs — en mobile los CTAs están en la barra fija (Task 7) */}
    <div className="hidden lg:flex flex-col gap-2 mt-4">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
      >
        <FaWhatsapp className="h-4 w-4" /> Me interesa
      </a>
      <a
        href={agendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
      >
        Agendar visita
      </a>
      <div className="flex gap-2 mt-1">
        <a href={shareWaUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-green-300 text-xs text-gray-500 hover:text-green-700 transition-all">
          <FaWhatsapp className="h-3.5 w-3.5" /> Compartir
        </a>
        <button onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 text-xs text-gray-500 transition-all">
          <LinkIcon className="h-3.5 w-3.5" /> Copiar
        </button>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Definir `agendarUrl` junto a `waUrl`**

Busca donde se define `waUrl` y agrega debajo:

```jsx
const agendarMsg = encodeURIComponent(`Hola, me gustaría agendar una visita para ver el *${auto.marca} ${auto.modelo} ${auto.año}*. ¿Cuándo tienen disponibilidad?`)
const agendarUrl = `https://wa.me/522213411834?text=${agendarMsg}`
```

- [ ] **Step 5: Eliminar el bloque de status badge, `<p>` de marca, `<h1>`, precio, descripción y action buttons del JSX viejo**

Todo lo que estaba dentro del `{/* Info */}` del grid anterior ya no va aquí — fue trasladado a las nuevas secciones. Limpia cualquier duplicado.

- [ ] **Step 6: Verificar en browser**

```bash
npm run dev
```

La página debe mostrar: galería oscura → banda roja → título+precio a dos columnas (nombre a la izq, precio a la der) → en desktop aparecen los botones de CTA.

- [ ] **Step 7: Commit**

```bash
git add src/pages/AutoDetalle.jsx
git commit -m "feat(autodetalle): add red quick-facts band and title section"
```

---

### Task 4: Descripción + pills de equipamiento

**Files:**
- Modify: `src/pages/AutoDetalle.jsx`

- [ ] **Step 1: Agregar el componente `EquipmentPills` antes de `StickyHeader`**

```jsx
const EQUIPMENT_MAP = [
  { field: 'aire',              emoji: '❄️',  label: 'Clima A/C' },
  { field: 'infoentretenimiento', emoji: '📱', label: 'Pantalla táctil' },
]

function EquipmentPills({ auto }) {
  const pills = EQUIPMENT_MAP.filter(item => Boolean(auto?.[item.field]))
  if (pills.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {pills.map(p => (
        <span
          key={p.field}
          className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
        >
          {p.emoji} {p.label}
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Agregar la sección de descripción en el JSX principal**

Después del bloque de título+precio (Task 3), agrega:

```jsx
{/* Description + equipment */}
{(auto.descripcion || auto.aire || auto.infoentretenimiento) && (
  <div className="px-4 sm:px-6 py-5 bg-white border-b-8 border-gray-100">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-1 h-5 bg-red-600 rounded-full shrink-0" />
      <h2 className="text-base font-bold text-gray-900">Sobre este auto</h2>
    </div>
    {auto.descripcion && (
      <p className="text-sm text-gray-600 leading-relaxed">{auto.descripcion}</p>
    )}
    <EquipmentPills auto={auto} />
  </div>
)}
```

- [ ] **Step 3: Verificar en browser**

```bash
npm run dev
```

Si el auto tiene `descripcion` o `aire: true`, debe aparecer la sección con barra roja vertical, texto y pills. Si ninguno aplica, la sección no aparece.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AutoDetalle.jsx
git commit -m "feat(autodetalle): add description section with equipment pills"
```

---

### Task 5: Ficha técnica rediseñada

**Files:**
- Modify: `src/pages/AutoDetalle.jsx`

- [ ] **Step 1: Reemplazar el bloque de specs**

Busca el bloque `{/* Specs grid */}` (tiene `className="grid grid-cols-2 gap-3 mb-8"`). Reemplázalo por:

```jsx
{/* Ficha técnica */}
{fichaItems.length > 0 && (
  <div className="px-4 sm:px-6 py-5 bg-white border-b-8 border-gray-100">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-5 bg-red-600 rounded-full shrink-0" />
      <h2 className="text-base font-bold text-gray-900">Ficha técnica</h2>
    </div>
    <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-xl overflow-hidden">
      {fichaItems.map(item => (
        <div key={item.label} className="bg-white px-4 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">{item.label}</p>
          <p className="text-sm font-bold text-gray-900">{item.value}</p>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 2: Verificar en browser**

Las specs deben verse como un grid de celdas blancas separadas por líneas grises delgadas (efecto de `gap-px bg-gray-100`). Cada celda: label pequeño gris arriba, valor negro abajo.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AutoDetalle.jsx
git commit -m "feat(autodetalle): redesign specs as clean 2-col grid"
```

---

### Task 6: FinancingCalculator visual redesign

**Files:**
- Modify: `src/pages/AutoDetalle.jsx` — solo la función `FinancingCalculator`

- [ ] **Step 1: Reemplazar el wrapper y la tarjeta de resultado**

La lógica (`useMemo`, estados) no cambia. Solo cambia el JSX del `return`. Reemplaza el `return` completo de `FinancingCalculator` por:

```jsx
return (
  <div className="px-4 sm:px-6 py-5 bg-white border-b-8 border-gray-100">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-5 bg-red-600 rounded-full shrink-0" />
      <h2 className="text-base font-bold text-gray-900">Calcula tu pago</h2>
    </div>

    <div className="space-y-5">
      {/* Enganche slider */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Enganche</label>
          <span className="text-xs font-bold text-gray-700">{enganche}% — {fmt(engancheAmt)}</span>
        </div>
        <input
          type="range" min={10} max={50} step={5}
          value={enganche}
          onChange={e => setEnganche(Number(e.target.value))}
          className="w-full accent-red-600 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>10%</span><span>50%</span>
        </div>
      </div>

      {/* Plazo pills */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Plazo</label>
        <div className="flex gap-2 flex-wrap">
          {[12, 24, 36, 48, 60].map(m => (
            <button
              key={m}
              onClick={() => setMeses(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                meses === m
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m} m
            </button>
          ))}
        </div>
      </div>

      {/* Tasa slider */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tasa anual</label>
          <span className="text-xs font-bold text-gray-700">{tasa}%</span>
        </div>
        <input
          type="range" min={6} max={24} step={1}
          value={tasa}
          onChange={e => setTasa(Number(e.target.value))}
          className="w-full accent-red-600 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>6%</span><span>24%</span>
        </div>
      </div>
    </div>

    {/* Result card — dark */}
    <div className="mt-5 bg-gradient-to-br from-gray-900 to-slate-800 rounded-2xl p-5 text-white">
      <p className="text-xs text-gray-400 mb-1">Pago mensual estimado</p>
      <p className="text-4xl font-black text-white leading-tight">
        {fmt(mensualidad)} <span className="text-lg font-normal text-gray-400">/mes</span>
      </p>
      <div className="flex gap-6 mt-3">
        <div>
          <p className="text-xs text-gray-500">Total a pagar</p>
          <p className="text-sm font-bold text-gray-200">{fmt(total)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Interés total</p>
          <p className="text-sm font-bold text-gray-200">{fmt(interesTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Tasa anual</p>
          <p className="text-sm font-bold text-gray-200">{tasa}%</p>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-4">* Cálculo estimado. Consulta condiciones reales con tu financiera.</p>
    </div>
  </div>
)
```

- [ ] **Step 2: Eliminar el CalculatorIcon del import de heroicons** si ya no se usa en ningún otro lugar del archivo. Si se usa, déjalo.

- [ ] **Step 3: Mover la llamada a `<FinancingCalculator>` al nuevo lugar**

En el JSX principal, elimina `<FinancingCalculator precio={Number(auto.precio)} />` de donde estaba (dentro de `{/* Info */}`). Agrégalo como nueva sección después de la ficha técnica (Task 5):

```jsx
{/* Calculadora */}
<FinancingCalculator precio={Number(auto.precio)} />
```

La función `FinancingCalculator` ya incluye su propio padding/layout, no necesita wrapper adicional.

- [ ] **Step 4: Verificar en browser**

La calculadora debe mostrar sliders + pills de plazo + tarjeta oscura con el pago mensual grande en blanco.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AutoDetalle.jsx
git commit -m "feat(autodetalle): redesign FinancingCalculator with dark result card"
```

---

### Task 7: Autos relacionados + barra CTA fija mobile + compartir

**Files:**
- Modify: `src/pages/AutoDetalle.jsx`

- [ ] **Step 1: Rediseñar la sección de autos relacionados**

Busca el bloque `{/* Related cars */}` y reemplázalo por:

```jsx
{/* Related cars */}
{related.length > 0 && (
  <div className="px-4 sm:px-6 py-5 bg-white border-b-8 border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 bg-red-600 rounded-full shrink-0" />
        <h2 className="text-base font-bold text-gray-900">También te puede interesar</h2>
      </div>
      <Link to="/catalogo" className="text-sm text-red-600 font-semibold hover:text-red-700 transition-colors">
        Ver catálogo →
      </Link>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {related.map(car => (
        <Link
          key={car.id}
          to={`/autos/${toSlug(car.modelo)}`}
          className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-lg overflow-hidden transition-all duration-300"
        >
          <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
            {car.imagenes?.[0] ? (
              <img
                src={car.imagenes[0]}
                alt={`${car.marca} ${car.modelo}`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Sin imagen</div>
            )}
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{car.marca}</p>
            <p className="text-sm font-bold text-gray-900 leading-snug">{car.modelo}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {car.año}{car.kilometraje ? ` · ${Number(car.kilometraje).toLocaleString('es-MX')} km` : ''}
            </p>
            <p className="text-base font-black text-red-600 mt-2">{formatPrice(car.precio)}</p>
          </div>
        </Link>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 2: Agregar sección de compartir (mobile)**

Después de los autos relacionados, antes del lightbox:

```jsx
{/* Share — mobile (desktop va en la sección de título) */}
<div className="px-4 sm:px-6 py-5 bg-white lg:hidden">
  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Compartir</p>
  <div className="flex gap-3">
    <a
      href={shareWaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-green-300 text-sm text-gray-600 hover:text-green-700 transition-all"
    >
      <FaWhatsapp className="h-4 w-4" /> WhatsApp
    </a>
    <button
      onClick={copyLink}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 text-sm text-gray-600 transition-all"
    >
      <LinkIcon className="h-4 w-4" /> Copiar enlace
    </button>
  </div>
</div>
```

- [ ] **Step 3: Agregar la barra CTA fija al fondo (mobile only)**

Justo antes del `{/* Lightbox */}`, fuera del wrapper principal:

```jsx
{/* Sticky bottom CTA — mobile only */}
<div
  className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-3"
  style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
>
  <a
    href={waUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white py-3 rounded-xl text-sm font-bold transition-colors"
  >
    <FaWhatsapp className="h-4 w-4" /> WhatsApp
  </a>
  <a
    href={agendarUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-bold transition-colors"
  >
    Agendar visita
  </a>
</div>
```

- [ ] **Step 4: Eliminar el bloque de `{/* Share */}` viejo** que estaba en el `{/* Info */}` del grid anterior (si aún existe).

- [ ] **Step 5: Verificar en browser**

En mobile (devtools → responsive):
- Barra fija al fondo con WhatsApp + Agendar
- Espacio suficiente al final de la página (no oculta el contenido)

En desktop:
- No aparece la barra fija
- CTAs visibles en la sección de título (Task 3)

- [ ] **Step 6: Lint final**

```bash
npx eslint src/pages/AutoDetalle.jsx
```

- [ ] **Step 7: Build de producción**

```bash
npm run build
```

Debe terminar sin errores.

- [ ] **Step 8: Commit final**

```bash
git add src/pages/AutoDetalle.jsx
git commit -m "feat(autodetalle): add related cars redesign, share section and sticky mobile CTA bar"
```

---

## Self-Review

**Spec coverage:**
- ✅ Header sticky con IntersectionObserver → Task 2
- ✅ Galería oscura + thumbnails → Task 1
- ✅ Banda roja datos clave → Task 3
- ✅ Título + precio + status → Task 3
- ✅ Descripción + pills → Task 4
- ✅ Ficha técnica grid → Task 5
- ✅ Calculadora dark card → Task 6
- ✅ Autos relacionados → Task 7
- ✅ Barra CTA fija mobile → Task 7
- ✅ CTAs desktop en sección título → Task 3
- ✅ `pb-20 lg:pb-0` para reservar espacio CTA mobile → Task 2
- ✅ `agendarUrl` definido → Task 3 Step 4

**Placeholders:** Ninguno.

**Type consistency:** `auto`, `waUrl`, `agendarUrl`, `shareWaUrl`, `fichaItems`, `imagenes`, `related` — todos definidos antes del primer uso. `EquipmentPills` recibe `{ auto }`, `StickyHeader` recibe `{ auto, waUrl, visible }`, `DarkGallery` recibe `{ imagenes, onImageClick }`, `FinancingCalculator` recibe `{ precio }` — consistente en todos los tasks.

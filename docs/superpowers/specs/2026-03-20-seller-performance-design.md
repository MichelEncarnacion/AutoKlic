# Seller Performance Report Design

**Date:** 2026-03-20
**Project:** AutoKlic admin panel
**Sub-project:** Rendimiento por vendedor

---

## Goal

Add a dedicated performance report page showing per-seller KPIs for a configurable date range. Admins see all sellers; sellers see only their own stats.

---

## Scope

1. **PDF utilities extraction** — move shared PDF helpers from `Reportes.jsx` to `src/lib/pdfUtils.js` so `Rendimiento.jsx` can import them.
2. **DB change** — add `precio_cierre numeric` column to `leads`.
3. **Price capture** — when a lead's status changes to "Cerrado" in `Leads.jsx`, a modal prompts for an optional closing price.
4. **New page** — `src/pages/admin/Rendimiento.jsx` with date range filter and KPI display.
5. **Sidebar link** — visible to `admin` and `seller` roles (not `viewer`).

---

## Database Changes

```sql
alter table leads add column if not exists precio_cierre numeric;
```

`precio_cierre` is nullable. A null value means no price was recorded for that closed lead; it is excluded from ingreso totals.

No RLS changes needed — existing leads RLS covers this column.

---

## PDF Utilities Extraction

The helper functions `addPDFHeader`, `addPDFFooters`, `buildPeriodString`, `makeStatusHook`, and the constants `BRAND_RED`, `HEADER_RED`, `GRAY_50`, `GRAY_200`, `GRAY_800`, `STATUS_FILL`, `TABLE_STYLES` are currently defined as private (non-exported) module-level code in `Reportes.jsx`. They must be moved to a new shared file so `Rendimiento.jsx` can import them.

### New file: `src/lib/pdfUtils.js`

Move all PDF utilities from `Reportes.jsx` into this file, adding `export` to each:

```js
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const BRAND_RED  = [220, 38, 38]
export const HEADER_RED = [153, 27, 27]
export const GRAY_50    = [249, 250, 251]
export const GRAY_200   = [229, 231, 235]
export const GRAY_800   = [31, 41, 55]

export const STATUS_FILL = {
  Disponible:        [220, 252, 231],
  Vendido:           [243, 244, 246],
  Reservado:         [254, 249, 195],
  Nuevo:             [219, 234, 254],
  'En revisión':     [254, 243, 199],
  'Oferta enviada':  [243, 232, 255],
  Cerrado:           [243, 244, 246],
}

export const TABLE_STYLES = {
  headStyles: { fillColor: HEADER_RED, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
  alternateRowStyles: { fillColor: GRAY_50 },
  bodyStyles: { fontSize: 8, textColor: GRAY_800 },
  styles: { cellPadding: 3, lineColor: GRAY_200, lineWidth: 0.1 },
}

export function addPDFHeader(doc, title, period = '') {
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(...BRAND_RED)
  doc.rect(0, 0, w, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('AutoKlic', 14, 11)
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(title, 14, 20)
  doc.setFontSize(8)
  doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, w - 14, 20, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  if (period) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Período: ${period}`, 14, 34)
    doc.setTextColor(0, 0, 0)
    return 40
  }
  return 32
}

export function addPDFFooters(doc, reportTitle) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const w = doc.internal.pageSize.getWidth()
    const h = doc.internal.pageSize.getHeight()
    doc.setDrawColor(...GRAY_200)
    doc.line(14, h - 12, w - 14, h - 12)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(reportTitle, 14, h - 7)
    doc.text(`Página ${i} de ${pageCount}`, w - 14, h - 7, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
}

export function buildPeriodString(from, to) {
  if (!from && !to) return 'Todo el período'
  if (from && to) return `${format(new Date(from), 'dd/MM/yyyy')} — ${format(new Date(to), 'dd/MM/yyyy')}`
  if (from) return `Desde ${format(new Date(from), 'dd/MM/yyyy')}`
  return `Hasta ${format(new Date(to), 'dd/MM/yyyy')}`
}

export function makeStatusHook(statusColIndex) {
  return (data) => {
    if (data.section === 'body' && data.column.index === statusColIndex) {
      const fill = STATUS_FILL[data.cell.raw]
      if (fill) {
        data.cell.styles.fillColor = fill
        data.cell.styles.textColor = GRAY_800
      }
    }
  }
}
```

### Update `Reportes.jsx`

Remove the inline definitions of all the above constants and functions, and replace them with named imports from `src/lib/pdfUtils.js`:

```js
import {
  BRAND_RED, HEADER_RED, GRAY_50, GRAY_200, GRAY_800,
  STATUS_FILL, TABLE_STYLES,
  addPDFHeader, addPDFFooters, buildPeriodString, makeStatusHook,
} from '../../lib/pdfUtils'
```

No other changes to `Reportes.jsx` — all call sites remain identical.

---

## Frontend Architecture

### Files modified

| File | Change |
|------|--------|
| `src/pages/admin/Reportes.jsx` | Replace inline PDF utilities with imports from `src/lib/pdfUtils.js` |
| `src/pages/admin/Leads.jsx` | Show `precio_cierre` modal when status changes to `'closed'` |
| `src/pages/admin/AdminLayout.jsx` | Add "Rendimiento" nav link for admin + seller roles; add `ChartBarSquareIcon` to the existing `@heroicons/react/24/outline` import |
| `src/App.jsx` | Add child route `path="rendimiento"` inside the existing `/admin` Route; add `import Rendimiento` |

### Files created

| File | Responsibility |
|------|---------------|
| `src/lib/pdfUtils.js` | Shared PDF utilities (header, footer, styles, helpers) |
| `src/pages/admin/Rendimiento.jsx` | Full performance report page |

### Router

Add as a **child route** inside the existing `<Route path="/admin">` block in `src/App.jsx`:

```jsx
// At the top of App.jsx, add:
import Rendimiento from './pages/admin/Rendimiento'

// Inside <Route path="/admin" ...>:
<Route path="rendimiento" element={<Rendimiento />} />
```

---

## Feature: precio_cierre capture in Leads.jsx

### Flow

`updateStatus` already handles all status changes. When `newStatus === 'closed'`, instead of immediately saving, the function stores the pending `{id, newStatus, oldLabel, newLabel}` in a new state variable `pendingClose` and opens a `closePriceOpen` modal.

The modal has:
- A numeric input for `precio_cierre` (`min={0}`, optional, placeholder "Precio de cierre (opcional)")
- "Guardar con precio" button — onClick: `commitClose(Math.max(0, Number(closePriceInput) || 0))`
- "Omitir" button — onClick: `commitClose(null)`

The modal is **non-dismissible** — no backdrop click handler, no Escape key close. Only the two explicit buttons (Guardar / Omitir) can resolve it. This prevents `pendingClose` from being left in a limbo state if the user accidentally clicks outside the modal.

When the modal action completes (either button), it calls a new internal function `commitClose(precioCierre)` that performs the actual Supabase UPDATE and `lead_events` INSERT, then clears `pendingClose`.

For all other status changes (`newStatus !== 'closed'`), `updateStatus` works exactly as today.

### New state variables (in Leads.jsx)

```js
const [pendingClose, setPendingClose] = useState(null) // { id, newStatus, oldLabel, newLabel }
const [closePriceOpen, setClosePriceOpen] = useState(false)
const [closePriceInput, setClosePriceInput] = useState('')
```

### `commitClose` function

Parameter `precioCierre` is either `null` (Omitir) or a non-negative number (Guardar). The `precio_cierre` field is always included in the UPDATE payload — either as the number or as `null` — so the DB is always in sync with the user's choice and local state never retains stale values.

```js
async function commitClose(precioCierre) {
  const { id, newStatus, oldLabel, newLabel } = pendingClose
  const now = new Date().toISOString()
  // Always write precio_cierre (null means "no price recorded")
  const updatePayload = {
    status: newStatus,
    last_activity_at: now,
    precio_cierre: precioCierre,  // null or positive number
  }

  const { error } = await supabase.from('leads').update(updatePayload).eq('id', id)
  if (error) { toast.error('Error al actualizar'); return }
  toast.success('Estado actualizado')
  setLeads(l => l.map(x => x.id === id ? { ...x, ...updatePayload } : x))

  const { error: evErr } = await supabase.from('lead_events').insert({
    lead_id: id,
    user_id: profile.id,
    event_type: 'status_change',
    old_value: oldLabel,
    new_value: newLabel,
  })
  if (evErr) toast('El cambio se guardó pero no pudo registrarse en el historial.', { icon: '⚠️' })

  setPendingClose(null)
  setClosePriceOpen(false)
  setClosePriceInput('')
}
```

### Modified `updateStatus` logic

```js
async function updateStatus(id, newStatus) {
  const lead = leads.find(x => x.id === id)
  const oldLabel = STATUS_OPTIONS.find(s => s.value === lead?.status)?.label ?? lead?.status
  const newLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label ?? newStatus

  if (newStatus === 'closed') {
    setPendingClose({ id, newStatus, oldLabel, newLabel })
    setClosePriceInput('')
    setClosePriceOpen(true)
    return
  }

  // All other status changes — same as before
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('leads').update({ status: newStatus, last_activity_at: now }).eq('id', id)
  if (error) { toast.error('Error al actualizar'); return }
  toast.success('Estado actualizado')
  setLeads(l => l.map(x => x.id === id ? { ...x, status: newStatus, last_activity_at: now } : x))
  const { error: evErr } = await supabase.from('lead_events').insert({
    lead_id: id, user_id: profile.id, event_type: 'status_change',
    old_value: oldLabel, new_value: newLabel,
  })
  if (evErr) toast('El cambio se guardó pero no pudo registrarse en el historial.', { icon: '⚠️' })
}
```

---

## Feature: Rendimiento page

### Loading state

While the initial data fetch is in progress, show a pulsing skeleton: two rows of three gray rounded blocks (`animate-pulse bg-gray-200 rounded h-8`). This matches the skeleton pattern used in `Dashboard.jsx`.

### Data fetching

On mount and when date range changes, fetch leads filtered by date range:

```js
let query = supabase
  .from('leads')
  .select('id, assigned_to, status, precio_cierre, created_at, last_activity_at')
  .order('created_at', { ascending: false })

if (dateFrom) query = query.gte('created_at', dateFrom)
if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59')
```

Note: `dateTo + 'T23:59:59'` is treated as UTC by Supabase. This may cut off leads created in the last hours of the day for users in UTC-offset timezones (e.g., Mexico City UTC-6). This is a known limitation shared with the existing `Reportes.jsx` date filter and is out of scope for this iteration.

Admin also fetches all staff profiles for the seller list:
```js
supabase.from('profiles').select('id, nombre, email').in('role', ['admin', 'seller']).order('nombre')
```

Seller only sees their own stats — no staff fetch needed. Seller fetch adds `.eq('assigned_to', profile.id)` to the leads query.

### Imports required in `Rendimiento.jsx`

```js
import { differenceInDays, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { addPDFHeader, addPDFFooters, buildPeriodString, TABLE_STYLES, makeStatusHook } from '../../lib/pdfUtils'
```

### KPI computation (per seller, in JavaScript)

```js
function computeKPIs(leads, sellerId) {
  const assigned = leads.filter(l => l.assigned_to === sellerId)
  const closed   = assigned.filter(l => l.status === 'closed')
  const withPrice = closed.filter(l => l.precio_cierre != null)

  const ingreso = withPrice.reduce((sum, l) => sum + Number(l.precio_cierre), 0)

  const diasList = closed
    .filter(l => l.last_activity_at)
    .map(l => differenceInDays(parseISO(l.last_activity_at), parseISO(l.created_at)))
  const diasPromedio = diasList.length > 0
    ? Math.round(diasList.reduce((a, b) => a + b, 0) / diasList.length)
    : null

  return {
    asignados:   assigned.length,
    cerrados:    closed.length,
    tasa:        assigned.length > 0 ? Math.round((closed.length / assigned.length) * 100) : 0,
    ingreso,
    diasPromedio,
  }
}
```

### Admin view

A table with one row per staff member (all members returned by the profiles fetch, regardless of whether they have leads in the period). `computeKPIs` is called for each; members with zero assigned leads show zeros across all columns. Columns: Vendedor, Asignados, Cerrados, Tasa, Ingreso, Días prom.

### Seller view

Five KPI cards in a responsive grid (same style as Dashboard KPIs). No table — only their own data.

### Date range filter

Two `<input type="date">` fields (Desde / Hasta) in the page header. Same styling as `src/pages/admin/Reportes.jsx`. Both are optional — empty means no date restriction.

### PDF export (admin only)

A "Exportar PDF" button generates a landscape PDF using jsPDF + jspdf-autotable. Import utilities from `src/lib/pdfUtils.js`. The table matches the admin view. Visible only to admins.

Landscape usable width = 297 - 14 - 14 = **269mm**. Column widths: Vendedor 60, Asignados 30, Cerrados 30, Tasa 29, Ingreso 60, Días prom 60 (total 269mm).

---

## Sidebar link

In `AdminLayout.jsx`:
1. Add `ChartBarSquareIcon` to the existing `@heroicons/react/24/outline` import statement.
2. Add "Rendimiento" to the `navItems` array after "Reportes". Filter the array before mapping to skip items the current role cannot access — same technique as any other role-conditional items in the array. Do **not** add a standalone `NavLink` outside the array (that pattern exists only for "Usuarios" as legacy and should not be replicated). Example:

```js
const visibleNavItems = navItems.filter(item => {
  if (item.to === '/admin/rendimiento') return profile?.role === 'admin' || profile?.role === 'seller'
  if (item.to === '/admin/usuarios') return profile?.role === 'admin'
  return true
})
```

Then render `visibleNavItems.map(...)`. Move the standalone "Usuarios" `NavLink` into the `navItems` array at the same time to consolidate the pattern.

---

## Data Flow

```
Rendimiento mounts
  → fetch leads in date range (all for admin, own for seller)
  → admin: fetch staff profiles
  → computeKPIs() per seller
  → render table (admin) or KPI cards (seller)

Admin changes date range
  → re-fetch leads → recompute → re-render

Seller changes status to 'closed' in Leads.jsx
  → setPendingClose + setClosePriceOpen(true)
  → User enters price or clicks Omitir
  → commitClose(precioCierre | null)
  → UPDATE leads SET status, last_activity_at, precio_cierre
  → INSERT lead_events status_change
```

---

## Error Handling

- If leads fetch fails: show error state with retry button.
- If staff fetch fails (admin): show error state.
- `precio_cierre` input has `min={0}` to prevent negative values at the HTML level. `commitClose` additionally clamps with `Math.max(0, Number(closePriceInput) || 0)` before passing the value.

---

## Out of Scope

- CSV export of the performance report
- Per-seller drill-down (clicking a seller to see their individual leads)
- Historical trend charts
- Notifications when a seller hits a target

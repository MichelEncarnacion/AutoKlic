# Seller Performance Report Design

**Date:** 2026-03-20
**Project:** AutoKlic admin panel
**Sub-project:** Rendimiento por vendedor

---

## Goal

Add a dedicated performance report page showing per-seller KPIs for a configurable date range. Admins see all sellers; sellers see only their own stats.

---

## Scope

1. **DB change** — add `precio_cierre numeric` column to `leads`.
2. **Price capture** — when a lead's status changes to "Cerrado" in `Leads.jsx`, a modal prompts for an optional closing price.
3. **New page** — `src/pages/admin/Rendimiento.jsx` with date range filter and KPI display.
4. **Sidebar link** — visible to `admin` and `seller` roles (not `viewer`).

---

## Database Changes

```sql
alter table leads add column if not exists precio_cierre numeric;
```

`precio_cierre` is nullable. A null value means no price was recorded for that closed lead; it is excluded from ingreso totals.

No RLS changes needed — existing leads RLS covers this column.

---

## Frontend Architecture

### Files modified

| File | Change |
|------|--------|
| `src/pages/admin/Leads.jsx` | Show `precio_cierre` modal when status changes to 'closed' |
| `src/pages/admin/AdminLayout.jsx` | Add "Rendimiento" nav link for admin + seller roles |

### Files created

| File | Responsibility |
|------|---------------|
| `src/pages/admin/Rendimiento.jsx` | Full performance report page |

### Router

Add route in `src/App.jsx`:
```jsx
<Route path="/admin/rendimiento" element={<Rendimiento />} />
```

---

## Feature: precio_cierre capture in Leads.jsx

### Flow

`updateStatus` already handles all status changes. When `newStatus === 'closed'`, instead of immediately saving, the function stores the pending `{id, newStatus, oldLabel, newLabel}` in a new state variable `pendingClose` and opens a `closePriceOpen` modal.

The modal has:
- A numeric input for `precio_cierre` (optional, placeholder "Precio de cierre (opcional)")
- "Guardar con precio" button — saves status + `precio_cierre` + event, closes modal
- "Omitir" button — saves status + `precio_cierre: null` + event, closes modal

When the modal action completes (either button), it calls a new internal function `commitClose(preciocierre)` that performs the actual Supabase UPDATE and `lead_events` INSERT, then clears `pendingClose`.

For all other status changes (`newStatus !== 'closed'`), `updateStatus` works exactly as today.

### New state variables (in Leads.jsx)

```js
const [pendingClose, setPendingClose] = useState(null) // { id, newStatus, oldLabel, newLabel }
const [closePriceOpen, setClosePriceOpen] = useState(false)
const [closePriceInput, setClosePriceInput] = useState('')
```

### `commitClose` function

```js
async function commitClose(preciosCierre) {
  const { id, newStatus, oldLabel, newLabel } = pendingClose
  const now = new Date().toISOString()
  const updatePayload = { status: newStatus, last_activity_at: now }
  if (preciosCierre !== null) updatePayload.precio_cierre = preciosCierre

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

Admin also fetches all staff profiles for the seller list:
```js
supabase.from('profiles').select('id, nombre, email').in('role', ['admin', 'seller']).order('nombre')
```

Seller only sees their own stats — no staff fetch needed.

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

A table with one row per seller (only sellers who have at least one lead in the period, plus all staff members from the profiles fetch). Columns: Vendedor, Asignados, Cerrados, Tasa, Ingreso, Días prom.

### Seller view

Five KPI cards in a responsive grid (same style as Dashboard KPIs). No table — only their own data.

### Date range filter

Two `<input type="date">` fields (Desde / Hasta) in the page header. Same styling as `src/pages/admin/Reportes.jsx`. Both are optional — empty means no date restriction.

### PDF export (admin only)

A "Exportar PDF" button generates a landscape PDF using jsPDF + jspdf-autotable with the same branded header/footer utilities already in `Reportes.jsx`. The table matches the admin view. Visible only to admins.

---

## Sidebar link

In `AdminLayout.jsx`, add "Rendimiento" link with `ChartBarSquareIcon` (HeroIcons 24/outline). Visible when `profile?.role === 'admin' || profile?.role === 'seller'`. Position: after "Reportes" in the nav list.

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
  → commitClose(precio | null)
  → UPDATE leads SET status, last_activity_at, precio_cierre
  → INSERT lead_events status_change
```

---

## Error Handling

- If leads fetch fails: show error state with retry button.
- If staff fetch fails (admin): show error state.
- `precio_cierre` input accepts only positive numbers; negative values are clamped to 0 client-side.

---

## Out of Scope

- CSV export of the performance report
- Per-seller drill-down (clicking a seller to see their individual leads)
- Historical trend charts
- Notifications when a seller hits a target

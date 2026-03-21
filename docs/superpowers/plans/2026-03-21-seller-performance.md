# Seller Performance Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Rendimiento page with per-seller KPIs, capture closing price when a lead is marked Cerrado, and extract shared PDF utilities into a reusable module.

**Architecture:** Five tasks in dependency order — (1) extract PDF utilities to a shared file, (2) DB migration, (3) patch `Leads.jsx` for the closing-price modal, (4) create `Rendimiento.jsx`, (5) wire the route and sidebar link. Each task is independently buildable and committable.

**Tech Stack:** React 19, Vite 7, Supabase JS v2, Tailwind CSS 3, Heroicons 24/outline, jsPDF, jspdf-autotable, date-fns.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/pdfUtils.js` | **Create** | Shared PDF utilities — header, footer, styles, helpers |
| `src/pages/admin/Reportes.jsx` | **Modify** | Replace inline PDF utilities with imports from `src/lib/pdfUtils.js` |
| `src/pages/admin/Leads.jsx` | **Modify** | Add `pendingClose` state, `commitClose` function, price modal JSX |
| `src/pages/admin/Rendimiento.jsx` | **Create** | Full performance report page |
| `src/App.jsx` | **Modify** | Import `Rendimiento`; add child route `path="rendimiento"` |
| `src/pages/admin/AdminLayout.jsx` | **Modify** | Add `ChartBarSquareIcon`; consolidate `navItems` with role filtering |

---

## Task 1: Extract PDF utilities to `src/lib/pdfUtils.js`

**Files:**
- Create: `src/lib/pdfUtils.js`
- Modify: `src/pages/admin/Reportes.jsx` (lines 23–140)

Context: `Reportes.jsx` currently defines `addPDFHeader`, `addPDFFooters`, `buildPeriodString`, `makeStatusHook`, and five constants as non-exported module-level code (lines 23–140). These must move to a shared file so `Rendimiento.jsx` can import them.

- [ ] **Step 1: Create `src/lib/pdfUtils.js`**

```js
import { format } from 'date-fns'

// ─── Colours ──────────────────────────────────────────────────────────────────
export const BRAND_RED  = [220, 38, 38]
export const HEADER_RED = [153, 27, 27]
export const GRAY_50    = [249, 250, 251]
export const GRAY_200   = [229, 231, 235]
export const GRAY_800   = [31, 41, 55]

// Status badge fill colours — keys must match STATUS_LABELS values used in Reportes/Rendimiento
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
  headStyles: {
    fillColor: HEADER_RED,
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    fontSize: 8,
  },
  alternateRowStyles: { fillColor: GRAY_50 },
  bodyStyles: { fontSize: 8, textColor: GRAY_800 },
  styles: {
    cellPadding: 3,
    lineColor: GRAY_200,
    lineWidth: 0.1,
  },
}

/**
 * Draws the branded header banner and returns the Y position where content starts.
 * Works for both portrait and landscape — uses doc.internal.pageSize.getWidth().
 */
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

/**
 * Adds page-number footers to every page. Call AFTER all autoTable calls.
 */
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

/**
 * Returns a human-readable period string for the report header.
 */
export function buildPeriodString(from, to) {
  if (!from && !to) return 'Todo el período'
  if (from && to) return `${format(new Date(from), 'dd/MM/yyyy')} — ${format(new Date(to), 'dd/MM/yyyy')}`
  if (from) return `Desde ${format(new Date(from), 'dd/MM/yyyy')}`
  return `Hasta ${format(new Date(to), 'dd/MM/yyyy')}`
}

/**
 * Returns a jspdf-autotable didParseCell hook that colours cells in the status column.
 * @param {number} statusColIndex - 0-based column index of the status column
 */
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

- [ ] **Step 2: Replace the inline utilities in `Reportes.jsx` with imports**

Remove the entire block from line 23 (`// ─── PDF shared utilities`) through line 140 (end of `makeStatusHook`).

Then add these imports at the top of `Reportes.jsx`, after the existing `import { supabase }` line:

```js
import {
  GRAY_50, GRAY_200, GRAY_800,
  TABLE_STYLES,
  addPDFHeader, addPDFFooters, buildPeriodString, makeStatusHook,
} from '../../lib/pdfUtils'
```

The rest of `Reportes.jsx` is unchanged — all call sites (`addPDFHeader(doc, ...)`, `makeStatusHook(5)`, etc.) remain exactly the same.

Note: `BRAND_RED` and `HEADER_RED` are only used inside `pdfUtils.js` itself, not directly in `Reportes.jsx`, so they do not need to be imported here. `GRAY_50`, `GRAY_200`, `GRAY_800` are used in the KPI boxes in `exportVentasPDF` and must be imported.

Note on jsPDF import: `jsPDF` is a **named** export — always use `import { jsPDF } from 'jspdf'`. The spec's "Imports" section incorrectly shows a default import; ignore it and use the named form as `Reportes.jsx` does today.

- [ ] **Step 3: Build to verify no errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors. If you see "GRAY_50 is not defined" or similar, check that those constants are included in the import list.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdfUtils.js src/pages/admin/Reportes.jsx
git commit -m "refactor(pdf): extract shared PDF utilities to src/lib/pdfUtils.js"
```

---

## Task 2: DB Migration

**This step is manual — run in the Supabase SQL Editor.**

Context: `precio_cierre` stores the optional closing price captured when a lead's status changes to `'closed'`. It is nullable — a null means "no price recorded."

- [ ] **Step 1: Run the migration in Supabase SQL Editor**

```sql
alter table leads add column if not exists precio_cierre numeric;
```

- [ ] **Step 2: Force PostgREST schema cache reload**

```sql
NOTIFY pgrst, 'reload schema';
```

(This is necessary — without it, Supabase JS v2 will return a 400 error when any code tries to write `precio_cierre`.)

- [ ] **Step 3: Verify the column exists**

In the Supabase Table Editor, open the `leads` table and confirm the `precio_cierre` column is present with type `numeric` and nullable.

---

## Task 3: Add `precio_cierre` modal to `Leads.jsx`

**Files:**
- Modify: `src/pages/admin/Leads.jsx`

Context: When `updateStatus` is called with `newStatus === 'closed'`, instead of immediately saving, we intercept and open a modal asking for an optional closing price. Two buttons resolve the modal: "Guardar con precio" (saves the price) and "Omitir" (saves null). Both call `commitClose(precioCierre)`.

- [ ] **Step 1: Add three new state variables** to `Leads.jsx`, after the existing `confirmDelete` state:

```js
const [pendingClose, setPendingClose]     = useState(null)  // { id, newStatus, oldLabel, newLabel }
const [closePriceOpen, setClosePriceOpen] = useState(false)
const [closePriceInput, setClosePriceInput] = useState('')
```

- [ ] **Step 2: Add the `commitClose` function** to `Leads.jsx`, after the `updateNotas` function:

```js
async function commitClose(precioCierre) {
  const { id, newStatus, oldLabel, newLabel } = pendingClose
  const now = new Date().toISOString()
  // precio_cierre is always written — null means "no price recorded"
  const updatePayload = {
    status: newStatus,
    last_activity_at: now,
    precio_cierre: precioCierre,
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

- [ ] **Step 3: Modify `updateStatus`** to intercept `newStatus === 'closed'`

Find the existing `updateStatus` function and **replace the entire function** (from the `async function updateStatus(id, newStatus) {` line through its closing `}`) with the following complete function body:

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

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('leads')
    .update({ status: newStatus, last_activity_at: now })
    .eq('id', id)
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

- [ ] **Step 4: Add the closing-price modal** to the JSX return, directly before the existing `{historyLead && <LeadHistoryModal .../>}` block:

```jsx
{/* ── Closing price modal ────────────────────────────── */}
{closePriceOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Precio de cierre</h3>
      <p className="text-sm text-gray-500 mb-4">
        Registra el precio al que se cerró este lead (opcional).
      </p>
      <input
        type="number"
        min={0}
        value={closePriceInput}
        onChange={e => setClosePriceInput(e.target.value)}
        placeholder="Precio de cierre (opcional)"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => commitClose(null)}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          Omitir
        </button>
        <button
          onClick={() => commitClose(Math.max(0, Number(closePriceInput) || 0))}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Guardar con precio
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 5: Build to verify no errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 6: Manual smoke test**

Run `npm run dev`, navigate to `/admin/leads`, change any lead's status to "Cerrado". The closing-price modal should appear. Try both buttons:
- "Guardar con precio" with a number: the lead should update, toast "Estado actualizado" should appear.
- "Omitir": the lead should update without a price.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Leads.jsx
git commit -m "feat(leads): add optional precio_cierre modal when closing a lead"
```

---

## Task 4: Create `src/pages/admin/Rendimiento.jsx`

**Files:**
- Create: `src/pages/admin/Rendimiento.jsx`

Context: Admin sees a table of all staff with KPI columns. Seller sees five KPI cards (their own data only). Both have a date range filter. Admin has a "Exportar PDF" button. On fetch failure, show error + retry. While loading, show a pulse skeleton.

```jsx
import { useState, useEffect } from 'react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  addPDFHeader, addPDFFooters, buildPeriodString, TABLE_STYLES,
} from '../../lib/pdfUtils'

function formatPrice(p) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(p ?? 0)
}

function computeKPIs(leads, sellerId) {
  const assigned  = leads.filter(l => l.assigned_to === sellerId)
  const closed    = assigned.filter(l => l.status === 'closed')
  const withPrice = closed.filter(l => l.precio_cierre != null)
  const ingreso   = withPrice.reduce((sum, l) => sum + Number(l.precio_cierre), 0)
  const diasList  = closed
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

export default function Rendimiento() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [leads, setLeads]   = useState([])
  const [staff, setStaff]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('leads')
        .select('id, assigned_to, status, precio_cierre, created_at, last_activity_at')
        .order('created_at', { ascending: false })

      if (!isAdmin) query = query.eq('assigned_to', profile.id)
      if (dateFrom)  query = query.gte('created_at', dateFrom)
      if (dateTo)    query = query.lte('created_at', dateTo + 'T23:59:59')

      const promises = [query]
      if (isAdmin) {
        promises.push(
          supabase.from('profiles').select('id, nombre, email').in('role', ['admin', 'seller']).order('nombre')
        )
      }

      const results = await Promise.all(promises)
      const { data: leadsData, error: leadsErr } = results[0]
      if (leadsErr) throw leadsErr

      setLeads(leadsData ?? [])

      if (isAdmin) {
        const { data: staffData, error: staffErr } = results[1]
        if (staffErr) throw staffErr
        setStaff(staffData ?? [])
      }
    } catch (e) {
      setError(e.message ?? 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) fetchData()
  }, [profile, dateFrom, dateTo])

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' })
    const period = buildPeriodString(dateFrom, dateTo)
    const startY = addPDFHeader(doc, 'Rendimiento por Vendedor', period)

    autoTable(doc, {
      startY,
      head: [['Vendedor', 'Asignados', 'Cerrados', 'Tasa', 'Ingreso', 'Días prom.']],
      body: staff.map(s => {
        const k = computeKPIs(leads, s.id)
        return [
          s.nombre ?? s.email,
          k.asignados,
          k.cerrados,
          `${k.tasa}%`,
          formatPrice(k.ingreso),
          k.diasPromedio != null ? `${k.diasPromedio} días` : '—',
        ]
      }),
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 29 },
        4: { cellWidth: 60 },
        5: { cellWidth: 60 },
      },
      ...TABLE_STYLES,
    })

    addPDFFooters(doc, 'Rendimiento por Vendedor')
    doc.save(`rendimiento-${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  // ── Render helpers ───────────────────────────────────────────
  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="p-6 text-center">
      <p className="text-sm text-red-600 mb-3">{error}</p>
      <button
        onClick={fetchData}
        className="text-sm text-red-600 underline hover:no-underline"
      >
        Reintentar
      </button>
    </div>
  )

  const myKPIs = !isAdmin ? computeKPIs(leads, profile.id) : null

  const KPI_CARDS = !isAdmin ? [
    { label: 'Leads asignados',  value: myKPIs.asignados },
    { label: 'Leads cerrados',   value: myKPIs.cerrados },
    { label: 'Tasa de cierre',   value: `${myKPIs.tasa}%` },
    { label: 'Ingreso total',    value: formatPrice(myKPIs.ingreso) },
    { label: 'Días prom. cierre',value: myKPIs.diasPromedio != null ? `${myKPIs.diasPromedio} días` : '—' },
  ] : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rendimiento</h1>
          <p className="text-sm text-gray-400 mt-0.5">KPIs por vendedor</p>
        </div>

        {/* Date filters */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-500">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <label className="text-sm text-gray-500">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {isAdmin && (
            <button
              onClick={exportPDF}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Exportar PDF
            </button>
          )}
        </div>
      </div>

      {/* Admin: table */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 font-medium">
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3 text-right">Asignados</th>
                <th className="px-4 py-3 text-right">Cerrados</th>
                <th className="px-4 py-3 text-right">Tasa</th>
                <th className="px-4 py-3 text-right">Ingreso</th>
                <th className="px-4 py-3 text-right">Días prom.</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => {
                const k = computeKPIs(leads, s.id)
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.nombre ?? s.email}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{k.asignados}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{k.cerrados}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${k.tasa >= 50 ? 'text-green-600' : k.tasa > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {k.tasa}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatPrice(k.ingreso)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {k.diasPromedio != null ? `${k.diasPromedio} días` : '—'}
                    </td>
                  </tr>
                )
              })}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    No hay vendedores registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Seller: KPI cards */}
      {!isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {KPI_CARDS.map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 1: Create the file** with the complete code above at `src/pages/admin/Rendimiento.jsx`.

- [ ] **Step 2: Build to verify no errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors. Common issues:
- "Cannot find module '../../lib/pdfUtils'" → Task 1 must be completed first.
- "differenceInDays is not a function" → Check the import from `date-fns`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Rendimiento.jsx
git commit -m "feat(rendimiento): add seller performance report page"
```

---

## Task 5: Wire route + sidebar link

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/admin/AdminLayout.jsx`

### Part A — `src/App.jsx`

- [ ] **Step 1: Add the import** at the top of `App.jsx`, after the existing admin page imports (after the `import Perfil` line):

```js
import Rendimiento from './pages/admin/Rendimiento'
```

- [ ] **Step 2: Add the child route** inside the `<Route path="/admin">` block, after the `reportes` route (after line 88):

```jsx
<Route path="rendimiento" element={<Rendimiento />} />
```

### Part B — `src/pages/admin/AdminLayout.jsx`

- [ ] **Step 3: Add `ChartBarSquareIcon`** to the existing `@heroicons/react/24/outline` import (line 7–18). The import currently includes `ChartBarIcon`; add `ChartBarSquareIcon` alongside it:

```js
import {
  ArchiveBoxIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
  ChartBarSquareIcon,        // ← add this
  ArrowRightOnRectangleIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
```

- [ ] **Step 4: Replace the `navItems` array and consolidate Usuarios** into it with role-based filtering. Replace the current `navItems` constant (lines 20–25) and the standalone Usuarios `NavLink` block inside `SidebarContent` with the following:

Replace the `navItems` array at lines 20–25 with:

```js
const navItems = [
  { to: '/admin/dashboard',    label: 'Dashboard',    icon: Squares2X2Icon,       roles: null },
  { to: '/admin/inventario',   label: 'Inventario',   icon: ArchiveBoxIcon,        roles: null },
  { to: '/admin/leads',        label: 'Leads',        icon: UserGroupIcon,         roles: null },
  { to: '/admin/reportes',     label: 'Reportes',     icon: ChartBarIcon,          roles: null },
  { to: '/admin/rendimiento',  label: 'Rendimiento',  icon: ChartBarSquareIcon,    roles: ['admin', 'seller'] },
  { to: '/admin/usuarios',     label: 'Usuarios',     icon: DocumentChartBarIcon,  roles: ['admin'] },
]
```

`roles: null` means "visible to all roles." `roles: ['admin', 'seller']` means "only those roles."

- [ ] **Step 5: Update the nav render loop** in `SidebarContent` to filter by role and remove the standalone Usuarios `NavLink`. Replace lines 74–90 (the `navItems.map(...)` block plus the standalone Usuarios NavLink) with:

```jsx
{navItems
  .filter(item => !item.roles || item.roles.includes(profile?.role))
  .map(({ to, label, icon: Icon }) => (
    <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {to === '/admin/leads' && staleCount > 0 && (
        <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-semibold leading-none">
          {staleCount}
        </span>
      )}
    </NavLink>
  ))
}
```

- [ ] **Step 6: Build to verify no errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 7: Manual verification**

Run `npm run dev`:

- Log in as **admin**: sidebar should show Dashboard, Inventario, Leads, Reportes, Rendimiento, Usuarios.
- Log in as **seller**: sidebar should show Dashboard, Inventario, Leads, Reportes, Rendimiento (no Usuarios).
- Log in as **viewer**: sidebar should show Dashboard, Inventario, Leads, Reportes (no Rendimiento, no Usuarios).
- Navigate to `/admin/rendimiento` as admin: date filters, staff table, "Exportar PDF" button visible.
- Navigate to `/admin/rendimiento` as seller: date filters, 5 KPI cards, no table, no PDF button.
- Download the PDF as admin: landscape orientation, red header, table with all staff rows, page numbers in footer.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx src/pages/admin/AdminLayout.jsx
git commit -m "feat(rendimiento): add route and sidebar link; consolidate role-gated nav items"
```

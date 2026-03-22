# Compras Export (PDF + CSV) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "↓ CSV" and "↓ PDF" buttons to the Compras toolbar that export the currently filtered list of purchases plus their associated gastos.

**Architecture:** All logic lives in `src/pages/admin/Compras.jsx` — one new state var (`exporting`), two handler functions (`handleExportCsv`, `handleExportPdf`), and two toolbar buttons. CSV uses a plain JS helper; PDF uses the already-installed `jspdf` + `jspdf-autotable`. Both handlers fetch gastos fresh from `gastos_compra` at export time.

**Tech Stack:** React 19, Supabase JS v2, jspdf@^4.2.1, jspdf-autotable@^5.0.7 (already installed), Tailwind CSS 3, react-hot-toast.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/pages/admin/Compras.jsx` | **Modify** | Add imports, state var, two handlers, two toolbar buttons |

---

## Task 1: Modify `src/pages/admin/Compras.jsx`

**Files:**
- Modify: `src/pages/admin/Compras.jsx`

**Current file state (relevant sections):**
- Lines 1–8: imports block
- Line 62: last state var (`docDeleting`)
- Lines 168–174: end of `handleDocDelete` (insert new functions here)
- Lines 325–337: toolbar flex div (add buttons between input and "Registrar compra")

**Make all 4 changes in one edit session.**

---

- [ ] **Step 1: Add jsPDF, autoTable, and logo imports**

Find:
```js
import { useState, useEffect, Fragment } from 'react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  ChevronDownIcon, ChevronUpIcon, TrashIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline'
```

Replace with:
```js
import { useState, useEffect, Fragment } from 'react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  ChevronDownIcon, ChevronUpIcon, TrashIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline'
import logo from '../../assets/logo.png'
```

---

- [ ] **Step 2: Add `exporting` state variable**

Find:
```js
  const [docDeleting, setDocDeleting]   = useState(false)
```

Replace with:
```js
  const [docDeleting, setDocDeleting]   = useState(false)
  const [exporting, setExporting]       = useState(false)
```

---

- [ ] **Step 3: Add `handleExportCsv` and `handleExportPdf` after `handleDocDelete`**

Find:
```js
    setCompras(prev => prev.map(c =>
      c.id === compra.id ? { ...c, [urlField]: null, [field]: false } : c
    ))
    setDocDeleting(false)
    toast.success('Documento eliminado')
    setDocModal(null)
  }

  async function handleSave() {
```

Replace with:
```js
    setCompras(prev => prev.map(c =>
      c.id === compra.id ? { ...c, [urlField]: null, [field]: false } : c
    ))
    setDocDeleting(false)
    toast.success('Documento eliminado')
    setDocModal(null)
  }

  async function handleExportCsv() {
    setExporting(true)
    try {
      const ids = filtered.map(c => c.id)
      const { data: gastosData, error: gastosErr } = await supabase
        .from('gastos_compra').select('*').in('compra_id', ids)
      if (gastosErr) { toast.error('Error al obtener gastos'); return }

      const gastosByCompra = {}
      for (const g of gastosData) {
        if (!gastosByCompra[g.compra_id]) gastosByCompra[g.compra_id] = []
        gastosByCompra[g.compra_id].push(g)
      }

      function downloadCsv(filename, headers, rows) {
        const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
        const lines = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))]
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = filename; a.click()
        URL.revokeObjectURL(url)
      }

      const comprasHeaders = [
        'Fecha','Marca','Modelo','Año','Color','KM','VIN',
        'Precio compra','Gastos extras','Costo total',
        'Forma de pago','Vendedor','Teléfono',
        'Factura','Tenencia','Verificación','Notas',
      ]
      const comprasRows = filtered.map(c => {
        const extras = (gastosByCompra[c.id] ?? []).reduce((s, g) => s + Number(g.monto), 0)
        return [
          c.fecha_compra, c.marca, c.modelo, c.año, c.color, c.kilometraje, c.vin,
          c.precio_compra, extras, Number(c.precio_compra) + extras,
          c.forma_pago, c.vendedor_nombre, c.vendedor_telefono,
          c.doc_factura ? 'Sí' : 'No',
          c.doc_tenencia ? 'Sí' : 'No',
          c.doc_verificacion ? 'Sí' : 'No',
          c.notas,
        ]
      })
      downloadCsv('compras-autoklic.csv', comprasHeaders, comprasRows)

      await new Promise(r => setTimeout(r, 200))

      const compraMap = Object.fromEntries(filtered.map(c => [c.id, c]))
      const gastosHeaders = ['Compra','Fecha','Concepto','Monto']
      const gastosRows = gastosData.map(g => {
        const c = compraMap[g.compra_id] ?? {}
        return [[c.marca, c.modelo, c.año].filter(Boolean).join(' '), g.fecha, g.concepto, g.monto]
      })
      downloadCsv('gastos-autoklic.csv', gastosHeaders, gastosRows)

      toast.success('CSV descargado')
    } catch {
      toast.error('Error al generar el CSV')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPdf() {
    setExporting(true)
    try {
      const ids = filtered.map(c => c.id)
      const { data: gastosData, error: gastosErr } = await supabase
        .from('gastos_compra').select('*').in('compra_id', ids)
      if (gastosErr) { toast.error('Error al obtener gastos'); return }

      const gastosByCompra = {}
      for (const g of gastosData) {
        if (!gastosByCompra[g.compra_id]) gastosByCompra[g.compra_id] = []
        gastosByCompra[g.compra_id].push(g)
      }

      const fmt = n => new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
      }).format(n ?? 0)

      const doc = new jsPDF({ orientation: 'landscape' })
      const today = new Date().toLocaleDateString('es-MX')

      // Logo (best-effort — skip if loading fails)
      try {
        const res = await fetch(logo)
        const blob = await res.blob()
        const dataUrl = await new Promise(r => {
          const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob)
        })
        doc.addImage(dataUrl, 'PNG', 14, 8, 28, 10)
      } catch {}

      // Header
      doc.setFontSize(14).setFont(undefined, 'bold')
      doc.text('Reporte de Compras', 48, 14)
      doc.setFontSize(9).setFont(undefined, 'normal').setTextColor(120)
      doc.text(`Generado el ${today} · ${filtered.length} registros`, 48, 20)
      doc.setTextColor(0)

      // Main table
      autoTable(doc, {
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9 },
        head: [['Fecha','Marca','Modelo','Año','KM','Precio compra','Gastos extras','Costo total','Forma de pago','Vendedor','F','T','V']],
        body: filtered.map(c => {
          const extras = (gastosByCompra[c.id] ?? []).reduce((s, g) => s + Number(g.monto), 0)
          return [
            c.fecha_compra, c.marca, c.modelo, c.año,
            c.kilometraje != null ? Number(c.kilometraje).toLocaleString('es-MX') : '',
            fmt(c.precio_compra), fmt(extras), fmt(Number(c.precio_compra) + extras),
            c.forma_pago, c.vendedor_nombre,
            c.doc_factura ? '✓' : '✗',
            c.doc_tenencia ? '✓' : '✗',
            c.doc_verificacion ? '✓' : '✗',
          ]
        }),
      })

      // Gastos detail sub-tables
      for (const c of filtered) {
        const lista = gastosByCompra[c.id]
        if (!lista?.length) continue
        const startY = doc.lastAutoTable.finalY + 8
        doc.setFontSize(9).setFont(undefined, 'bold').setTextColor(0)
        doc.text(`${[c.marca, c.modelo, c.año].filter(Boolean).join(' ')} — Gastos adicionales`, 14, startY)
        autoTable(doc, {
          startY: startY + 4,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [75, 85, 99], textColor: 255 },
          head: [['Fecha','Concepto','Monto']],
          body: lista.map(g => [g.fecha, g.concepto, fmt(g.monto)]),
        })
      }

      // Page numbers
      const total = doc.internal.getNumberOfPages()
      for (let i = 1; i <= total; i++) {
        doc.setPage(i)
        doc.setFontSize(8).setFont(undefined, 'normal').setTextColor(150)
        doc.text(
          `Página ${i} de ${total}`,
          doc.internal.pageSize.width - 14,
          doc.internal.pageSize.height - 8,
          { align: 'right' },
        )
      }

      doc.save('compras-autoklic.pdf')
      toast.success('PDF descargado')
    } catch {
      toast.error('Error al generar el PDF')
    } finally {
      setExporting(false)
    }
  }

  async function handleSave() {
```

---

- [ ] **Step 4: Add the two export buttons in the toolbar**

Find:
```jsx
          <input
            type="text"
            placeholder="Buscar por marca, modelo o vendedor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={() => { setForm(emptyForm()); setModalOpen(true) }}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Registrar compra
          </button>
```

Replace with:
```jsx
          <input
            type="text"
            placeholder="Buscar por marca, modelo o vendedor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={handleExportCsv}
            disabled={exporting || filtered.length === 0}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
          >
            {exporting ? '…' : '↓ CSV'}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exporting || filtered.length === 0}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
          >
            {exporting ? '…' : '↓ PDF'}
          </button>
          <button
            onClick={() => { setForm(emptyForm()); setModalOpen(true) }}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Registrar compra
          </button>
```

---

- [ ] **Step 5: Build to verify no errors**

```bash
npm run build 2>&1 | grep -E "(built in|error|Error)"
```

Expected: `✓ built in` with no errors. Common issues:
- `Cannot find module 'jspdf'` → packages not installed; run `npm install jspdf jspdf-autotable`
- `logo is not defined` → Step 1 import didn't apply
- `exporting is not defined` → Step 2 state didn't apply
- `handleExportCsv/handleExportPdf is not defined` → Step 3 didn't apply; check the Find string matches exactly

---

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/Compras.jsx
git commit -m "feat(compras): add CSV and PDF export with gastos detail"
```

# PDF Quality Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the visual quality and information density of all three PDF reports (Inventario, Ventas, Leads) in the AutoKlic admin panel.

**Architecture:** All PDF generation lives in `src/pages/admin/Reportes.jsx`. The shared `addPDFHeader` function is replaced with a richer branded header + a new `addPDFFooters` function for page numbers. Both use `doc.internal.pageSize.getWidth/getHeight()` so they work for both portrait and landscape. A shared `TABLE_STYLES` constant and a `makeStatusHook` helper centralize styling. Each of the three export functions is updated to use the new utilities and fixed column widths. The Ventas PDF gains a KPI summary section before the table.

**Tech Stack:** jsPDF, jspdf-autotable, date-fns. No new dependencies required.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/pages/admin/Reportes.jsx` | **Modify** | Replace shared PDF utilities; update all three PDF export functions |

---

## Task 1: Replace `addPDFHeader` and add `addPDFFooters` + shared style constants

**Files:**
- Modify: `src/pages/admin/Reportes.jsx`

Replace the existing `addPDFHeader` function (currently lines 23-35) and add new shared utilities at module level, before the `STATUS_LABELS` constant. All utilities must go OUTSIDE the React component.

- [ ] **Step 1: Read the current file** to locate `addPDFHeader` and understand existing structure

- [ ] **Step 2: Replace `addPDFHeader` and add all new utilities**

Remove the existing `addPDFHeader` function entirely and replace it with all of the following at module level:

```js
// ─── PDF shared utilities ─────────────────────────────────────────────────────

const BRAND_RED  = [220, 38, 38]   // red-600
const HEADER_RED = [153, 27, 27]   // red-800 (table head)
const GRAY_50    = [249, 250, 251]
const GRAY_200   = [229, 231, 235]
const GRAY_800   = [31, 41, 55]

// Status badge fill colors [r, g, b] — keys must match STATUS_LABELS values
const STATUS_FILL = {
  Disponible:        [220, 252, 231],  // green-100
  Vendido:           [243, 244, 246],  // gray-100
  Reservado:         [254, 249, 195],  // yellow-100
  Nuevo:             [219, 234, 254],  // blue-100
  'En revisión':     [254, 243, 199],  // amber-100
  'Oferta enviada':  [243, 232, 255],  // purple-100
  Cerrado:           [243, 244, 246],  // gray-100
}

const TABLE_STYLES = {
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
 * Uses dynamic page width so it works for both portrait and landscape.
 */
function addPDFHeader(doc, title, period = '') {
  const w = doc.internal.pageSize.getWidth()

  // Red banner
  doc.setFillColor(...BRAND_RED)
  doc.rect(0, 0, w, 26, 'F')

  // Brand name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('AutoKlic', 14, 11)

  // Report title
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(title, 14, 20)

  // Generated date — right-aligned in banner
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
 * Uses dynamic page dimensions so it works for portrait and landscape.
 */
function addPDFFooters(doc, reportTitle) {
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
function buildPeriodString(from, to) {
  if (!from && !to) return 'Todo el período'
  if (from && to) return `${format(new Date(from), 'dd/MM/yyyy')} — ${format(new Date(to), 'dd/MM/yyyy')}`
  if (from) return `Desde ${format(new Date(from), 'dd/MM/yyyy')}`
  return `Hasta ${format(new Date(to), 'dd/MM/yyyy')}`
}

/**
 * Returns a jspdf-autotable didParseCell hook that colors cells in the status column.
 * @param {number} statusColIndex - 0-based column index of the status column
 */
function makeStatusHook(statusColIndex) {
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

- [ ] **Step 3: Build to catch syntax errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors from `Reportes.jsx`.

---

## Task 2: Update `exportInventarioPDF`

**Files:**
- Modify: `src/pages/admin/Reportes.jsx`

Apply branded header, TABLE_STYLES, status cell colors, fixed column widths, and footer.
Portrait usable width = 210 - 14 (left margin) - 14 (right margin) = **182mm**.
Column widths below sum to exactly 182mm.

- [ ] **Step 1: Replace the `exportInventarioPDF` function** inside the component:

```js
function exportInventarioPDF() {
  const doc = new jsPDF()
  const period = buildPeriodString(dateFrom, dateTo)
  const startY = addPDFHeader(doc, 'Inventario de Autos', period)

  autoTable(doc, {
    startY,
    head: [['Marca', 'Modelo', 'Año', 'Precio', 'Km', 'Estado', 'Visible']],
    body: filteredCars.map(c => [
      c.marca ?? '—',
      c.modelo ?? '—',
      c.año ?? '—',
      formatPrice(c.precio),
      c.kilometraje?.toLocaleString('es-MX') ?? '—',
      STATUS_LABELS[c.status] ?? c.status,
      c.visible ? 'Sí' : 'No',
    ]),
    columnStyles: {
      0: { cellWidth: 30 }, // Marca
      1: { cellWidth: 36 }, // Modelo
      2: { cellWidth: 14 }, // Año
      3: { cellWidth: 32 }, // Precio
      4: { cellWidth: 24 }, // Km
      5: { cellWidth: 32 }, // Estado
      6: { cellWidth: 14 }, // Visible
    },
    didParseCell: makeStatusHook(5),
    ...TABLE_STYLES,
  })

  addPDFFooters(doc, 'Inventario de Autos')
  doc.save(`inventario-${format(new Date(), 'yyyyMMdd')}.pdf`)
}
```

- [ ] **Step 2: Build to catch errors**

```bash
npm run build 2>&1 | tail -20
```

---

## Task 3: Update `exportVentasPDF` with KPI summary

**Files:**
- Modify: `src/pages/admin/Reportes.jsx`

Add a KPI summary section (4 boxes) before the monthly breakdown table.
Portrait usable width = 182mm. Column widths sum to 182mm.

- [ ] **Step 1: Replace the `exportVentasPDF` function** inside the component:

```js
function exportVentasPDF() {
  const doc = new jsPDF()
  const period = buildPeriodString(dateFrom, dateTo)
  let y = addPDFHeader(doc, 'Reporte de Ventas', period)

  // ── KPI summary boxes ─────────────────────────────────────────────────────
  const totalRevenue = filteredSold.reduce((sum, c) => sum + Number(c.precio ?? 0), 0)
  const avgPrice     = filteredSold.length > 0 ? totalRevenue / filteredSold.length : 0

  const byMonthCount = {}
  filteredSold.forEach(c => {
    const key = format(parseISO(c.created_at), 'MMMM yyyy', { locale: es })
    byMonthCount[key] = (byMonthCount[key] ?? 0) + 1
  })
  const bestMonth = Object.entries(byMonthCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const kpis = [
    { label: 'Autos vendidos',  value: String(filteredSold.length) },
    { label: 'Ingreso total',   value: formatPrice(totalRevenue) },
    { label: 'Precio promedio', value: formatPrice(avgPrice) },
    { label: 'Mejor mes',       value: bestMonth },
  ]

  // 4 KPI boxes — each 43mm wide with 3mm gap, starting at x=14
  const boxW = 43, boxH = 22, gap = 3, startX = 14
  kpis.forEach((kpi, i) => {
    const x = startX + i * (boxW + gap)
    doc.setFillColor(...GRAY_50)
    doc.setDrawColor(...GRAY_200)
    doc.roundedRect(x, y, boxW, boxH, 2, 2, 'FD')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(kpi.label, x + boxW / 2, y + 7, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...GRAY_800)
    doc.text(kpi.value, x + boxW / 2, y + 16, { align: 'center' })
    doc.setFont(undefined, 'normal')
  })

  y += boxH + 8

  // ── Monthly breakdown table ───────────────────────────────────────────────
  const byMonth = {}
  filteredSold.forEach(c => {
    const key = format(parseISO(c.created_at), 'MMMM yyyy', { locale: es })
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(c)
  })

  const body = []
  for (const [month, items] of Object.entries(byMonth)) {
    body.push([{
      content: `${month}  (${items.length} auto${items.length !== 1 ? 's' : ''})`,
      colSpan: 5,
      styles: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [153, 27, 27] },
    }])
    items.forEach(c => body.push([
      c.marca ?? '—',
      c.modelo ?? '—',
      c.año ?? '—',
      formatPrice(c.precio),
      format(parseISO(c.created_at), 'dd/MM/yyyy'),
    ]))
  }

  if (body.length === 0) {
    body.push([{
      content: 'Sin ventas en el período seleccionado',
      colSpan: 5,
      styles: { halign: 'center', textColor: [150, 150, 150] },
    }])
  }

  autoTable(doc, {
    startY: y,
    head: [['Marca', 'Modelo', 'Año', 'Precio', 'Fecha']],
    body,
    columnStyles: {
      0: { cellWidth: 36 }, // Marca
      1: { cellWidth: 48 }, // Modelo
      2: { cellWidth: 16 }, // Año
      3: { cellWidth: 54 }, // Precio
      4: { cellWidth: 28 }, // Fecha
    },
    ...TABLE_STYLES,
  })

  addPDFFooters(doc, 'Reporte de Ventas')
  doc.save(`ventas-${format(new Date(), 'yyyyMMdd')}.pdf`)
}
```

- [ ] **Step 2: Build to catch errors**

```bash
npm run build 2>&1 | tail -20
```

---

## Task 4: Update `exportLeadsPDF`

**Files:**
- Modify: `src/pages/admin/Reportes.jsx`

Leads PDF uses **landscape** orientation — page is 297×210mm.
Landscape usable width = 297 - 14 - 14 = **269mm**.
Column widths below sum to 269mm.

- [ ] **Step 1: Replace the `exportLeadsPDF` function** inside the component:

```js
function exportLeadsPDF() {
  const doc = new jsPDF({ orientation: 'landscape' })
  const period = buildPeriodString(dateFrom, dateTo)
  const startY = addPDFHeader(doc, 'Pipeline de Leads', period)

  autoTable(doc, {
    startY,
    head: [['Folio', 'Nombre', 'Auto', 'Email', 'Teléfono', 'Estado', 'Fecha']],
    body: filteredLeads.map(l => [
      (l.id ?? '').substring(0, 8).toUpperCase(),
      l.nombre ?? '—',
      [l.marca, l.modelo, l.año].filter(Boolean).join(' ') || '—',
      l.email ?? '—',
      l.telefono ?? '—',
      STATUS_LABELS[l.status] ?? l.status,
      format(parseISO(l.created_at), 'dd/MM/yyyy'),
    ]),
    columnStyles: {
      0: { cellWidth: 22 },  // Folio
      1: { cellWidth: 40 },  // Nombre
      2: { cellWidth: 50 },  // Auto
      3: { cellWidth: 60 },  // Email
      4: { cellWidth: 32 },  // Teléfono
      5: { cellWidth: 35 },  // Estado
      6: { cellWidth: 30 },  // Fecha
    },
    didParseCell: makeStatusHook(5),
    ...TABLE_STYLES,
  })

  addPDFFooters(doc, 'Pipeline de Leads')
  doc.save(`leads-${format(new Date(), 'yyyyMMdd')}.pdf`)
}
```

- [ ] **Step 2: Build to catch errors**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit all changes**

```bash
git add src/pages/admin/Reportes.jsx
git commit -m "feat(reportes): improve PDF quality — branded header, styled tables, KPI summary, page numbers"
git push
```

- [ ] **Step 4: Manual verification**

Run `npm run dev` and open `/admin/reportes`. Download each PDF:

- [ ] **Inventario PDF:** Red banner header full-width, "AutoKlic" white text, date right-aligned; table has red column headers, alternating gray rows, Estado column colored by status; footer line + "Página 1 de N" on every page; columns fill the page width.
- [ ] **Ventas PDF:** Same header; 4 KPI boxes (autos vendidos, ingreso, promedio, mejor mes); monthly groups in red-tinted rows; footer.
- [ ] **Leads PDF:** Landscape orientation; banner spans full landscape width; status column colored; footer line and page numbers positioned at bottom of landscape page.

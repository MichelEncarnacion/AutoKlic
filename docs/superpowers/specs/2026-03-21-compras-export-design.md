# Compras Export (PDF + CSV) Design

**Date:** 2026-03-21
**Project:** AutoKlic admin panel
**Sub-project:** Exportar compras a PDF y CSV

---

## Goal

Allow admin and seller users to export the currently filtered list of purchases (compras) — including their associated extra costs (gastos) — as a CSV pair or a PDF report, directly from the Compras page.

---

## Scope

1. **UI change** — two export buttons in the Compras toolbar.
2. **CSV export** — two files downloaded in sequence: `compras-autoklic.csv` and `gastos-autoklic.csv`.
3. **PDF export** — one landscape PDF with a header, main table, and gastos detail section.

---

## Out of Scope

- Server-side rendering of exports
- Excel (`.xlsx`) format
- Scheduled or emailed reports
- Exporting document files (Factura/Tenencia/Verificación attachments)
- Custom column selection

---

## Access Control

Both buttons are visible to **admin** and **seller** roles. The exported data always matches what the user sees on screen:
- Admin: all filtered compras
- Seller: only their own compras (already filtered by `created_by` in the existing fetch query)

No additional RLS or role checks needed in the export logic.

---

## UI

### Placement

Two buttons added to the Compras toolbar, between the search input and the "Registrar compra" button:

```
[ Buscar... ]   [ ↓ CSV ]  [ ↓ PDF ]  [ + Registrar compra ]
```

### Button states

| State | Behavior |
|-------|----------|
| No compras in filtered list (`filtered.length === 0`) | Both buttons `disabled` — this also ensures the fetch is never called with an empty `ids` array |
| Export in progress | Active button shows spinner, both disabled |
| Idle | Both buttons enabled |

### Loading state

A single `exporting` boolean state variable controls the disabled/spinner state for both buttons simultaneously (only one export can run at a time).

---

## Data Fetching

At export time (click of either button):

1. Use the in-memory `filtered` array already derived from `compras` state + search filter. No re-fetch of the main table.
2. Always fetch gastos fresh from Supabase for consistency — a single query for all filtered compras. The real table name is `gastos_compra` (matches existing component usage):

```js
const ids = filtered.map(c => c.id)
const { data: gastosData, error } = await supabase
  .from('gastos_compra')
  .select('*')
  .in('compra_id', ids)
```

The Supabase table `gastos_compra` has columns: `id`, `compra_id`, `concepto` (text), `monto` (numeric), `fecha` (date).

3. If the query fails: `toast.error('Error al obtener gastos')`, abort export, reset `exporting` to `false`.
4. Group gastos by `compra_id`:

```js
const gastosByCompra = {}
for (const g of gastosData) {
  if (!gastosByCompra[g.compra_id]) gastosByCompra[g.compra_id] = []
  gastosByCompra[g.compra_id].push(g)
}
```

---

## CSV Export

Two files downloaded in sequence. Numbers are plain (no `$` symbol) so Excel recognizes them as numeric. Dates use `YYYY-MM-DD` format.

### File 1: `compras-autoklic.csv`

One row per compra. Columns:

| Column | Source | Notes |
|--------|--------|-------|
| Fecha | `fecha_compra` | |
| Marca | `marca` | |
| Modelo | `modelo` | |
| Año | `año` | |
| Color | `color` | |
| KM | `kilometraje` | |
| VIN | `vin` | |
| Precio compra | `precio_compra` | plain number |
| Gastos extras | sum of `monto` from `gastosByCompra[c.id]` | `0` if no gastos |
| Costo total | `precio_compra` + gastos extras | always equals `precio_compra` when gastos extras is `0` |
| Forma de pago | `forma_pago` | |
| Vendedor | `vendedor_nombre` | |
| Teléfono | `vendedor_telefono` | |
| Factura | `doc_factura` | `Sí` / `No` |
| Tenencia | `doc_tenencia` | `Sí` / `No` |
| Verificación | `doc_verificacion` | `Sí` / `No` |
| Notas | `notas` | |

### File 2: `gastos-autoklic.csv`

One row per gasto. Columns:

| Column | Source |
|--------|--------|
| Compra | `{marca} {modelo} {año}` of the parent compra |
| Fecha | `fecha` of the gasto (`YYYY-MM-DD`) |
| Concepto | `concepto` |
| Monto | `monto` (plain number) |

Only gastos belonging to compras in the filtered list are included.

### Download mechanism

Use a helper function `downloadCsv(filename, rows)` that:
1. Builds the CSV string (header row + data rows, values wrapped in double quotes, internal double-quotes escaped as `""`)
2. Creates a `Blob` with `text/csv;charset=utf-8;`
3. Creates a temporary `<a>` element, triggers `.click()`, then revokes the object URL

Both files are triggered in sequence (compras first, gastos second) with a `setTimeout` of **200 ms** between them to avoid browser download conflicts.

---

## PDF Export

### Library

`jspdf` + `jspdf-autotable` — already installed as npm dependencies (`jspdf@^4.2.1`, `jspdf-autotable@^5.0.7`). No installation step needed.

### File

`compras-autoklic.pdf` — landscape orientation (`orientation: 'landscape'`).

### Money formatting

All monetary values use `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })`. Example: `$150,000`.

### Structure

**Header (first page):**
- AutoKlic logo: `import logo from '../../assets/logo.png'` → `doc.addImage(logo, 'PNG', x, y, w, h)`. If `addImage` throws, catch and skip the logo gracefully (the title still renders).
- Title: "Reporte de Compras" (bold, 14pt)
- Subtitle: `Generado el {DD/MM/YYYY} · {N} registros` (gray, 9pt)

**Main table** (via `autoTable`):

Columns:

| Fecha | Marca | Modelo | Año | KM | Precio compra | Gastos extras | Costo total | Forma de pago | Vendedor | F | T | V |

- F / T / V = Factura / Tenencia / Verificación → `✓` or `✗`
- Font size: 8pt body, 9pt header row
- Header background: dark gray (`#1f2937`), white text

**Gastos detail section:**

After the main table, iterate compras that have at least one gasto. For each:
1. Print a heading line: `{Marca} {Modelo} {Año} — Gastos adicionales` (bold, 9pt)
2. Render a sub-table with columns: Fecha | Concepto | Monto

Use `doc.lastAutoTable.finalY + padding` as the `startY` for each successive sub-table to correctly position them after the previous table without overlap.

Compras with no gastos are omitted from this section entirely.

**Footer (all pages):**
- `Página {n} de {total}` — right-aligned, 8pt gray
- Added via a loop over `doc.internal.getNumberOfPages()` after all content is generated

### Error handling

Wrap the entire PDF generation block in a `try/catch`. On error: `toast.error('Error al generar el PDF')`, reset `exporting` to `false`.

---

## Error Handling Summary

| Scenario | Behavior |
|----------|----------|
| Filtered list is empty | Both buttons `disabled`, no action possible |
| Gastos query fails | `toast.error('Error al obtener gastos')`, no file downloaded |
| CSV generation error | `toast.error('Error al generar el CSV')` |
| PDF generation error | `toast.error('Error al generar el PDF')` |
| Successful CSV export | `toast.success('CSV descargado')` |
| Successful PDF export | `toast.success('PDF descargado')` |

---

## Files Modified

| File | Change |
|------|--------|
| `src/pages/admin/Compras.jsx` | Add `exporting` state, `handleExportCsv`, `handleExportPdf`, two toolbar buttons |

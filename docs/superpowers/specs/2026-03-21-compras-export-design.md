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
2. **CSV export** — two files downloaded in sequence: `compras.csv` and `gastos.csv`.
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

Two buttons added to the Compras toolbar, between the search input and the "Nueva compra" button:

```
[ Buscar... ]   [ ↓ CSV ]  [ ↓ PDF ]  [ + Nueva compra ]
```

### Button states

| State | Behavior |
|-------|----------|
| No compras in filtered list | Both buttons `disabled` |
| Export in progress | Active button shows spinner, both disabled |
| Idle | Both buttons enabled |

### Loading state

A single `exporting` boolean state variable controls the disabled/spinner state for both buttons simultaneously (only one export can run at a time).

---

## Data Fetching

At export time (click of either button):

1. Use the in-memory `filtered` array already derived from `compras` state + search filter. No re-fetch of the main table.
2. Fetch gastos for the filtered compras in a single query:

```js
const ids = filtered.map(c => c.id)
const { data: gastosData, error } = await supabase
  .from('gastos')
  .select('*')
  .in('compra_id', ids)
```

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

| Column | Source |
|--------|--------|
| Fecha | `fecha_compra` |
| Marca | `marca` |
| Modelo | `modelo` |
| Año | `año` |
| Color | `color` |
| KM | `kilometraje` |
| VIN | `vin` |
| Precio compra | `precio_compra` |
| Gastos extras | sum of `gastos` for that compra |
| Costo total | `precio_compra` + gastos extras |
| Forma de pago | `forma_pago` |
| Vendedor | `vendedor_nombre` |
| Teléfono | `vendedor_telefono` |
| Factura | `doc_factura` → `Sí` / `No` |
| Tenencia | `doc_tenencia` → `Sí` / `No` |
| Verificación | `doc_verificacion` → `Sí` / `No` |
| Notas | `notas` |

### File 2: `gastos-autoklic.csv`

One row per gasto. Columns:

| Column | Source |
|--------|--------|
| Compra | `{marca} {modelo} {año}` of the parent compra |
| Fecha | `fecha` of the gasto |
| Concepto | `concepto` |
| Monto | `monto` |

Only gastos belonging to compras in the filtered list are included.

### Download mechanism

Use a helper function `downloadCsv(filename, rows)` that:
1. Builds the CSV string (header row + data rows, values wrapped in quotes, commas escaped)
2. Creates a `Blob` with `text/csv;charset=utf-8;`
3. Creates a temporary `<a>` element, triggers `.click()`, then revokes the object URL

Both files are triggered in sequence (compras first, gastos second) with a short `setTimeout` between them to avoid browser download conflicts.

---

## PDF Export

### Library

`jspdf` + `jspdf-autotable` — installed as npm dependencies.

### File

`compras-autoklic.pdf` — landscape orientation (`landscape: true`).

### Structure

**Header (first page):**
- AutoKlic logo (imported from `src/assets/logo.png`, rendered via `doc.addImage`)
- Title: "Reporte de Compras"
- Subtitle: `Generado el {date} · {N} registros`

**Main table:**

Columns (landscape to fit):

| Fecha | Marca | Modelo | Año | KM | Precio compra | Gastos extras | Costo total | Forma de pago | Vendedor | F | T | V |

- F / T / V = Factura / Tenencia / Verificación → `✓` or `✗`
- Montos formatted as `$X,XXX` (no decimals)
- Font size: 8pt for table body, 10pt for header row

**Gastos detail section:**

After the main table, for each compra that has at least one gasto:
- A small heading: `{Marca} {Modelo} {Año} — Gastos adicionales`
- A sub-table with columns: Fecha | Concepto | Monto

Compras with no gastos are omitted from this section.

**Footer (all pages):**
- Page number: `Página {n} de {total}` — right-aligned

### Error handling

Wrap the entire PDF generation in a `try/catch`. On error: `toast.error('Error al generar el PDF')`.

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
| `package.json` / `package-lock.json` | Add `jspdf` and `jspdf-autotable` |

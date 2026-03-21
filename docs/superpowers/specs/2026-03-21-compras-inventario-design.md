# Compras → Inventario Link Design

**Date:** 2026-03-21
**Project:** AutoKlic admin panel
**Sub-project:** Vincular compras con inventario

---

## Goal

Allow admin and seller to send a purchased car directly to the `cars` inventory from the Compras page, pre-filling the car data from the purchase record. Once linked, the purchase row shows an "En inventario" badge instead of the action button.

---

## Scope

1. **DB change** — add `car_id` FK column to `compras`.
2. **Frontend change** — add "→ Inventario" button + modal in `Compras.jsx`.

---

## Out of Scope

- Modifying `Inventario.jsx` or `CarModal.jsx`
- Uploading images from the Compras flow
- Editing the linked car from the Compras page
- Showing the car's current status (available/sold/reserved) in the Compras table

---

## Database Changes

### Alter `compras`

```sql
alter table compras
  add column car_id uuid references cars(id) on delete set null;
```

`ON DELETE SET NULL` means if the linked car is deleted from inventory, the purchase record is preserved with `car_id = null` (effectively "un-linking" it, allowing it to be sent to inventory again).

No new RLS policies needed — the existing `compras` policies already cover all columns.

---

## Frontend Architecture

### Files modified

| File | Change |
|------|--------|
| `src/pages/admin/Compras.jsx` | Add "→ Inventario" button + badge; add `SendToInventarioModal` component inline |

### No other files modified

`Inventario.jsx` and `CarModal.jsx` are not touched. The new car appears in inventory automatically because it is inserted into the `cars` table.

---

## Feature: "Agregar a inventario" button

### Location

In the Acciones column of each purchase row, after the expand button and before the delete button (admin only).

### Visibility rules

| Condition | What shows |
|-----------|-----------|
| `car_id` is null | Button "→ Inventario" (admin and seller) |
| `car_id` is not null | Badge `En inventario` (green, no button) |

The badge replaces the button — both are never shown simultaneously.

---

## Feature: Modal "Agregar a inventario"

### Trigger

Clicking "→ Inventario" opens the modal for that purchase row. State: `inventarioModal` holds the `compra` object or `null`.

### Pre-filled fields (from `compras`)

| Field | Source |
|-------|--------|
| Marca | `compra.marca` |
| Modelo | `compra.modelo` |
| Año | `compra.año` |
| Color | `compra.color` |
| Kilometraje | `compra.kilometraje` |

Pre-filled fields are shown as read-only text — not editable inputs. The user only fills the fields below.

### User-filled fields

| Field | Type | Required |
|-------|------|----------|
| Precio de venta | number (> 0) | Yes |
| Transmisión | select: Manual / Automática | Yes |
| Combustible | select: Gasolina / Diésel / Híbrido / Eléctrico | Yes |
| Descripción | textarea | No |

### Validation (client-side before submit)

- `precio > 0` — toast.error if missing or invalid
- `transmision` must be selected
- `combustible` must be selected

### On submit

```js
// Step 1: INSERT into cars
const carPayload = {
  marca:        compra.marca || '',
  modelo:       compra.modelo || '',
  año:          compra.año ? Number(compra.año) : null,
  color:        compra.color || null,
  kilometraje:  compra.kilometraje ? Number(compra.kilometraje) : null,
  precio:       Number(form.precio),
  transmision:  form.transmision,
  combustible:  form.combustible,
  descripcion:  form.descripcion || null,
  status:       'available',
  visible:      true,
  imagenes:     [],
}
const { data: newCar, error: carErr } = await supabase
  .from('cars').insert(carPayload).select().single()
if (carErr) { toast.error('Error al crear auto en inventario'); return }

// Step 2: UPDATE compras SET car_id
const { error: linkErr } = await supabase
  .from('compras').update({ car_id: newCar.id }).eq('id', compra.id)
if (linkErr) {
  // Rollback: delete the orphaned car
  await supabase.from('cars').delete().eq('id', newCar.id)
  toast.error('Error al vincular con la compra'); return
}

// Step 3: Update local state
setCompras(prev => prev.map(c => c.id === compra.id ? { ...c, car_id: newCar.id } : c))
toast.success('Auto agregado al inventario')
setInventarioModal(null)
```

### New state variable

```js
const [inventarioModal, setInventarioModal] = useState(null) // compra object or null
const [inventarioForm, setInventarioForm]   = useState({ precio: '', transmision: '', combustible: '', descripcion: '' })
const [sendingToInventario, setSendingToInventario] = useState(false)
```

---

## Data Flow

```
User clicks "→ Inventario" on a purchase row
  → setInventarioModal(compra)
  → modal opens showing pre-filled read-only fields + user-fill fields

User fills precio, transmision, combustible (+ optional descripcion) → submit
  → validate client-side
  → setSendingToInventario(true)
  → INSERT into cars (status: 'available', visible: true)
  → if INSERT fails: toast.error, keep modal open
  → UPDATE compras SET car_id = newCar.id
  → if UPDATE fails: DELETE cars (rollback), toast.error, keep modal open
  → setCompras: update local state (car_id now set)
  → toast.success('Auto agregado al inventario')
  → setInventarioModal(null)

Row re-renders: car_id != null → shows "En inventario" badge, hides button
```

---

## Error Handling

- INSERT fails: `toast.error('Error al crear auto en inventario')`, modal stays open.
- UPDATE fails: rollback DELETE on `cars`, `toast.error('Error al vincular con la compra')`, modal stays open.
- Validation fails: `toast.error(...)`, modal stays open, no DB calls made.
- If car was deleted from inventory after linking: `car_id` becomes `null` via `ON DELETE SET NULL` — purchase row shows the button again automatically on next data load.

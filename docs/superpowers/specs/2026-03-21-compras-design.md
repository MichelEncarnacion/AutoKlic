# Compras Design

**Date:** 2026-03-21
**Project:** AutoKlic admin panel
**Sub-project:** Registro de compras de autos

---

## Goal

Add a dedicated section to register and track cars acquired by the dealership, including purchase details, seller contact info, payment method, documentation status, and itemized additional expenses (repairs, detailing, etc.).

---

## Scope

1. **DB changes** — two new tables: `compras` and `gastos_compra`.
2. **New page** — `src/pages/admin/Compras.jsx` with a searchable table, expandable rows for expenses, and modals for registration and deletion.
3. **Route** — `path="compras"` added as a child of `/admin` in `App.jsx`.
4. **Sidebar link** — visible to `admin` and `seller` roles.

---

## Out of Scope

- PDF / CSV export of purchases
- Attaching document files to a purchase
- Connecting purchases to the existing `cars` inventory table
- Per-expense categories or tagging

---

## Database Changes

### New table: `compras`

```sql
create table compras (
  id               uuid primary key default gen_random_uuid(),
  marca            text,
  modelo           text,
  año              int,
  color            text,
  kilometraje      numeric,
  vin              text,
  precio_compra    numeric not null,
  fecha_compra     date not null,
  vendedor_nombre  text,
  vendedor_telefono text,
  forma_pago       text check (forma_pago in ('efectivo', 'transferencia', 'cheque')),
  doc_factura      boolean not null default false,
  doc_tenencia     boolean not null default false,
  doc_verificacion boolean not null default false,
  notas            text,
  created_by       uuid references profiles(id) on delete set null,
  created_at       timestamptz not null default now()
);
```

### New table: `gastos_compra`

```sql
create table gastos_compra (
  id         uuid primary key default gen_random_uuid(),
  compra_id  uuid not null references compras(id) on delete cascade,
  concepto   text not null,
  monto      numeric not null,
  fecha      date,
  created_at timestamptz not null default now()
);
```

`ON DELETE CASCADE` on `compra_id` means deleting a purchase automatically removes all its expenses.

### RLS policies

**`compras`:**

```sql
-- SELECT: admin sees all; seller sees only own purchases
create policy "compras_select" on compras for select
  using (
    (select role from profiles where id = auth.uid()) = 'admin'
    or created_by = auth.uid()
  );

-- INSERT: admin and seller; created_by must equal the caller's own id
create policy "compras_insert" on compras for insert
  with check (
    (select role from profiles where id = auth.uid()) in ('admin', 'seller')
    and created_by = auth.uid()
  );

-- UPDATE: admin can update any; seller can update own (doc toggles)
create policy "compras_update" on compras for update
  using (
    (select role from profiles where id = auth.uid()) = 'admin'
    or created_by = auth.uid()
  );

-- DELETE: admin only
create policy "compras_delete" on compras for delete
  using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );
```

**`gastos_compra`:**

```sql
-- SELECT: admin sees all; seller sees only expenses of own purchases
create policy "gastos_select" on gastos_compra for select
  using (
    (select role from profiles where id = auth.uid()) = 'admin'
    or exists (
      select 1 from compras
      where compras.id = compra_id
      and compras.created_by = auth.uid()
    )
  );

-- INSERT: admin and seller (compra_id must belong to a purchase they can read)
create policy "gastos_insert" on gastos_compra for insert
  with check (
    (select role from profiles where id = auth.uid()) = 'admin'
    or exists (
      select 1 from compras
      where compras.id = compra_id
      and compras.created_by = auth.uid()
    )
  );

-- DELETE: admin only
create policy "gastos_delete" on gastos_compra for delete
  using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );
```

---

## Frontend Architecture

### Files modified

| File | Change |
|------|--------|
| `src/App.jsx` | Add `import Compras` and child route `path="compras"` |
| `src/pages/admin/AdminLayout.jsx` | Add `ShoppingCartIcon` to Heroicons import; add "Compras" to `navItems` with `roles: ['admin', 'seller']`, positioned after "Rendimiento" |

### Files created

| File | Responsibility |
|------|---------------|
| `src/pages/admin/Compras.jsx` | Full purchases page — table, modals, inline expense form |

### Router

Add as a child route inside the existing `<Route path="/admin">` block in `src/App.jsx`:

```jsx
import Compras from './pages/admin/Compras'

// Inside <Route path="/admin">:
<Route path="compras" element={<Compras />} />
```

---

## Feature: Compras page

### Data fetching

On mount, fetch purchases filtered by role:

```js
// Admin: all purchases
supabase.from('compras').select('*').order('fecha_compra', { ascending: false })

// Seller: only own purchases
supabase.from('compras').select('*').eq('created_by', profile.id).order('fecha_compra', { ascending: false })
```

Expenses are fetched lazily — only when a row is expanded:

```js
supabase.from('gastos_compra').select('*').eq('compra_id', compraId).order('created_at', { ascending: true })
```

### Costo total

Computed in JavaScript per purchase:

```js
function costoTotal(compra, gastos) {
  const extras = (gastos[compra.id] ?? []).reduce((sum, g) => sum + Number(g.monto), 0)
  return Number(compra.precio_compra) + extras
}
```

`gastos` is a state object keyed by `compra_id`, populated on row expand.

### Table

Columns: Fecha, Auto (marca modelo año), Km, Precio compra, Gastos extras, Costo total, Forma de pago, Documentos, Vendedor, Acciones.

- **Fecha**: formatted as `dd/MM/yyyy` using `format(parseISO(compra.fecha_compra), 'dd/MM/yyyy')` from `date-fns`
- **Auto**: `${marca} ${modelo} ${año}` — falls back to `'—'` for missing fields
- **Km**: formatted with `toLocaleString('es-MX')`
- **Precio compra / Gastos extras / Costo total**: formatted as MXN currency
- **Forma de pago**: capitalized label (Efectivo / Transferencia / Cheque), shown as a small badge
- **Documentos**: three inline icon badges — Factura, Tenencia, Verificación. Green check if true, gray X if false. Clicking a badge toggles the value and saves immediately via `UPDATE compras SET doc_xxx = !current`.
- **Acciones**: expand/collapse button (all roles) + delete button (admin only)

### Expandable row

When expanded, shows:
1. A list of existing `gastos_compra` rows: concepto, monto (MXN), fecha
2. An inline form to add a new gasto: concepto (text, required), monto (number, required), fecha (date, optional) + "Agregar" button

While expenses are loading (first expand): show a small skeleton pulse.

### Loading state

While the initial fetch is in progress: pulse skeleton — two rows of gray blocks (`animate-pulse`).

### Modal: Registrar compra

Opened by the "Registrar compra" button. Fields:

| Field | Type | Required |
|-------|------|----------|
| Marca | text | No |
| Modelo | text | No |
| Año | number (4 digits) | No |
| Color | text | No |
| Kilometraje | number (≥ 0) | No |
| VIN | text | No |
| Precio de compra | number (> 0) | Yes |
| Fecha de compra | date | Yes |
| Nombre del vendedor | text | No |
| Teléfono del vendedor | text | No |
| Forma de pago | select: Efectivo / Transferencia / Cheque | No |
| Factura | checkbox | No (default false) |
| Tenencia | checkbox | No (default false) |
| Verificación | checkbox | No (default false) |
| Notas | textarea | No |

On submit: `INSERT INTO compras`. On success: close modal, prepend new row to local state. On error: toast error, keep modal open.

`created_by` is set to `profile.id` on the client before inserting.

### Modal: Confirmar eliminación

Admin-only. Triggered by the delete button on a row. Shows the auto name and purchase date. Two buttons: "Cancelar" and "Eliminar". On confirm: `DELETE FROM compras WHERE id = ?` (CASCADE removes gastos). On success: remove row from local state.

### Search

A text input in the page header filters the displayed rows client-side by matching against `marca`, `modelo`, or `vendedor_nombre` (case-insensitive).

---

## Sidebar link

In `AdminLayout.jsx`:
1. Add `ShoppingCartIcon` to the `@heroicons/react/24/outline` import.
2. Add to `navItems` after the `rendimiento` entry:

```js
{ to: '/admin/compras', label: 'Compras', icon: ShoppingCartIcon, roles: ['admin', 'seller'] },
```

---

## Data Flow

```
Compras mounts
  → fetch compras (all for admin, own for seller)
  → render table with costoTotal computed per row (extras = 0 until expanded)

Click "Registrar compra"
  → modal opens
  → fill form → submit
  → supabase.from('compras').insert({ ...form, created_by: profile.id })
  → prepend to local state, close modal

Click row expand button
  → if gastos not yet loaded: fetch gastos_compra WHERE compra_id = id
  → store in gastos[compra.id]
  → render inline expense list + add-gasto form

Click "Agregar" in inline form
  → INSERT gastos_compra
  → append to gastos[compra.id], recalculate costoTotal display

Click doc badge (Factura / Tenencia / Verificación)
  → UPDATE compras SET doc_xxx = !current WHERE id = ?
  → update local state

Click delete (admin only)
  → open confirm modal
  → DELETE compras WHERE id = ? (CASCADE removes gastos)
  → remove from local state
```

---

## Error Handling

- `react-hot-toast` is already bootstrapped at the app root — no `<Toaster />` needed in this component.
- Fetch fails on mount: show error message with "Reintentar" button.
- INSERT/UPDATE/DELETE fails: `toast.error(...)`, modal stays open or badge reverts.
- `precio_compra` must be > 0 and `fecha_compra` must be set; validate client-side before submitting.
- `monto` in add-gasto form must be > 0; validate before inserting.

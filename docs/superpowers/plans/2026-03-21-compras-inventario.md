# Compras → Inventario Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "→ Inventario" button to each Compras row that sends the purchased car to the `cars` inventory table with a pre-filled modal, replacing itself with an "En inventario" badge once linked.

**Architecture:** Two tasks — (1) manual DB migration to add a `car_id` FK column to `compras`, (2) modify `Compras.jsx` to add three new state vars, one handler function, a button/badge in the Acciones column, and a modal. No other files touched.

**Tech Stack:** React 19, Supabase JS v2, Tailwind CSS 3, Heroicons 24/outline, react-hot-toast.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/pages/admin/Compras.jsx` | **Modify** | Add inventario button/badge + modal + handler |

---

## Task 1: DB Migration (MANUAL)

**This step is manual — run in the Supabase SQL Editor.**

- [ ] **Step 1: Add `car_id` column to `compras`**

```sql
alter table compras
  add column car_id uuid references cars(id) on delete set null;
```

`ON DELETE SET NULL` means: if a car is deleted from inventory, the purchase loses its link (`car_id` becomes null) but is not deleted itself. This allows the "→ Inventario" button to reappear on next data load.

- [ ] **Step 2: Verify**

In the Supabase Table Editor, confirm the `compras` table now has a `car_id` column of type `uuid`, nullable, with a foreign key to `cars(id)`.

---

## Task 2: Modify `src/pages/admin/Compras.jsx`

**Files:**
- Modify: `src/pages/admin/Compras.jsx`

Context on the file (current state):
- Line 7: Heroicons import — `ChevronDownIcon, ChevronUpIcon, TrashIcon`
- Lines 38–50: State declarations
- Lines 287–308: Acciones column in the table row (expand button + admin delete button)
- Lines 523–570: Delete confirm modal
- Lines 571–573: Closing `</div> )  }` of the component return

**All 4 changes must be made to the same file in one edit session.**

- [ ] **Step 1: Add `ArrowRightIcon` to the Heroicons import**

Find:
```jsx
import {
  ChevronDownIcon, ChevronUpIcon, TrashIcon,
} from '@heroicons/react/24/outline'
```

Replace with:
```jsx
import {
  ChevronDownIcon, ChevronUpIcon, TrashIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline'
```

- [ ] **Step 2: Add three new state variables after line 50 (`const [deleting, setDeleting] = useState(false)`)**

Add immediately after `const [deleting, setDeleting] = useState(false)`:

```jsx
  const [inventarioModal, setInventarioModal]             = useState(null)   // compra object or null
  const [inventarioForm, setInventarioForm]               = useState({ precio: '', transmision: '', combustible: '', descripcion: '' })
  const [sendingToInventario, setSendingToInventario]     = useState(false)
```

- [ ] **Step 3: Add `handleSendToInventario` function**

Add this function after the existing `handleAddGasto` function (around line 153, before the `const filtered = ...` line):

```jsx
  async function handleSendToInventario() {
    const compra = inventarioModal
    if (!compra.marca?.trim() || !compra.modelo?.trim()) {
      toast.error('El auto no tiene marca/modelo registrado'); return
    }
    if (!inventarioForm.precio || Number(inventarioForm.precio) <= 0) {
      toast.error('Ingresa un precio de venta válido'); return
    }
    if (!inventarioForm.transmision) { toast.error('Selecciona la transmisión'); return }
    if (!inventarioForm.combustible) { toast.error('Selecciona el combustible'); return }

    setSendingToInventario(true)

    const carPayload = {
      marca:       compra.marca,
      modelo:      compra.modelo,
      año:         compra.año ? Number(compra.año) : null,
      color:       compra.color || null,
      kilometraje: compra.kilometraje ? Number(compra.kilometraje) : null,
      precio:      Number(inventarioForm.precio),
      transmision: inventarioForm.transmision,
      combustible: inventarioForm.combustible,
      descripcion: inventarioForm.descripcion || null,
      status:      'available',
      visible:     true,
      imagenes:    [],
    }

    const { data: newCar, error: carErr } = await supabase.from('cars').insert(carPayload).select().single()
    if (carErr) {
      setSendingToInventario(false)
      toast.error('Error al crear auto en inventario'); return
    }

    const { error: linkErr } = await supabase.from('compras').update({ car_id: newCar.id }).eq('id', compra.id)
    if (linkErr) {
      // Best-effort rollback — if this DELETE also fails, an orphaned car will remain in inventory
      await supabase.from('cars').delete().eq('id', newCar.id)
      setSendingToInventario(false)
      toast.error('Error al vincular con la compra'); return
    }

    setCompras(prev => prev.map(c => c.id === compra.id ? { ...c, car_id: newCar.id } : c))
    setSendingToInventario(false)
    toast.success('Auto agregado al inventario')
    setInventarioModal(null)
    setInventarioForm({ precio: '', transmision: '', combustible: '', descripcion: '' })
  }
```

- [ ] **Step 4: Add button/badge in the Acciones column**

Find the Acciones `<div>` (the flex container holding the expand and delete buttons):

```jsx
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => handleExpand(c.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title={isOpen ? 'Cerrar' : 'Ver gastos'}
                        >
                          {isOpen
                            ? <ChevronUpIcon className="w-4 h-4" />
                            : <ChevronDownIcon className="w-4 h-4" />}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setConfirmDelete(c)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
```

Replace with:

```jsx
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => handleExpand(c.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title={isOpen ? 'Cerrar' : 'Ver gastos'}
                        >
                          {isOpen
                            ? <ChevronUpIcon className="w-4 h-4" />
                            : <ChevronDownIcon className="w-4 h-4" />}
                        </button>
                        {c.car_id ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                            En inventario
                          </span>
                        ) : (
                          <button
                            onClick={() => { setInventarioModal(c); setInventarioForm({ precio: '', transmision: '', combustible: '', descripcion: '' }) }}
                            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Agregar a inventario"
                          >
                            <ArrowRightIcon className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setConfirmDelete(c)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
```

- [ ] **Step 5: Add the "Agregar a inventario" modal**

Find the closing tags of the delete modal and the component:

```jsx
      )}
    </div>
  )
}
```

Replace with:

```jsx
      )}

      {/* ── Modal: Agregar a inventario ──────────────────────── */}
      {inventarioModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => { setInventarioModal(null); setInventarioForm({ precio: '', transmision: '', combustible: '', descripcion: '' }) }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Agregar a inventario</h3>

            {/* Pre-filled read-only info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <p>
                <span className="text-gray-400">Auto: </span>
                <span className="font-medium text-gray-800">
                  {[inventarioModal.marca, inventarioModal.modelo, inventarioModal.año].filter(Boolean).join(' ') || '—'}
                </span>
              </p>
              {inventarioModal.color && (
                <p><span className="text-gray-400">Color: </span><span className="text-gray-700">{inventarioModal.color}</span></p>
              )}
              {inventarioModal.kilometraje != null && (
                <p><span className="text-gray-400">Km: </span><span className="text-gray-700">{Number(inventarioModal.kilometraje).toLocaleString('es-MX')}</span></p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Precio de venta *</label>
                <input
                  type="number"
                  min={0}
                  value={inventarioForm.precio}
                  onChange={e => setInventarioForm(f => ({ ...f, precio: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Transmisión *</label>
                <select
                  value={inventarioForm.transmision}
                  onChange={e => setInventarioForm(f => ({ ...f, transmision: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">— Seleccionar —</option>
                  <option value="Manual">Manual</option>
                  <option value="Automática">Automática</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Combustible *</label>
                <select
                  value={inventarioForm.combustible}
                  onChange={e => setInventarioForm(f => ({ ...f, combustible: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">— Seleccionar —</option>
                  <option value="Gasolina">Gasolina</option>
                  <option value="Diésel">Diésel</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Eléctrico">Eléctrico</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
                <textarea
                  rows={2}
                  value={inventarioForm.descripcion}
                  onChange={e => setInventarioForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => { setInventarioModal(null); setInventarioForm({ precio: '', transmision: '', combustible: '', descripcion: '' }) }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendToInventario}
                disabled={sendingToInventario}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {sendingToInventario ? 'Enviando…' : 'Agregar al inventario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Build to verify no errors**

```bash
npm run build 2>&1 | grep -E "(built in|error|Error)"
```

Expected: `✓ built in` with no errors. Common issues:
- `ArrowRightIcon is not exported` → check the import spelling (it's `ArrowRightIcon`, not `ArrowRight`)
- `Cannot find name 'inventarioModal'` → make sure all three state vars were added

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Compras.jsx
git commit -m "feat(compras): add send-to-inventario button and modal"
```

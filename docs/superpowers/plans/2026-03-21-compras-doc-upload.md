# Compras Document Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the boolean doc badge toggles in the Compras table with a modal that lets users upload (JPG/PNG/WebP/PDF ≤5MB), view, and delete files per document type (Factura, Tenencia, Verificación) using Supabase Storage.

**Architecture:** Two tasks — (1) manual setup in Supabase (new bucket + three DB columns), (2) modify `Compras.jsx` with a `DOC_FIELDS` constant, three new state vars, two async handlers, updated badge `onClick`, and a new modal. `toggleDoc` is removed and replaced by the upload/delete flow.

**Tech Stack:** React 19, Supabase JS v2 (Storage + DB), Tailwind CSS 3, react-hot-toast.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/pages/admin/Compras.jsx` | **Modify** | Replace toggleDoc with upload/delete modal |

---

## Task 1: Storage bucket + DB migration (MANUAL)

**Run in Supabase dashboard.**

- [ ] **Step 1: Create the `compra-docs` Storage bucket**

In Supabase → Storage → New bucket:
- Name: `compra-docs`
- Public bucket: **Yes**
- File size limit: `5242880` (5 MB)
- Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`

- [ ] **Step 2: Add three URL columns to `compras`**

In Supabase SQL Editor:

```sql
alter table compras
  add column doc_factura_url      text,
  add column doc_tenencia_url     text,
  add column doc_verificacion_url text;
```

- [ ] **Step 3: Verify**

In Supabase Table Editor, confirm `compras` now has `doc_factura_url`, `doc_tenencia_url`, `doc_verificacion_url` columns (all nullable text). Confirm the `compra-docs` bucket appears in Storage.

---

## Task 2: Modify `src/pages/admin/Compras.jsx`

**Files:**
- Modify: `src/pages/admin/Compras.jsx`

**Current file state (relevant sections):**
- Line 21: `const FORMA_PAGO_LABELS = { ... }`
- Lines 51–53: inventario state vars (last state block)
- Lines 88–93: `toggleDoc` function
- Lines 314–331: doc badges — currently call `toggleDoc(c, field)` on click
- Lines 729–732: closing `)} </div> ) }` of the component

**Make all 5 changes in one edit session.**

- [ ] **Step 1: Add `DOC_FIELDS` constant after `FORMA_PAGO_LABELS`**

Find:
```js
const FORMA_PAGO_LABELS = { efectivo: 'Efectivo', transferencia: 'Transferencia', cheque: 'Cheque' }
```

Replace with:
```js
const FORMA_PAGO_LABELS = { efectivo: 'Efectivo', transferencia: 'Transferencia', cheque: 'Cheque' }

const DOC_FIELDS = {
  doc_factura:      { label: 'Factura',      urlField: 'doc_factura_url',      pathSegment: 'factura'      },
  doc_tenencia:     { label: 'Tenencia',     urlField: 'doc_tenencia_url',     pathSegment: 'tenencia'     },
  doc_verificacion: { label: 'Verificación', urlField: 'doc_verificacion_url', pathSegment: 'verificacion' },
}
```

- [ ] **Step 2: Add 3 new state variables after the inventario state block**

Find:
```js
  const [sendingToInventario, setSendingToInventario]     = useState(false)
```

Replace with:
```js
  const [sendingToInventario, setSendingToInventario]     = useState(false)
  const [docModal, setDocModal]         = useState(null)   // { compra, field } or null
  const [docUploading, setDocUploading] = useState(false)
  const [docDeleting, setDocDeleting]   = useState(false)
```

- [ ] **Step 3: Replace `toggleDoc` with `handleDocUpload` and `handleDocDelete`**

Find:
```js
  async function toggleDoc(compra, field) {
    const newVal = !compra[field]
    const { error: err } = await supabase.from('compras').update({ [field]: newVal }).eq('id', compra.id)
    if (err) { toast.error('Error al actualizar documento'); return }
    setCompras(prev => prev.map(c => c.id === compra.id ? { ...c, [field]: newVal } : c))
  }
```

Replace with:
```js
  async function handleDocUpload(file) {
    if (!docModal) return
    const { compra, field } = docModal
    const { urlField, pathSegment } = DOC_FIELDS[field]

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Tipo de archivo no permitido (JPG, PNG, WebP o PDF)'); return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo supera el límite de 5 MB'); return
    }

    setDocUploading(true)
    const path = `${compra.id}/${pathSegment}/${Date.now()}-${file.name}`
    const { error: uploadErr } = await supabase.storage
      .from('compra-docs').upload(path, file, { upsert: false })
    if (uploadErr) {
      setDocUploading(false)
      toast.error('Error al subir el archivo'); return
    }

    const { data: { publicUrl } } = supabase.storage.from('compra-docs').getPublicUrl(path)

    const { error: updateErr } = await supabase.from('compras')
      .update({ [urlField]: publicUrl, [field]: true })
      .eq('id', compra.id)
    if (updateErr) {
      // Best-effort rollback — orphaned file if this also fails
      await supabase.storage.from('compra-docs').remove([path])
      setDocUploading(false)
      toast.error('Error al guardar el documento'); return
    }

    setCompras(prev => prev.map(c =>
      c.id === compra.id ? { ...c, [urlField]: publicUrl, [field]: true } : c
    ))
    setDocUploading(false)
    toast.success('Documento subido')
    setDocModal(null)
  }

  async function handleDocDelete() {
    if (!docModal) return
    const { compra, field } = docModal
    const { urlField } = DOC_FIELDS[field]
    const url = compra[urlField]

    const path = url.split('/compra-docs/')[1]
    if (!path) { toast.error('No se pudo determinar la ruta del archivo'); return }

    setDocDeleting(true)
    const { error: removeErr } = await supabase.storage.from('compra-docs').remove([path])
    if (removeErr) {
      setDocDeleting(false)
      toast.error('Error al eliminar el archivo'); return
    }

    const { error: updateErr } = await supabase.from('compras')
      .update({ [urlField]: null, [field]: false })
      .eq('id', compra.id)
    if (updateErr) {
      setDocDeleting(false)
      toast.error('Archivo eliminado pero no se pudo actualizar el registro'); return
    }

    setCompras(prev => prev.map(c =>
      c.id === compra.id ? { ...c, [urlField]: null, [field]: false } : c
    ))
    setDocDeleting(false)
    toast.success('Documento eliminado')
    setDocModal(null)
  }
```

- [ ] **Step 4: Update doc badge `onClick` to open the modal instead of toggling**

Find:
```jsx
                        {[
                          { field: 'doc_factura',      label: 'F' },
                          { field: 'doc_tenencia',     label: 'T' },
                          { field: 'doc_verificacion', label: 'V' },
                        ].map(({ field, label }) => (
                          <button
                            key={field}
                            onClick={() => toggleDoc(c, field)}
                            title={field.replace('doc_', '')}
                            className={`text-xs px-1.5 py-0.5 rounded transition ${
                              c[field]
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {label} {c[field] ? '✓' : '✗'}
                          </button>
                        ))}
```

Replace with:
```jsx
                        {[
                          { field: 'doc_factura',      label: 'F' },
                          { field: 'doc_tenencia',     label: 'T' },
                          { field: 'doc_verificacion', label: 'V' },
                        ].map(({ field, label }) => (
                          <button
                            key={field}
                            onClick={() => setDocModal({ compra: c, field })}
                            title={DOC_FIELDS[field].label}
                            className={`text-xs px-1.5 py-0.5 rounded transition ${
                              c[field]
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {label} {c[field] ? '✓' : '✗'}
                          </button>
                        ))}
```

- [ ] **Step 5: Add the document modal before the closing tags**

Find:
```jsx
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

Replace with:
```jsx
                {sendingToInventario ? 'Enviando…' : 'Agregar al inventario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Documento ─────────────────────────────────── */}
      {docModal && (() => {
        const { compra, field } = docModal
        const { label, urlField } = DOC_FIELDS[field]
        const existingUrl = compra[urlField]
        const filename = existingUrl ? existingUrl.split('/').pop() : null
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setDocModal(null)}
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                {existingUrl ? label : `Subir ${label}`}
              </h3>

              {existingUrl ? (
                /* Mode B — view / delete */
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 break-all">
                    <span className="font-medium text-gray-700">{filename}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(existingUrl, '_blank')}
                      className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Ver documento
                    </button>
                    <button
                      onClick={handleDocDelete}
                      disabled={docDeleting}
                      className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {docDeleting ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </div>
                  <button
                    onClick={() => setDocModal(null)}
                    className="w-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                /* Mode A — upload */
                <div className="space-y-4">
                  <p className="text-xs text-gray-400">JPG, PNG, WebP o PDF — máx 5 MB</p>
                  <label className={`block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-red-400 transition ${docUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={e => { if (e.target.files?.[0]) handleDocUpload(e.target.files[0]) }}
                      disabled={docUploading}
                    />
                    <span className="text-sm text-gray-500">
                      {docUploading ? 'Subiendo…' : 'Haz clic para seleccionar un archivo'}
                    </span>
                  </label>
                  <button
                    onClick={() => setDocModal(null)}
                    className="w-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition"
                    disabled={docUploading}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
```

> **Note on Step 5 Find anchor:** The Find string starts from the unique inventario modal button text to avoid ambiguous matches with earlier `)}` closings in the file.

- [ ] **Step 6: Build to verify no errors**

```bash
npm run build 2>&1 | grep -E "(built in|error|Error)"
```

Expected: `✓ built in` with no errors. Common issues:
- `toggleDoc is not defined` → verify Step 3 replaced it completely (no remaining call sites after Step 4)
- `DOC_FIELDS is not defined` → verify Step 1 added the constant at module level (outside the component)

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Compras.jsx
git commit -m "feat(compras): add document file upload/view/delete per doc badge"
```

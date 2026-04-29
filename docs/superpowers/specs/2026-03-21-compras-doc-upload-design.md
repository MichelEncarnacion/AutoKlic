# Compras Document Upload Design

**Date:** 2026-03-21
**Project:** AutoKlic admin panel
**Sub-project:** Subir archivos de documentos en compras

---

## Goal

Allow users to attach actual files (images or PDFs) to each of the three document fields of a car purchase (Factura, Tenencia, Verificación). Clicking a document badge opens a modal to upload or view/delete the file. Uploading a file automatically sets the boolean flag to `true`; deleting it resets it to `false`.

---

## Scope

1. **Storage** — create a new `compra-docs` Supabase Storage bucket.
2. **DB change** — add three nullable `text` URL columns to `compras`.
3. **Frontend change** — replace the direct boolean toggle on doc badges with a modal that handles upload / view / delete.

---

## Out of Scope

- PDF preview inline (files open in a new browser tab)
- Per-document access control beyond the existing `compras` RLS
- Bulk download of all documents for a purchase
- Document expiry or versioning

---

## Storage

### Bucket

Name: `compra-docs`
Type: Public (same pattern as `car-images`)

### File path convention

```
{compra_id}/{field}/{timestamp}-{originalFilename}
```

Examples:
- `abc123/factura/1711000000000-factura.pdf`
- `abc123/tenencia/1711000000001-tenencia.jpg`

`{field}` is one of: `factura`, `tenencia`, `verificacion`.

`{timestamp}` is `Date.now()` — ensures unique paths and enables implicit versioning (old file deleted before new upload).

### Accepted file types and size limit

- Types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Max size: 5 MB

### Bucket policies

Set the bucket to public so `getPublicUrl` returns a directly accessible URL. No additional Storage policies needed — the `compras` RLS controls who can update the URL columns.

---

## Database Changes

```sql
alter table compras
  add column doc_factura_url      text,
  add column doc_tenencia_url     text,
  add column doc_verificacion_url text;
```

All three columns are nullable. A `null` value means no file has been uploaded for that document. No RLS changes needed — the existing `compras_update` policy already covers all columns.

---

## Frontend Architecture

### Files modified

| File | Change |
|------|--------|
| `src/pages/admin/Compras.jsx` | Replace `toggleDoc` badge behavior with modal; add upload/view/delete modal; add upload handler |

### No other files modified

---

## Feature: Document badge behavior change

### Before (current)

Clicking a badge calls `toggleDoc(compra, field)` which flips the boolean in the DB and local state.

### After (new)

Clicking any badge calls `setDocModal({ compra, field })`. The badge no longer toggles the boolean directly. The boolean is only modified via file upload (set to `true`) or file delete (set to `false`).

### Badge visual rules (unchanged)

- `doc_xxx = true` (file uploaded or manually set) → green badge
- `doc_xxx = false` → gray badge

---

## Feature: Document modal

### State variables (new)

```js
const [docModal, setDocModal]         = useState(null)   // { compra, field } or null
const [docUploading, setDocUploading] = useState(false)
const [docDeleting, setDocDeleting]   = useState(false)
```

### Helper constants

```js
const DOC_FIELDS = {
  doc_factura:      { label: 'Factura',      urlField: 'doc_factura_url',      pathSegment: 'factura'      },
  doc_tenencia:     { label: 'Tenencia',     urlField: 'doc_tenencia_url',     pathSegment: 'tenencia'     },
  doc_verificacion: { label: 'Verificación', urlField: 'doc_verificacion_url', pathSegment: 'verificacion' },
}
```

### Modal modes

The modal renders in one of two modes based on whether `compra[urlField]` is null:

**Mode A — Upload (no file yet)**
- Title: "Subir {label}"
- Clickable drop-zone label wrapping a hidden `<input type="file">` with `accept="image/jpeg,image/png,image/webp,application/pdf"`; selecting a file immediately triggers `handleDocUpload` (no separate confirm button)
- Drop-zone is disabled (`opacity-50 pointer-events-none`) while uploading; label text switches to "Subiendo…"
- "Cancelar" button (disabled while uploading)

**Mode B — View / Delete (file exists)**
- Title: "{label}"
- Filename extracted from the URL (last path segment after final `/`)
- "Ver documento" button → `window.open(url, '_blank')`
- "Eliminar" button (red, disabled while deleting)
- "Cancelar" button

### Upload handler

```js
async function handleDocUpload(file) {
  if (!docModal) return
  const { compra, field } = docModal
  const { urlField, pathSegment } = DOC_FIELDS[field]

  // Validate type
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowed.includes(file.type)) {
    toast.error('Tipo de archivo no permitido (JPG, PNG, WebP o PDF)'); return
  }
  // Validate size (5 MB)
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
    // Rollback: delete the just-uploaded file (best-effort — if this also fails,
    // the orphaned file remains in storage silently; acceptable known gap)
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
```

### Delete handler

```js
async function handleDocDelete() {
  if (!docModal) return
  const { compra, field } = docModal
  const { urlField } = DOC_FIELDS[field]
  const url = compra[urlField]

  // Extract storage path from the public URL
  // Public URL format: https://{project}.supabase.co/storage/v1/object/public/compra-docs/{path}
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
    // File is deleted from storage but DB not updated — known gap, surface to user
    setDocDeleting(false)
    toast.error('Archivo eliminado pero no se pudo actualizar el registro')
    return
  }

  setCompras(prev => prev.map(c =>
    c.id === compra.id ? { ...c, [urlField]: null, [field]: false } : c
  ))
  setDocDeleting(false)
  toast.success('Documento eliminado')
  setDocModal(null)
}
```

---

## Data Flow

```
Click badge (F/T/V)
  → setDocModal({ compra, field })
  → modal opens

If doc_xxx_url is null (Mode A — upload):
  → user selects file → handleDocUpload(file)
  → validate type and size
  → upload to compra-docs/{compra_id}/{field}/{timestamp}-{filename}
  → get publicUrl
  → UPDATE compras SET doc_xxx_url = publicUrl, doc_xxx = true
  → if UPDATE fails: DELETE uploaded file (rollback), toast.error
  → update local state, toast.success, close modal

If doc_xxx_url exists (Mode B — view/delete):
  → "Ver documento" → window.open(url, '_blank')
  → "Eliminar" → handleDocDelete()
    → extract path from URL
    → DELETE from compra-docs bucket
    → if DELETE fails: toast.error, keep modal open
    → UPDATE compras SET doc_xxx_url = null, doc_xxx = false
    → if UPDATE fails: toast.error (file gone from storage, DB stale — known gap)
    → update local state, toast.success, close modal
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid file type | `toast.error` before upload, no DB call |
| File > 5MB | `toast.error` before upload, no DB call |
| Upload fails | `toast.error`, modal stays open |
| UPDATE fails after upload | Rollback DELETE file, `toast.error`, modal stays open |
| DELETE (storage) fails | `toast.error`, modal stays open |
| UPDATE fails after DELETE | `toast.error` ("known gap"), modal stays open |
| `docModal` is null when handler fires | Early `return` (guard clause) |

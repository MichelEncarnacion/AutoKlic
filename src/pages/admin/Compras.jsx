import { useState, useEffect, Fragment } from 'react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  ChevronDownIcon, ChevronUpIcon, TrashIcon,
} from '@heroicons/react/24/outline'

function formatPrice(p) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(p ?? 0)
}

function costoTotal(compra, gastos) {
  const extras = (gastos[compra.id] ?? []).reduce((sum, g) => sum + Number(g.monto), 0)
  return Number(compra.precio_compra) + extras
}

const FORMA_PAGO_LABELS = { efectivo: 'Efectivo', transferencia: 'Transferencia', cheque: 'Cheque' }

function emptyForm() {
  return {
    marca: '', modelo: '', año: '', color: '', kilometraje: '', vin: '',
    precio_compra: '', fecha_compra: '',
    vendedor_nombre: '', vendedor_telefono: '',
    forma_pago: '',
    doc_factura: false, doc_tenencia: false, doc_verificacion: false,
    notas: '',
  }
}

export default function Compras() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [compras, setCompras]             = useState([])
  const [gastos, setGastos]               = useState({})         // { compra_id: gasto[] }
  const [loadingGastos, setLoadingGastos] = useState({})         // { compra_id: bool }
  const [gastoForm, setGastoForm]         = useState({})         // { compra_id: { concepto, monto, fecha } }
  const [expanded, setExpanded]           = useState(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [search, setSearch]               = useState('')
  const [modalOpen, setModalOpen]         = useState(false)
  const [form, setForm]                   = useState(emptyForm())
  const [saving, setSaving]               = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting]           = useState(false)

  async function fetchCompras() {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from('compras').select('*').order('fecha_compra', { ascending: false })
      if (!isAdmin) query = query.eq('created_by', profile.id)
      const { data, error: err } = await query
      if (err) throw err
      setCompras(data ?? [])
    } catch (e) {
      setError(e.message ?? 'Error al cargar compras')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) fetchCompras()
  }, [profile])

  async function handleExpand(id) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (gastos[id] !== undefined) return
    setLoadingGastos(prev => ({ ...prev, [id]: true }))
    const { data, error: err } = await supabase
      .from('gastos_compra').select('*').eq('compra_id', id).order('created_at', { ascending: true })
    setLoadingGastos(prev => ({ ...prev, [id]: false }))
    if (err) { toast.error('Error al cargar gastos'); return }
    setGastos(prev => ({ ...prev, [id]: data ?? [] }))
    setGastoForm(prev => ({ ...prev, [id]: { concepto: '', monto: '', fecha: '' } }))
  }

  async function toggleDoc(compra, field) {
    const newVal = !compra[field]
    const { error: err } = await supabase.from('compras').update({ [field]: newVal }).eq('id', compra.id)
    if (err) { toast.error('Error al actualizar documento'); return }
    setCompras(prev => prev.map(c => c.id === compra.id ? { ...c, [field]: newVal } : c))
  }

  async function handleSave() {
    if (!form.precio_compra || Number(form.precio_compra) <= 0) {
      toast.error('Ingresa un precio de compra válido'); return
    }
    if (!form.fecha_compra) { toast.error('Ingresa la fecha de compra'); return }
    setSaving(true)
    const payload = {
      marca:             form.marca || null,
      modelo:            form.modelo || null,
      año:               form.año ? parseInt(form.año) : null,
      color:             form.color || null,
      kilometraje:       form.kilometraje ? Number(form.kilometraje) : null,
      vin:               form.vin || null,
      precio_compra:     Number(form.precio_compra),
      fecha_compra:      form.fecha_compra,
      vendedor_nombre:   form.vendedor_nombre || null,
      vendedor_telefono: form.vendedor_telefono || null,
      forma_pago:        form.forma_pago || null,
      doc_factura:       form.doc_factura,
      doc_tenencia:      form.doc_tenencia,
      doc_verificacion:  form.doc_verificacion,
      notas:             form.notas || null,
      created_by:        profile.id,
    }
    const { data, error: err } = await supabase.from('compras').insert(payload).select().single()
    setSaving(false)
    if (err) { toast.error('Error al registrar compra'); return }
    toast.success('Compra registrada')
    setCompras(prev => [data, ...prev])
    setModalOpen(false)
    setForm(emptyForm())
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    const { error: err } = await supabase.from('compras').delete().eq('id', confirmDelete.id)
    setDeleting(false)
    if (err) { toast.error('Error al eliminar'); return }
    toast.success('Compra eliminada')
    setCompras(prev => prev.filter(c => c.id !== confirmDelete.id))
    if (expanded === confirmDelete.id) setExpanded(null)
    setConfirmDelete(null)
  }

  async function handleAddGasto(compraId) {
    const gf = gastoForm[compraId] ?? {}
    if (!gf.concepto?.trim()) { toast.error('Ingresa un concepto'); return }
    if (!gf.monto || Number(gf.monto) <= 0) { toast.error('Ingresa un monto válido'); return }
    const payload = {
      compra_id: compraId,
      concepto:  gf.concepto.trim(),
      monto:     Number(gf.monto),
      fecha:     gf.fecha || null,
    }
    const { data, error: err } = await supabase.from('gastos_compra').insert(payload).select().single()
    if (err) { toast.error('Error al agregar gasto'); return }
    setGastos(prev => ({ ...prev, [compraId]: [...(prev[compraId] ?? []), data] }))
    setGastoForm(prev => ({ ...prev, [compraId]: { concepto: '', monto: '', fecha: '' } }))
    toast.success('Gasto agregado')
  }

  const filtered = compras.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.marca ?? '').toLowerCase().includes(q) ||
      (c.modelo ?? '').toLowerCase().includes(q) ||
      (c.vendedor_nombre ?? '').toLowerCase().includes(q)
    )
  })

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      {[1, 2].map(i => <div key={i} className="h-12 bg-gray-200 rounded" />)}
    </div>
  )

  // ── Error ────────────────────────────────────────────────────
  if (error) return (
    <div className="p-6 text-center">
      <p className="text-sm text-red-600 mb-3">{error}</p>
      <button onClick={fetchCompras} className="text-sm text-red-600 underline hover:no-underline">
        Reintentar
      </button>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Compras</h1>
          <p className="text-sm text-gray-400 mt-0.5">Registro de autos adquiridos</p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 font-medium">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Auto</th>
              <th className="px-4 py-3 text-right">Km</th>
              <th className="px-4 py-3 text-right">Precio compra</th>
              <th className="px-4 py-3 text-right">Gastos extras</th>
              <th className="px-4 py-3 text-right">Costo total</th>
              <th className="px-4 py-3">Forma de pago</th>
              <th className="px-4 py-3">Documentos</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const extrasSum = (gastos[c.id] ?? []).reduce((sum, g) => sum + Number(g.monto), 0)
              const total     = costoTotal(c, gastos)
              const isOpen    = expanded === c.id
              const gastosLoaded = gastos[c.id] !== undefined

              return (
                <Fragment key={c.id}>
                  <tr
                    className={`border-b border-gray-50 hover:bg-gray-50 transition ${isOpen ? 'bg-gray-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {c.fecha_compra ? format(parseISO(c.fecha_compra), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {[c.marca, c.modelo, c.año].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {c.kilometraje != null ? Number(c.kilometraje).toLocaleString('es-MX') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatPrice(c.precio_compra)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {gastosLoaded ? formatPrice(extrasSum) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {gastosLoaded ? formatPrice(total) : formatPrice(c.precio_compra)}
                    </td>
                    <td className="px-4 py-3">
                      {c.forma_pago ? (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {FORMA_PAGO_LABELS[c.forma_pago] ?? c.forma_pago}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
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
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.vendedor_nombre ?? '—'}
                      {c.vendedor_telefono && (
                        <div className="text-xs text-gray-400">{c.vendedor_telefono}</div>
                      )}
                    </td>
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
                  </tr>

                  {/* Expandable row */}
                  {isOpen && (
                    <tr key={`${c.id}-expand`} className="bg-gray-50 border-b border-gray-100">
                      <td colSpan={10} className="px-6 py-4">
                        {loadingGastos[c.id] ? (
                          <div className="animate-pulse space-y-2">
                            <div className="h-5 bg-gray-200 rounded w-48" />
                            <div className="h-5 bg-gray-200 rounded w-32" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Gastos adicionales
                            </p>
                            {(gastos[c.id] ?? []).length === 0 ? (
                              <p className="text-sm text-gray-400">Sin gastos registrados</p>
                            ) : (
                              <table className="text-sm w-full max-w-lg">
                                <thead>
                                  <tr className="text-xs text-gray-400">
                                    <th className="text-left pb-1 font-medium">Concepto</th>
                                    <th className="text-right pb-1 font-medium">Monto</th>
                                    <th className="text-right pb-1 font-medium">Fecha</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(gastos[c.id] ?? []).map(g => (
                                    <tr key={g.id} className="border-t border-gray-100">
                                      <td className="py-1 text-gray-700">{g.concepto}</td>
                                      <td className="py-1 text-right text-gray-600">{formatPrice(g.monto)}</td>
                                      <td className="py-1 text-right text-gray-400">
                                        {g.fecha ? format(parseISO(g.fecha), 'dd/MM/yyyy') : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}

                            {/* Inline add-gasto form */}
                            <div className="flex flex-wrap items-end gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="Concepto"
                                value={gastoForm[c.id]?.concepto ?? ''}
                                onChange={e => setGastoForm(prev => ({
                                  ...prev, [c.id]: { ...prev[c.id], concepto: e.target.value },
                                }))}
                                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                              <input
                                type="number"
                                placeholder="Monto"
                                min={0}
                                value={gastoForm[c.id]?.monto ?? ''}
                                onChange={e => setGastoForm(prev => ({
                                  ...prev, [c.id]: { ...prev[c.id], monto: e.target.value },
                                }))}
                                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                              <input
                                type="date"
                                value={gastoForm[c.id]?.fecha ?? ''}
                                onChange={e => setGastoForm(prev => ({
                                  ...prev, [c.id]: { ...prev[c.id], fecha: e.target.value },
                                }))}
                                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                              <button
                                onClick={() => handleAddGasto(c.id)}
                                className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                              >
                                Agregar
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">
                  {search ? 'Sin resultados para tu búsqueda' : 'No hay compras registradas'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Registrar compra ──────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Registrar compra</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'marca',       label: 'Marca',       type: 'text'   },
                { key: 'modelo',      label: 'Modelo',      type: 'text'   },
                { key: 'año',         label: 'Año',         type: 'number' },
                { key: 'color',       label: 'Color',       type: 'text'   },
                { key: 'kilometraje', label: 'Kilometraje', type: 'number' },
                { key: 'vin',         label: 'VIN',         type: 'text'   },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Precio de compra *</label>
                <input
                  type="number"
                  min={0}
                  value={form.precio_compra}
                  onChange={e => setForm(f => ({ ...f, precio_compra: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha de compra *</label>
                <input
                  type="date"
                  value={form.fecha_compra}
                  onChange={e => setForm(f => ({ ...f, fecha_compra: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre del vendedor</label>
                <input
                  type="text"
                  value={form.vendedor_nombre}
                  onChange={e => setForm(f => ({ ...f, vendedor_nombre: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teléfono del vendedor</label>
                <input
                  type="text"
                  value={form.vendedor_telefono}
                  onChange={e => setForm(f => ({ ...f, vendedor_telefono: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Forma de pago</label>
                <select
                  value={form.forma_pago}
                  onChange={e => setForm(f => ({ ...f, forma_pago: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">— Seleccionar —</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div className="col-span-2 flex items-center gap-4">
                {[
                  { key: 'doc_factura',      label: 'Factura'      },
                  { key: 'doc_tenencia',     label: 'Tenencia'     },
                  { key: 'doc_verificacion', label: 'Verificación' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Notas</label>
                <textarea
                  rows={2}
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm delete ────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-full">
                <TrashIcon className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Eliminar compra</h3>
            </div>
            <p className="text-sm text-gray-500 mb-1">
              ¿Eliminar la compra de{' '}
              <span className="font-medium text-gray-800">
                {[confirmDelete.marca, confirmDelete.modelo, confirmDelete.año]
                  .filter(Boolean).join(' ') || 'este auto'}
              </span>?
            </p>
            {confirmDelete.fecha_compra && (
              <p className="text-sm text-gray-500 mb-1">
                Fecha de compra:{' '}
                <span className="font-medium text-gray-800">
                  {format(parseISO(confirmDelete.fecha_compra), 'dd/MM/yyyy')}
                </span>
              </p>
            )}
            <p className="text-xs text-gray-400 mb-4">
              Esta acción también eliminará todos los gastos asociados.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

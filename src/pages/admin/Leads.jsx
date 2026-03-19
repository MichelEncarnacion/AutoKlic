import React, { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { TrashIcon, MagnifyingGlassIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'

const STATUS_OPTIONS = [
  { value: 'pending',    label: 'Nuevo' },
  { value: 'reviewing',  label: 'En revisión' },
  { value: 'offer_made', label: 'Oferta enviada' },
  { value: 'closed',     label: 'Cerrado' },
]
const STATUS_COLORS = {
  pending:    'bg-blue-100 text-blue-700',
  reviewing:  'bg-yellow-100 text-yellow-700',
  offer_made: 'bg-purple-100 text-purple-700',
  closed:     'bg-gray-100 text-gray-500',
}

export default function Leads() {
  const { profile } = useAuth()
  const [leads, setLeads]     = useState([])
  const [staff, setStaff]     = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  const canEdit   = profile?.role === 'admin' || profile?.role === 'seller'
  const canDelete = profile?.role === 'admin'
  const canAssign = profile?.role === 'admin'

  useEffect(() => {
    Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, nombre, email, role').in('role', ['admin', 'seller']).order('nombre'),
    ]).then(([{ data: l }, { data: s }]) => {
      setLeads(l ?? [])
      setStaff(s ?? [])
      setLoading(false)
    })
  }, [])

  async function updateStatus(id, status) {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id)
    if (error) toast.error('Error al actualizar')
    else {
      toast.success('Estado actualizado')
      setLeads(l => l.map(x => x.id === id ? { ...x, status } : x))
    }
  }

  async function updateAssignment(id, assigned_to) {
    const value = assigned_to === '' ? null : assigned_to
    const { error } = await supabase.from('leads').update({ assigned_to: value }).eq('id', id)
    if (error) toast.error('Error al asignar')
    else {
      toast.success(value ? 'Lead asignado' : 'Asignación removida')
      setLeads(l => l.map(x => x.id === id ? { ...x, assigned_to: value } : x))
    }
  }

  async function updateNotas(id, notas) {
    const { error } = await supabase.from('leads').update({ notas }).eq('id', id)
    if (error) toast.error('Error al guardar nota')
    else toast.success('Nota guardada')
  }

  async function deleteLead(id) {
    if (!confirm('¿Eliminar este lead?')) return
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) toast.error('Error al eliminar')
    else { toast.success('Lead eliminado'); setLeads(l => l.filter(x => x.id !== id)) }
  }

  const staffById = useMemo(() => Object.fromEntries(staff.map(s => [s.id, s])), [staff])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter(l => {
      const matchSearch = !q || (
        l.id.substring(0, 8).toLowerCase().includes(q) ||
        (l.nombre ?? '').toLowerCase().includes(q) ||
        (l.email ?? '').toLowerCase().includes(q) ||
        (l.telefono ?? '').toLowerCase().includes(q) ||
        (l.marca ?? '').toLowerCase().includes(q) ||
        (l.modelo ?? '').toLowerCase().includes(q)
      )
      const matchStatus   = !statusFilter   || l.status === statusFilter
      const matchAssignee = !assigneeFilter || (
        assigneeFilter === 'unassigned' ? !l.assigned_to : l.assigned_to === assigneeFilter
      )
      return matchSearch && matchStatus && matchAssignee
    })
  }, [leads, search, statusFilter, assigneeFilter])

  const clearFilters = () => { setSearch(''); setStatusFilter(''); setAssigneeFilter('') }
  const hasFilters = search || statusFilter || assigneeFilter

  const colSpan = canDelete ? 8 : 7

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length} de {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por folio, nombre, email, auto..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={assigneeFilter}
          onChange={e => setAssigneeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
        >
          <option value="">Todos los asignados</option>
          <option value="unassigned">Sin asignar</option>
          {staff.map(s => (
            <option key={s.id} value={s.id}>{s.nombre ?? s.email}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <XMarkIcon className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Folio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Auto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contacto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Asignado a</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                {canDelete && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(lead => (
                <React.Fragment key={lead.id}>
                  <tr
                    onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                    className="hover:bg-gray-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{lead.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.marca} {lead.modelo} {lead.año}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{lead.email}<br />{lead.telefono}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {canEdit ? (
                        <select
                          value={lead.status}
                          onChange={e => updateStatus(lead.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${STATUS_COLORS[lead.status]}`}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[lead.status]}`}>
                          {STATUS_OPTIONS.find(s => s.value === lead.status)?.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {canAssign ? (
                        <select
                          value={lead.assigned_to ?? ''}
                          onChange={e => updateAssignment(lead.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white max-w-[140px]"
                        >
                          <option value="">Sin asignar</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre ?? s.email}</option>
                          ))}
                        </select>
                      ) : lead.assigned_to ? (
                        <div className="flex items-center gap-1.5">
                          <UserCircleIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-600 truncate max-w-[120px]">
                            {staffById[lead.assigned_to]?.nombre ?? '—'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: es })}
                    </td>
                    {canDelete && (
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => deleteLead(lead.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                  {expanded === lead.id && (
                    <tr className="bg-blue-50">
                      <td colSpan={colSpan} className="px-6 py-4 space-y-3">
                        {lead.descripcion && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Descripción del cliente</p>
                            <p className="text-sm text-gray-700">{lead.descripcion}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Notas internas</p>
                          {canEdit ? (
                            <textarea
                              rows={2}
                              defaultValue={lead.notas ?? ''}
                              onBlur={e => updateNotas(lead.id, e.target.value)}
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Agrega notas internas..."
                            />
                          ) : (
                            <p className="text-sm text-gray-600">{lead.notas || '—'}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="text-center py-12 text-gray-400">
                    {hasFilters ? 'No hay leads que coincidan con los filtros' : 'No hay leads todavía'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

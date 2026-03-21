// src/components/admin/LeadHistoryModal.jsx
import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  ArrowRightIcon,
  UserIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'

const EVENT_ICONS = {
  status_change:     ArrowRightIcon,
  assignment_change: UserIcon,
  note_added:        DocumentTextIcon,
}

const EVENT_LABELS = {
  status_change:     'Estado',
  assignment_change: 'Asignación',
  note_added:        'Nota',
}

export default function LeadHistoryModal({ leadId, leadNombre, onClose }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  async function fetchEvents() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('lead_events')
      .select('*, profiles!lead_events_user_id_fkey(nombre)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setEvents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [leadId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Historial</p>
              <p className="text-xs text-gray-400">{leadNombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {loading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button onClick={fetchEvents} className="text-sm text-blue-600 hover:underline">
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Sin actividad registrada para este lead.
            </p>
          )}

          {!loading && !error && events.length > 0 && (
            <ol className="relative border-l border-gray-200 ml-2 space-y-5">
              {events.map(ev => {
                const Icon  = EVENT_ICONS[ev.event_type] ?? DocumentTextIcon
                const actor = ev.profiles?.nombre ?? 'Usuario eliminado'
                const time  = formatDistanceToNow(parseISO(ev.created_at), { locale: es, addSuffix: true })
                return (
                  <li key={ev.id} className="ml-5">
                    <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-white border border-gray-200 rounded-full">
                      <Icon className="w-3 h-3 text-gray-500" />
                    </span>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-gray-700">{actor}</span>
                        <span className="text-xs text-gray-400">{time}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-600">
                          {EVENT_LABELS[ev.event_type]}:{' '}
                        </span>
                        {ev.event_type === 'note_added'
                          ? ev.new_value
                          : ev.old_value
                            ? `${ev.old_value} → ${ev.new_value}`
                            : ev.new_value}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}

        </div>
      </div>
    </div>
  )
}

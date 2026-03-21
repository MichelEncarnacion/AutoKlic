import { useState, useEffect } from 'react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  addPDFHeader, addPDFFooters, buildPeriodString, TABLE_STYLES,
} from '../../lib/pdfUtils'

function formatPrice(p) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(p ?? 0)
}

function computeKPIs(leads, sellerId) {
  const assigned  = leads.filter(l => l.assigned_to === sellerId)
  const closed    = assigned.filter(l => l.status === 'closed')
  const withPrice = closed.filter(l => l.precio_cierre != null)
  const ingreso   = withPrice.reduce((sum, l) => sum + Number(l.precio_cierre), 0)
  const diasList  = closed
    .filter(l => l.last_activity_at)
    .map(l => differenceInDays(parseISO(l.last_activity_at), parseISO(l.created_at)))
  const diasPromedio = diasList.length > 0
    ? Math.round(diasList.reduce((a, b) => a + b, 0) / diasList.length)
    : null
  return {
    asignados:   assigned.length,
    cerrados:    closed.length,
    tasa:        assigned.length > 0 ? Math.round((closed.length / assigned.length) * 100) : 0,
    ingreso,
    diasPromedio,
  }
}

export default function Rendimiento() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [leads, setLeads]       = useState([])
  const [staff, setStaff]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('leads')
        .select('id, assigned_to, status, precio_cierre, created_at, last_activity_at')
        .order('created_at', { ascending: false })

      if (!isAdmin) query = query.eq('assigned_to', profile.id)
      if (dateFrom)  query = query.gte('created_at', dateFrom)
      if (dateTo)    query = query.lte('created_at', dateTo + 'T23:59:59')

      const promises = [query]
      if (isAdmin) {
        promises.push(
          supabase.from('profiles').select('id, nombre, email').in('role', ['admin', 'seller']).order('nombre')
        )
      }

      const results = await Promise.all(promises)
      const { data: leadsData, error: leadsErr } = results[0]
      if (leadsErr) throw leadsErr

      setLeads(leadsData ?? [])

      if (isAdmin) {
        const { data: staffData, error: staffErr } = results[1]
        if (staffErr) throw staffErr
        setStaff(staffData ?? [])
      }
    } catch (e) {
      setError(e.message ?? 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) fetchData()
  }, [profile, dateFrom, dateTo])

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' })
    const period = buildPeriodString(dateFrom, dateTo)
    const startY = addPDFHeader(doc, 'Rendimiento por Vendedor', period)

    autoTable(doc, {
      startY,
      head: [['Vendedor', 'Asignados', 'Cerrados', 'Tasa', 'Ingreso', 'Días prom.']],
      body: staff.map(s => {
        const k = computeKPIs(leads, s.id)
        return [
          s.nombre ?? s.email,
          k.asignados,
          k.cerrados,
          `${k.tasa}%`,
          formatPrice(k.ingreso),
          k.diasPromedio != null ? `${k.diasPromedio} días` : '—',
        ]
      }),
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 29 },
        4: { cellWidth: 60 },
        5: { cellWidth: 60 },
      },
      ...TABLE_STYLES,
    })

    addPDFFooters(doc, 'Rendimiento por Vendedor')
    doc.save(`rendimiento-${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  )

  // ── Error ────────────────────────────────────────────────────
  if (error) return (
    <div className="p-6 text-center">
      <p className="text-sm text-red-600 mb-3">{error}</p>
      <button
        onClick={fetchData}
        className="text-sm text-red-600 underline hover:no-underline"
      >
        Reintentar
      </button>
    </div>
  )

  const myKPIs = !isAdmin ? computeKPIs(leads, profile.id) : null

  const KPI_CARDS = !isAdmin ? [
    { label: 'Leads asignados',   value: myKPIs.asignados },
    { label: 'Leads cerrados',    value: myKPIs.cerrados },
    { label: 'Tasa de cierre',    value: `${myKPIs.tasa}%` },
    { label: 'Ingreso total',     value: formatPrice(myKPIs.ingreso) },
    { label: 'Días prom. cierre', value: myKPIs.diasPromedio != null ? `${myKPIs.diasPromedio} días` : '—' },
  ] : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rendimiento</h1>
          <p className="text-sm text-gray-400 mt-0.5">KPIs por vendedor</p>
        </div>

        {/* Date filters + PDF button */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-500">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <label className="text-sm text-gray-500">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {isAdmin && (
            <button
              onClick={exportPDF}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Exportar PDF
            </button>
          )}
        </div>
      </div>

      {/* Admin: table */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 font-medium">
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3 text-right">Asignados</th>
                <th className="px-4 py-3 text-right">Cerrados</th>
                <th className="px-4 py-3 text-right">Tasa</th>
                <th className="px-4 py-3 text-right">Ingreso</th>
                <th className="px-4 py-3 text-right">Días prom.</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => {
                const k = computeKPIs(leads, s.id)
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.nombre ?? s.email}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{k.asignados}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{k.cerrados}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${k.tasa >= 50 ? 'text-green-600' : k.tasa > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {k.tasa}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatPrice(k.ingreso)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {k.diasPromedio != null ? `${k.diasPromedio} días` : '—'}
                    </td>
                  </tr>
                )
              })}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    No hay vendedores registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Seller: KPI cards */}
      {!isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {KPI_CARDS.map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

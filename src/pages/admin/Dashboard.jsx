import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, startOfWeek, isAfter } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import {
  ArchiveBoxIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

const STATUS_LABELS = {
  pending:    'Nuevo',
  reviewing:  'En revisión',
  offer_made: 'Oferta enviada',
  closed:     'Cerrado',
}
const STATUS_COLORS = {
  pending:    'bg-blue-500',
  reviewing:  'bg-yellow-500',
  offer_made: 'bg-purple-500',
  closed:     'bg-gray-400',
}
const STATUS_TEXT = {
  pending:    'text-blue-700',
  reviewing:  'text-yellow-700',
  offer_made: 'text-purple-700',
  closed:     'text-gray-500',
}
const STATUS_BG = {
  pending:    'bg-blue-100',
  reviewing:  'bg-yellow-100',
  offer_made: 'bg-purple-100',
  closed:     'bg-gray-100',
}

function formatPrice(p) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(p)
}

export default function Dashboard() {
  const [cars, setCars]   = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('cars').select('id, marca, modelo, año, precio, status, visible, created_at'),
      supabase.from('leads').select('id, nombre, marca, modelo, año, status, created_at').order('created_at', { ascending: false }),
    ]).then(([{ data: c }, { data: l }]) => {
      setCars(c ?? [])
      setLeads(l ?? [])
      setLoading(false)
    })
  }, [])

  // ── Computed stats ──────────────────────────────────────────
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

  const totalCars      = cars.length
  const availableCars  = cars.filter(c => c.status === 'available').length
  const soldCars       = cars.filter(c => c.status === 'sold').length
  const reservedCars   = cars.filter(c => c.status === 'reserved').length

  const totalLeads     = leads.length
  const activeLeads    = leads.filter(l => ['pending', 'reviewing'].includes(l.status)).length
  const closedLeads    = leads.filter(l => l.status === 'closed').length
  const leadsThisWeek  = leads.filter(l => isAfter(new Date(l.created_at), weekStart)).length
  const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0

  const leadsByStatus = ['pending', 'reviewing', 'offer_made', 'closed'].map(s => ({
    status: s,
    count: leads.filter(l => l.status === s).length,
  }))

  const recentLeads = leads.slice(0, 5)

  // ── KPI cards ───────────────────────────────────────────────
  const kpis = [
    {
      label: 'Autos en inventario',
      value: loading ? '—' : totalCars,
      sub: loading ? '' : `${availableCars} disponibles · ${soldCars} vendidos`,
      icon: ArchiveBoxIcon,
      color: 'bg-blue-50 text-blue-600',
      href: '/admin/inventario',
    },
    {
      label: 'Leads activos',
      value: loading ? '—' : activeLeads,
      sub: loading ? '' : `de ${totalLeads} total`,
      icon: UserGroupIcon,
      color: 'bg-yellow-50 text-yellow-600',
      href: '/admin/leads',
    },
    {
      label: 'Leads esta semana',
      value: loading ? '—' : leadsThisWeek,
      sub: 'desde el lunes',
      icon: ArrowTrendingUpIcon,
      color: 'bg-green-50 text-green-600',
      href: '/admin/leads',
    },
    {
      label: 'Tasa de cierre',
      value: loading ? '—' : `${conversionRate}%`,
      sub: loading ? '' : `${closedLeads} cerrado${closedLeads !== 1 ? 's' : ''} de ${totalLeads}`,
      icon: CheckCircleIcon,
      color: 'bg-purple-50 text-purple-600',
      href: '/admin/leads',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <Link
              key={kpi.label}
              to={kpi.href}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{kpi.label}</p>
              {kpi.sub && <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>}
            </Link>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Leads por estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Pipeline de leads</h2>
            <Link to="/admin/leads" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {leadsByStatus.map(({ status, count }) => {
                const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BG[status]} ${STATUS_TEXT[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                      <span className="text-xs text-gray-500">{count} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[status]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {totalLeads === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Sin leads todavía</p>
              )}
            </div>
          )}
        </div>

        {/* Inventario por estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Estado del inventario</h2>
            <Link to="/admin/inventario" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Disponible', count: availableCars,  color: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
                { label: 'Reservado',  count: reservedCars,   color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
                { label: 'Vendido',    count: soldCars,        color: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-500' },
              ].map(({ label, count, color, badge }) => {
                const pct = totalCars > 0 ? Math.round((count / totalCars) * 100) : 0
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
                      <span className="text-xs text-gray-500">{count} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              {totalCars === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Sin autos en inventario</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-sm">Últimos leads</h2>
          <Link to="/admin/leads" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : recentLeads.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin leads todavía</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentLeads.map(lead => (
              <div key={lead.id} className="flex items-center justify-between py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{lead.nombre}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {[lead.marca, lead.modelo, lead.año].filter(Boolean).join(' ') || 'Contacto general'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BG[lead.status]} ${STATUS_TEXT[lead.status]}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(lead.created_at), 'dd MMM', { locale: es })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

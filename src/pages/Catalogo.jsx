// src/pages/Catalogo.jsx
import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AdjustmentsHorizontalIcon, XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'

function toSlug(str) {
  return str.toLowerCase().replace(/\s+/g, '-')
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(price)
}

const STATUS_LABELS = { available: 'Disponible', reserved: 'Reservado', sold: 'Vendido' }
const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  reserved: 'bg-yellow-100 text-yellow-700',
  sold:      'bg-gray-100 text-gray-500',
}

const EMPTY_FILTERS = { marca: '', transmision: '', minPrecio: '', maxPrecio: '', minAño: '', maxAño: '' }

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc',label: 'Precio: mayor a menor' },
  { value: 'km_asc',    label: 'Menor kilometraje' },
  { value: 'year_desc', label: 'Año: más nuevo' },
]

export default function Catalogo() {
  const [cars, setCars]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy]   = useState('newest')

  useEffect(() => {
    supabase
      .from('cars')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCars(data ?? [])
        setLoading(false)
      })
  }, [])

  // Only unique non-null values for dropdowns
  const marcas = useMemo(
    () => [...new Set(cars.map(c => c.marca).filter(Boolean))].sort(),
    [cars]
  )
  const transmisiones = useMemo(
    () => [...new Set(cars.map(c => c.transmision).filter(Boolean))].sort(),
    [cars]
  )

  const filtered = useMemo(() => {
    const result = cars.filter(c => {
      if (filters.marca       && c.marca       !== filters.marca)       return false
      if (filters.transmision && c.transmision !== filters.transmision) return false
      if (filters.minPrecio   && Number(c.precio) < Number(filters.minPrecio)) return false
      if (filters.maxPrecio   && Number(c.precio) > Number(filters.maxPrecio)) return false
      if (filters.minAño      && Number(c.año)    < Number(filters.minAño))    return false
      if (filters.maxAño      && Number(c.año)    > Number(filters.maxAño))    return false
      return true
    })

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':  return Number(a.precio) - Number(b.precio)
        case 'price_desc': return Number(b.precio) - Number(a.precio)
        case 'km_asc':     return (Number(a.kilometraje) || 0) - (Number(b.kilometraje) || 0)
        case 'year_desc':  return Number(b.año) - Number(a.año)
        default:           return new Date(b.created_at) - new Date(a.created_at)
      }
    })
  }, [cars, filters, sortBy])

  const hasActiveFilters = Object.values(filters).some(Boolean)

  function setFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all'

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="h-10 w-48 bg-gray-100 rounded-lg animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
        ))}
      </div>
    </div>
  )

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">
            Catálogo de Autos
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {filtered.length} vehículo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className="flex lg:hidden items-center gap-2 border border-gray-200 hover:border-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Filters sidebar */}
        <aside className={`lg:w-64 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-lg font-bold text-gray-900">Filtros</h2>
              {hasActiveFilters && (
                <button
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Limpiar
                </button>
              )}
            </div>

            <div className="space-y-5">
              {/* Marca */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Marca
                </label>
                <select
                  value={filters.marca}
                  onChange={e => setFilter('marca', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Todas las marcas</option>
                  {marcas.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Transmisión */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Transmisión
                </label>
                <select
                  value={filters.transmision}
                  onChange={e => setFilter('transmision', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Todas</option>
                  {transmisiones.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Precio (MXN)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={filters.minPrecio}
                    onChange={e => setFilter('minPrecio', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    placeholder="Máx"
                    value={filters.maxPrecio}
                    onChange={e => setFilter('maxPrecio', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Año */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Año
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Desde"
                    value={filters.minAño}
                    onChange={e => setFilter('minAño', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    placeholder="Hasta"
                    value={filters.maxAño}
                    onChange={e => setFilter('maxAño', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Car grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-semibold text-gray-700 mb-1">Sin resultados</p>
              <p className="text-sm text-gray-400 mb-6">
                No hay autos con los filtros seleccionados.
              </p>
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(car => (
                <Link
                  key={car.id}
                  to={`/autos/${toSlug(car.modelo)}`}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                    {car.imagenes?.[0] ? (
                      <img
                        src={car.imagenes[0]}
                        alt={`${car.marca} ${car.modelo}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                        Sin imagen
                      </div>
                    )}
                    {/* Status badge — uses car.estado */}
                    {car.estado && (
                      <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[car.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[car.estado] ?? car.estado}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">
                      {car.marca}
                    </p>
                    <h3 className="font-heading text-base font-bold text-gray-900 leading-snug">
                      {car.modelo}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {car.año}{car.kilometraje ? ` · ${Number(car.kilometraje).toLocaleString('es-MX')} km` : ''}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="font-heading text-lg font-bold text-red-600">
                        {formatPrice(car.precio)}
                      </p>
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-red-500 transition-colors">
                        Ver más
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

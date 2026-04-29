// src/pages/Catalogo.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdjustmentsHorizontalIcon, XMarkIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import SEO from '../components/SEO'
import { formatPrice, toSlug } from '../lib/utils'
import { CAR_STATUS_LABELS as STATUS_LABELS, CAR_STATUS_COLORS as STATUS_COLORS } from '../lib/constants'

const PAGE_SIZE = 12

const EMPTY_FILTERS = { marca: '', transmision: '', minPrecio: '', maxPrecio: '', minAño: '', maxAño: '' }

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc',label: 'Precio: mayor a menor' },
  { value: 'km_asc',    label: 'Menor kilometraje' },
  { value: 'year_desc', label: 'Año: más nuevo' },
]

export default function Catalogo() {
  const [cars, setCars]           = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy]       = useState('newest')
  const [marcas, setMarcas]       = useState([])
  const [transmisiones, setTransmisiones] = useState([])

  // Load filter options once
  useEffect(() => {
    supabase
      .from('cars')
      .select('marca, transmision')
      .eq('visible', true)
      .then(({ data }) => {
        const d = data ?? []
        setMarcas([...new Set(d.map(c => c.marca).filter(Boolean))].sort())
        setTransmisiones([...new Set(d.map(c => c.transmision).filter(Boolean))].sort())
      })
  }, [])

  // Fetch page when filters / sort / page changes
  useEffect(() => {
    setLoading(true)

    let query = supabase
      .from('cars')
      .select('*', { count: 'exact' })
      .eq('visible', true)

    if (filters.marca)       query = query.eq('marca', filters.marca)
    if (filters.transmision) query = query.eq('transmision', filters.transmision)
    if (filters.minPrecio)   query = query.gte('precio', Number(filters.minPrecio))
    if (filters.maxPrecio)   query = query.lte('precio', Number(filters.maxPrecio))
    if (filters.minAño)      query = query.gte('año', Number(filters.minAño))
    if (filters.maxAño)      query = query.lte('año', Number(filters.maxAño))

    switch (sortBy) {
      case 'price_asc':  query = query.order('precio',      { ascending: true });  break
      case 'price_desc': query = query.order('precio',      { ascending: false }); break
      case 'km_asc':     query = query.order('kilometraje', { ascending: true });  break
      case 'year_desc':  query = query.order('año',         { ascending: false }); break
      default:           query = query.order('created_at',  { ascending: false }); break
    }

    const from = (page - 1) * PAGE_SIZE
    query
      .range(from, from + PAGE_SIZE - 1)
      .then(({ data, count }) => {
        setCars(data ?? [])
        setTotal(count ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filters, sortBy, page])

  const totalPages     = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = Object.values(filters).some(Boolean)

  function setFilter(key, value) {
    setPage(1)
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function handleSortChange(value) {
    setPage(1)
    setSortBy(value)
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all'

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <SEO
        title="Catálogo de autos usados en Puebla"
        description="Explora nuestro inventario de autos seminuevos verificados en Puebla, México. Financiamiento disponible. Encuentra tu próximo auto con AutoKlic."
        url="/catalogo"
      />

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">
            Catálogo de Autos
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {loading ? 'Buscando...' : `${total} vehículo${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={e => handleSortChange(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(v => !v)}
            className="flex lg:hidden items-center gap-2 border border-gray-200 hover:border-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            Filtros
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-red-500" />}
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
                  onClick={() => { setPage(1); setFilters(EMPTY_FILTERS) }}
                  className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Limpiar
                </button>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Marca</label>
                <select value={filters.marca} onChange={e => setFilter('marca', e.target.value)} className={inputClass}>
                  <option value="">Todas las marcas</option>
                  {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transmisión</label>
                <select value={filters.transmision} onChange={e => setFilter('transmision', e.target.value)} className={inputClass}>
                  <option value="">Todas</option>
                  {transmisiones.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Precio (MXN)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Mín" value={filters.minPrecio} onChange={e => setFilter('minPrecio', e.target.value)} className={inputClass} />
                  <input type="number" placeholder="Máx" value={filters.maxPrecio} onChange={e => setFilter('maxPrecio', e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Año</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Desde" value={filters.minAño} onChange={e => setFilter('minAño', e.target.value)} className={inputClass} />
                  <input type="number" placeholder="Hasta" value={filters.maxAño} onChange={e => setFilter('maxAño', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Car grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(PAGE_SIZE)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-semibold text-gray-700 mb-1">Sin resultados</p>
              <p className="text-sm text-gray-400 mb-6">No hay autos con los filtros seleccionados.</p>
              <button
                onClick={() => { setPage(1); setFilters(EMPTY_FILTERS) }}
                className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {cars.map(car => (
                  <Link
                    key={car.id}
                    to={`/autos/${toSlug(car.modelo)}`}
                    className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300"
                  >
                    <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                      {car.imagenes?.[0] ? (
                        <img
                          src={car.imagenes[0]}
                          alt={`${car.marca} ${car.modelo}`}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                          Sin imagen
                        </div>
                      )}
                      {car.estado && (
                        <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[car.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[car.estado] ?? car.estado}
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">{car.marca}</p>
                      <h3 className="font-heading text-base font-bold text-gray-900 leading-snug">{car.modelo}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {car.año}{car.kilometraje ? ` · ${Number(car.kilometraje).toLocaleString('es-MX')} km` : ''}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="font-heading text-lg font-bold text-red-600">{formatPrice(car.precio)}</p>
                        <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-red-500 transition-colors">
                          Ver más
                          <ArrowRightIcon className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    disabled={page === 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Anterior
                  </button>

                  <span className="text-sm text-gray-500">
                    Página <strong className="text-gray-900">{page}</strong> de <strong className="text-gray-900">{totalPages}</strong>
                  </span>

                  <button
                    onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    disabled={page === totalPages}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function toSlug(str) {
  return str.toLowerCase().replace(/\s+/g, '-')
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(price)
}

const STATUS_LABELS = { available: 'Disponible', reserved: 'Reservado', sold: 'Vendido' }
const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  reserved: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-gray-100 text-gray-500',
}

export default function Catalogo() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ marca: '', transmision: '', minPrecio: '', maxPrecio: '', minAño: '', maxAño: '' })

  useEffect(() => {
    supabase.from('cars').select('*').eq('visible', true).then(({ data }) => {
      setCars(data ?? [])
      setLoading(false)
    })
  }, [])

  const marcas = useMemo(() => [...new Set(cars.map(c => c.marca))].sort(), [cars])
  const transmisiones = useMemo(() => [...new Set(cars.map(c => c.transmision))].sort(), [cars])

  const filtered = useMemo(() => cars.filter(c => {
    if (filters.marca && c.marca !== filters.marca) return false
    if (filters.transmision && c.transmision !== filters.transmision) return false
    if (filters.minPrecio && c.precio < Number(filters.minPrecio)) return false
    if (filters.maxPrecio && c.precio > Number(filters.maxPrecio)) return false
    if (filters.minAño && c.año < Number(filters.minAño)) return false
    if (filters.maxAño && c.año > Number(filters.maxAño)) return false
    return true
  }), [cars, filters])

  function setFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
        ))}
      </div>
    </div>
  )

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Autos</h1>
      <p className="text-gray-500 mb-8">{filtered.length} vehículo{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select value={filters.marca} onChange={e => setFilter('marca', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas las marcas</option>
          {marcas.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={filters.transmision} onChange={e => setFilter('transmision', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Transmisión</option>
          {transmisiones.map(t => <option key={t}>{t}</option>)}
        </select>
        <input type="number" placeholder="Precio mínimo" value={filters.minPrecio}
          onChange={e => setFilter('minPrecio', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="number" placeholder="Precio máximo" value={filters.maxPrecio}
          onChange={e => setFilter('maxPrecio', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="number" placeholder="Año desde" value={filters.minAño}
          onChange={e => setFilter('minAño', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="number" placeholder="Año hasta" value={filters.maxAño}
          onChange={e => setFilter('maxAño', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({ marca: '', transmision: '', minPrecio: '', maxPrecio: '', minAño: '', maxAño: '' })}
            className="text-sm text-blue-600 hover:underline px-2">
            Limpiar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No se encontraron autos con los filtros seleccionados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(car => (
            <div key={car.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="h-48 bg-gray-100 overflow-hidden">
                {car.imagenes?.[0]
                  ? <img src={car.imagenes[0]} alt={car.modelo} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sin imagen</div>
                }
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-500">{car.marca}</p>
                    <h3 className="font-semibold text-gray-900">{car.modelo}</h3>
                    <p className="text-sm text-gray-500">{car.año} · {car.kilometraje?.toLocaleString()} km</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[car.status]}`}>
                    {STATUS_LABELS[car.status]}
                  </span>
                </div>
                <p className="mt-3 text-xl font-bold text-blue-600">{formatPrice(car.precio)}</p>
                <Link to={`/autos/${toSlug(car.modelo)}`}
                  className="mt-3 block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition">
                  Ver detalles
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const MARCAS = ['Volkswagen', 'Toyota', 'Mazda', 'Audi', 'Suzuki', 'Porsche', 'Nissan', 'Honda', 'Chevrolet', 'Ford']

const RANGOS = [
  { label: 'Hasta $250 mil', max: '250000' },
  { label: 'Hasta $400 mil', max: '400000' },
  { label: 'Hasta $600 mil', max: '600000' },
  { label: 'Cualquier precio', max: '' },
]

/** Kavak / Seminuevos-style quick search → /catalogo */
export default function HeroSearch() {
  const navigate = useNavigate()
  const [marca, setMarca] = useState('')
  const [maxPrecio, setMaxPrecio] = useState('')

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (marca) p.set('marca', marca)
    if (maxPrecio) p.set('maxPrecio', maxPrecio)
    const s = p.toString()
    return s ? `/catalogo?${s}` : '/catalogo'
  }, [marca, maxPrecio])

  function onSubmit(e) {
    e.preventDefault()
    navigate(query)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="ak-reveal ak-reveal-delay-2 w-full max-w-2xl border border-white/15 bg-black/45 p-2 backdrop-blur-md sm:p-2.5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <label className="sr-only" htmlFor="hero-marca">
          Marca
        </label>
        <select
          id="hero-marca"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-white/95 px-3 py-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-red-500/40"
        >
          <option value="">Todas las marcas</option>
          {MARCAS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="hero-precio">
          Presupuesto
        </label>
        <select
          id="hero-precio"
          value={maxPrecio}
          onChange={(e) => setMaxPrecio(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-white/95 px-3 py-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-red-500/40"
        >
          {RANGOS.map((r) => (
            <option key={r.label} value={r.max}>
              {r.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 sm:shrink-0"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          Buscar
        </button>
      </div>
    </form>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { FaWhatsapp } from 'react-icons/fa'
import CarCard from './CarCard'
import { listPublicCars, listAllPublicCars } from '../lib/publicCars'
import { whatsappUrl } from '../lib/contact'

export default function FeaturedCars() {
  const [autos, setAutos] = useState([])
  const [marcas, setMarcas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listPublicCars({ limit: 6, sort: 'newest' }),
      listAllPublicCars(),
    ]).then(([featured, all]) => {
      setAutos(featured.data ?? [])
      const m = [...new Set((all.data ?? []).map((c) => c.marca).filter(Boolean))].sort()
      setMarcas(m)
      setLoading(false)
    })
  }, [])

  return (
    <section
      id="autos"
      className="relative overflow-hidden py-16 sm:py-24"
      style={{
        background: 'linear-gradient(180deg, #0a0a0b 0%, #141416 12%, #f4f4f5 12%, #f4f4f5 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-[12%] h-32 bg-gradient-to-b from-red-600/10 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-500">
              <span className="h-px w-6 bg-red-500" />
              Inventario en Puebla
            </p>
            <h2 className="font-heading text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Autos destacados
            </h2>
            <p className="mt-2 max-w-md text-sm text-neutral-500">
              Precio y specs al frente. Filtra por marca o abre el catálogo completo.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            Ver catálogo completo
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Brand chips — Seminuevos / Kavak entry pattern */}
        {marcas.length > 0 && (
          <div className="mb-8 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <Link
              to="/catalogo"
              className="shrink-0 border border-neutral-900 bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white"
            >
              Todos
            </Link>
            {marcas.map((m) => (
              <Link
                key={m}
                to={`/catalogo?marca=${encodeURIComponent(m)}`}
                className="shrink-0 border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-red-500 hover:text-red-600"
              >
                {m}
              </Link>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-neutral-200" />
                <div className="mt-4 h-5 w-3/4 bg-neutral-200" />
                <div className="mt-2 h-4 w-1/2 bg-neutral-200" />
                <div className="mt-4 h-8 w-1/3 bg-neutral-200" />
              </div>
            ))}
          </div>
        ) : autos.length === 0 ? (
          <div className="border border-dashed border-neutral-300 bg-white px-4 py-14 text-center">
            <p className="font-heading text-lg font-bold text-neutral-900">Inventario en actualización</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              Escríbenos y te ayudamos a encontrar tu próximo auto.
            </p>
            <a
              href={whatsappUrl('Hola, busco un auto. ¿Me ayudan con el inventario?')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
            >
              <FaWhatsapp className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {autos.map((auto) => (
              <CarCard key={auto.id} car={auto} />
            ))}
          </div>
        )}

        {autos.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 bg-neutral-950 px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-red-600"
            >
              Ver todos los autos
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

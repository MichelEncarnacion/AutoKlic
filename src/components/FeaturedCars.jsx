import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { FaWhatsapp } from 'react-icons/fa'
import CarCard from './CarCard'
import { listPublicCars } from '../lib/publicCars'
import { whatsappUrl } from '../lib/contact'

export default function FeaturedCars() {
  const [autos, setAutos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPublicCars({ limit: 6, sort: 'newest' }).then(({ data }) => {
      setAutos(data ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <section
      id="autos"
      className="relative overflow-hidden py-20 sm:py-28"
      style={{
        background:
          'linear-gradient(180deg, #0a0a0b 0%, #141416 18%, #f4f4f5 18%, #f4f4f5 100%)',
      }}
    >
      {/* Soft atmosphere */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[18%] h-40 bg-gradient-to-b from-red-600/10 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="ak-reveal">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-500">
              <span className="h-px w-6 bg-red-500" />
              Inventario en Puebla
            </p>
            <h2 className="font-heading text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
              Autos destacados
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
              Precio, kilometraje y transmisión al frente — elige, escribe por WhatsApp y agenda visita.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="ak-reveal ak-reveal-delay-1 inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
          >
            Ver catálogo completo
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

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
          <div className="border border-dashed border-neutral-300 bg-white/80 px-4 py-16 text-center">
            <p className="mb-2 font-heading text-lg font-bold text-neutral-900">
              Inventario en actualización
            </p>
            <p className="mx-auto mb-8 max-w-md text-sm text-neutral-500">
              En este momento no hay unidades publicadas. Escríbenos y te ayudamos a encontrar tu próximo auto.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={whatsappUrl('Hola, busco un auto. ¿Me ayudan con el inventario?')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
              >
                <FaWhatsapp className="h-4 w-4" /> WhatsApp
              </a>
              <a
                href="#contacto"
                className="inline-flex items-center justify-center rounded-lg border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-800 hover:border-neutral-300"
              >
                Dejar mensaje
              </a>
            </div>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {autos.map((auto, i) => {
              const delay =
                i === 0 ? 'ak-reveal-delay-1' : i === 1 ? 'ak-reveal-delay-2' : 'ak-reveal-delay-3'
              return (
                <div key={auto.id} className={`ak-reveal ${delay}`}>
                  <CarCard car={auto} />
                </div>
              )
            })}
          </div>
        )}

        {autos.length > 0 && (
          <div className="mt-14 text-center">
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

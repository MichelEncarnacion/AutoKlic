import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { formatPrice, toSlug } from '../lib/utils'

function formatKm(km) {
  if (km == null || km === '') return null
  return `${Number(km).toLocaleString('es-MX')} km`
}

/**
 * Kavak-inspired listing card: photo → title → specs → dominant price.
 * Shared by landing FeaturedCars and /catalogo.
 */
export default function CarCard({ car }) {
  const slug = toSlug(car.modelo)
  const imagen = Array.isArray(car.imagenes) && car.imagenes.length > 0 ? car.imagenes[0] : null
  const status = car.estado || car.status
  const isReserved = status === 'reserved'
  const specs = [car.año, formatKm(car.kilometraje), car.transmision].filter(Boolean).join(' · ')

  return (
    <Link
      to={`/autos/${slug}`}
      className="group flex flex-col bg-white transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {imagen ? (
          <img
            src={imagen}
            alt={`${car.marca} ${car.modelo}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-300">
            Sin imagen
          </div>
        )}
        {isReserved && (
          <span className="absolute left-3 top-3 bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Reservado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-4 pb-1">
        <h3 className="font-heading text-lg font-bold leading-snug text-neutral-900 sm:text-xl">
          <span className="text-neutral-500 font-semibold">{car.marca}</span>
          <span className="mx-1.5 text-neutral-300">·</span>
          {car.modelo}
        </h3>

        {specs && (
          <p className="mt-1.5 text-sm text-neutral-500">{specs}</p>
        )}

        <div className="mt-auto pt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            Precio
          </p>
          <div className="mt-0.5 flex items-baseline justify-between gap-2">
            <p className="font-heading text-2xl font-bold leading-none text-neutral-900 sm:text-3xl">
              {formatPrice(car.precio)}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Ver
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

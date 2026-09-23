import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

/** Nowy-style dual CTA band: sell / value your car */
export default function SellBand() {
  return (
    <section className="relative bg-red-600">
      <div
        className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6 sm:py-16">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            ¿Tienes un auto?
          </p>
          <h2 className="font-heading mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Véndelo o valúalo en minutos
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
            Oferta clara, proceso de mercado y proceso AutoKlic. Sin rodeos.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            to="/valua-tu-auto"
            className="inline-flex items-center justify-center gap-2 bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            Valúa tu auto
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            to="/vende-tu-auto"
            className="inline-flex items-center justify-center gap-2 border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Vende tu auto
          </Link>
        </div>
      </div>
    </section>
  )
}

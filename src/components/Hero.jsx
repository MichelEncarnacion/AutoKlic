import { Link } from 'react-router-dom'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { FaWhatsapp } from 'react-icons/fa'
import { whatsappUrl } from '../lib/contact'

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[url('/autos/hero.webp')] bg-cover bg-center bg-no-repeat"
    >
      {/* Atmosphere layers */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-red-600/20 blur-3xl ak-pulse-glow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-64 w-96 bg-amber-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-start justify-center px-6 pt-16 sm:px-10 md:px-16 lg:px-24">
        <p className="ak-reveal font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Auto<span className="text-amber-400">Klic</span>
        </p>

        <div className="ak-reveal ak-reveal-delay-1 mb-6 mt-5 flex items-center gap-2">
          <span className="h-px w-10 bg-red-500" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
            Seminuevos en Puebla
          </span>
        </div>

        <h1 className="ak-reveal ak-reveal-delay-1 font-heading max-w-3xl text-4xl font-bold leading-[1.02] text-white sm:text-5xl md:text-6xl lg:text-7xl">
          El auto que buscas a un solo{' '}
          <span className="text-amber-400">KLIC</span>
        </h1>

        <p className="ak-reveal ak-reveal-delay-2 mb-10 mt-6 max-w-lg text-base font-light leading-relaxed text-white/70 sm:text-lg">
          Inventario verificado, trato claro y asesoría por WhatsApp. Compra o vende en Puebla sin rodeos.
        </p>

        <div className="ak-reveal ak-reveal-delay-2 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/catalogo"
            className="bg-red-600 px-9 py-3.5 text-center text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-red-500 hover:shadow-[0_0_32px_-4px_rgba(220,38,38,0.55)]"
          >
            Ver inventario
          </Link>
          <a
            href={whatsappUrl('Hola, quiero información sobre un auto de AutoKlic.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-white/35 px-9 py-3.5 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:border-white/70 hover:bg-white/10"
          >
            <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        </div>
      </div>

      <a
        href="#autos"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/40 transition-colors hover:text-white/80"
        aria-label="Ir a autos destacados"
      >
        <ChevronDownIcon className="h-6 w-6 animate-bounce" />
      </a>
    </section>
  )
}

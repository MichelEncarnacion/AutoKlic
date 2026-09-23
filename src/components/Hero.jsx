import { Link } from 'react-router-dom'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { FaWhatsapp } from 'react-icons/fa'
import { whatsappUrl } from '../lib/contact'
import HeroSearch from './HeroSearch'

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-[url('/autos/hero.webp')] bg-cover bg-center bg-no-repeat"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35" />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-red-600/25 blur-3xl ak-pulse-glow"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-16 pt-24 sm:px-10 md:px-16 lg:px-24">
        <p className="ak-reveal font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Auto<span className="text-amber-400">Klic</span>
        </p>

        <div className="ak-reveal ak-reveal-delay-1 mb-5 mt-5 flex items-center gap-2">
          <span className="h-px w-10 bg-red-500" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
            Seminuevos en Puebla
          </span>
        </div>

        <h1 className="ak-reveal ak-reveal-delay-1 font-heading max-w-3xl text-4xl font-bold leading-[1.02] text-white sm:text-5xl md:text-6xl lg:text-[4.5rem]">
          El auto que buscas a un solo{' '}
          <span className="text-amber-400">KLIC</span>
        </h1>

        <p className="ak-reveal ak-reveal-delay-2 mt-5 max-w-lg text-base font-light leading-relaxed text-white/70 sm:text-lg">
          Inventario verificado y trato claro. Busca por marca o presupuesto — o escríbenos por WhatsApp.
        </p>

        <div className="mt-8 space-y-4">
          <HeroSearch />
          <div className="ak-reveal ak-reveal-delay-2 flex flex-wrap items-center gap-4">
            <Link
              to="/catalogo"
              className="text-sm font-semibold text-white/90 underline-offset-4 transition hover:text-amber-400 hover:underline"
            >
              Ver catálogo completo
            </Link>
            <span className="text-white/30" aria-hidden="true">
              ·
            </span>
            <a
              href={whatsappUrl('Hola, quiero información sobre un auto de AutoKlic.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition hover:text-[#25D366]"
            >
              <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <a
        href="#autos"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/40 transition-colors hover:text-white/80"
        aria-label="Ir a autos destacados"
      >
        <ChevronDownIcon className="h-6 w-6 animate-bounce" />
      </a>
    </section>
  )
}

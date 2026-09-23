import { Link } from 'react-router-dom'
import { MagnifyingGlassIcon, CurrencyDollarIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { FaWhatsapp } from 'react-icons/fa'
import { whatsappUrl } from '../lib/contact'

const caminos = [
  {
    titulo: 'Quiero comprar',
    descripcion:
      'Explora el inventario, agenda una visita o escríbenos por WhatsApp. Te acompañamos hasta la entrega.',
    icono: MagnifyingGlassIcon,
    primary: { label: 'Ver inventario', to: '/catalogo' },
    secondary: {
      label: 'WhatsApp',
      href: whatsappUrl('Hola, quiero comprar un auto con AutoKlic.'),
      external: true,
    },
  },
  {
    titulo: 'Quiero vender',
    descripcion:
      'Valúa en minutos o envía los datos de tu auto. Te respondemos con una oferta clara.',
    icono: CurrencyDollarIcon,
    primary: { label: 'Valúa tu auto', to: '/valua-tu-auto' },
    secondary: { label: 'Vende tu auto', to: '/vende-tu-auto' },
  },
]

export default function Process() {
  return (
    <section id="proceso" className="bg-neutral-950 py-16 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl sm:mb-12">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-400">
            <span className="h-px w-6 bg-red-400" />
            Simple y transparente
          </p>
          <h2 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
            ¿Cómo te ayudamos?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">
            Elige tu camino. Misma agencia en Puebla — compra o vende sin pasos confusos.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {caminos.map((camino) => {
            const Icon = camino.icono
            return (
              <div
                key={camino.titulo}
                className="group relative flex flex-col overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-7 transition-colors hover:border-red-500/40 sm:p-8"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-600/10 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative mb-5 flex h-11 w-11 items-center justify-center border border-red-500/25 bg-red-600/15">
                  <Icon className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="font-heading relative text-2xl font-bold sm:text-3xl">{camino.titulo}</h3>
                <p className="relative mt-3 flex-1 text-sm leading-relaxed text-neutral-400">
                  {camino.descripcion}
                </p>
                <div className="relative mt-7 flex flex-col gap-2 sm:flex-row">
                  <Link
                    to={camino.primary.to}
                    className="inline-flex items-center justify-center gap-2 bg-red-600 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-red-500"
                  >
                    {camino.primary.label}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                  {camino.secondary.external ? (
                    <a
                      href={camino.secondary.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 border border-white/20 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-white/45"
                    >
                      <FaWhatsapp className="h-4 w-4" />
                      {camino.secondary.label}
                    </a>
                  ) : (
                    <Link
                      to={camino.secondary.to}
                      className="inline-flex items-center justify-center border border-white/20 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-white/45"
                    >
                      {camino.secondary.label}
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { MapPinIcon, ChatBubbleLeftRightIcon, DocumentCheckIcon } from '@heroicons/react/24/outline'

const items = [
  {
    icon: MapPinIcon,
    title: 'Agencia en Puebla',
    text: 'Visita, prueba de manejo y entrega local.',
  },
  {
    icon: DocumentCheckIcon,
    title: 'Autos verificados',
    text: 'Revisión mecánica y papeles en regla.',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'WhatsApp directo',
    text: 'Asesoría clara, sin rondas de llamadas.',
  },
]

/** Trust strip below hero — qualitative, no fake stats */
export default function TrustBand() {
  return (
    <section className="border-b border-neutral-200 bg-neutral-950 text-white" aria-label="Por qué AutoKlic">
      <div className="mx-auto grid max-w-7xl gap-px bg-white/10 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="flex gap-4 bg-neutral-950 px-6 py-6 sm:px-8 sm:py-7"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-red-500/30 bg-red-600/10">
              <Icon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold tracking-tight">{title}</p>
              <p className="mt-1 text-sm leading-snug text-neutral-400">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

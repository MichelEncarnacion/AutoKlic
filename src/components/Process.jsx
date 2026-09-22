import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, CurrencyDollarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { FaWhatsapp } from 'react-icons/fa';
import { whatsappUrl } from '../lib/contact';

const caminos = [
  {
    titulo: 'Quiero comprar',
    descripcion: 'Explora el inventario, agenda una visita o escríbenos por WhatsApp. Te acompañamos hasta la entrega.',
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
    descripcion: 'Valúa en minutos o envía los datos de tu auto. Te respondemos con una oferta clara.',
    icono: CurrencyDollarIcon,
    primary: { label: 'Valúa tu auto', to: '/valua-tu-auto' },
    secondary: { label: 'Vende tu auto', to: '/vende-tu-auto' },
  },
];

export default function Process() {
  return (
    <section id="proceso" className="py-20 sm:py-28 bg-gray-950 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14" data-aos="fade-up">
          <p className="flex items-center justify-center gap-2 text-red-400 text-xs font-semibold tracking-widest uppercase mb-4">
            <span className="w-6 h-px bg-red-400" />
            Simple y transparente
            <span className="w-6 h-px bg-red-400" />
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white">
            ¿Cómo te ayudamos?
          </h2>
          <p className="text-gray-400 text-sm mt-4 max-w-lg mx-auto">
            Elige tu camino. Misma agencia en Puebla, sin pasos confusos.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {caminos.map((camino, i) => {
            const Icon = camino.icono;
            return (
              <div
                key={camino.titulo}
                className="relative flex flex-col p-8 border border-white/10 hover:border-white/20 transition-colors duration-300"
                data-aos="fade-up"
                data-aos-delay={i * 80}
              >
                <div className="w-12 h-12 rounded-xl bg-red-600/15 border border-red-500/25 flex items-center justify-center mb-6">
                  <Icon className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-white mb-3">
                  {camino.titulo}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">
                  {camino.descripcion}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to={camino.primary.to}
                    className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {camino.primary.label}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                  {camino.secondary.external ? (
                    <a
                      href={camino.secondary.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <FaWhatsapp className="h-4 w-4" />
                      {camino.secondary.label}
                    </a>
                  ) : (
                    <Link
                      to={camino.secondary.to}
                      className="inline-flex items-center justify-center border border-white/20 hover:border-white/40 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      {camino.secondary.label}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

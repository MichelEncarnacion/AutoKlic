// src/components/Process.jsx
import { PhoneIcon, MagnifyingGlassIcon, CurrencyDollarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
// Note: AOS is initialized globally in App.jsx — do not call AOS.init() here

const pasos = [
  {
    numero: '01',
    titulo: 'Contáctanos',
    descripcion: 'Déjanos tus datos y un asesor te contactará en minutos para entender lo que buscas.',
    icono: PhoneIcon,
  },
  {
    numero: '02',
    titulo: 'Revisión',
    descripcion: 'Inspeccionamos el vehículo o buscamos el que te interesa dentro de nuestro inventario.',
    icono: MagnifyingGlassIcon,
  },
  {
    numero: '03',
    titulo: 'Compra / Venta',
    descripcion: 'Finalizamos el trato de forma segura, rápida y con toda la documentación en regla.',
    icono: CurrencyDollarIcon,
  },
];

export default function Process() {
  return (
    <section id="proceso" className="py-20 sm:py-28 bg-gray-950 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <p className="flex items-center justify-center gap-2 text-red-400 text-xs font-semibold tracking-widest uppercase mb-4">
            <span className="w-6 h-px bg-red-400" />
            Simple y transparente
            <span className="w-6 h-px bg-red-400" />
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white">
            ¿Cómo funciona?
          </h2>
        </div>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-3 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {pasos.map((paso, i) => {
            const Icon = paso.icono;
            return (
              <div
                key={i}
                className="relative flex flex-col items-center text-center p-8 rounded-2xl bg-white/4 border border-white/8 hover:border-white/15 hover:bg-white/6 transition-all duration-300 group"
                data-aos="fade-up"
                data-aos-delay={i * 100}
              >
                {/* Step number */}
                <span className="font-heading text-6xl font-bold text-white/8 absolute top-6 right-6 leading-none select-none">
                  {paso.numero}
                </span>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-6 group-hover:bg-red-600/20 transition-colors duration-300">
                  <Icon className="h-7 w-7 text-red-400" />
                </div>

                <h3 className="font-heading text-xl font-bold text-white mb-3">
                  {paso.numero}. {paso.titulo}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {paso.descripcion}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center" data-aos="fade-up">
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25"
          >
            Comienza ahora
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

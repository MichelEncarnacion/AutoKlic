import { Link } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { FaWhatsapp } from 'react-icons/fa';
import { whatsappUrl } from '../lib/contact';

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative w-full h-screen min-h-[600px] bg-[url('/autos/hero.webp')] bg-no-repeat bg-cover bg-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/75" />

      <div className="relative z-10 h-full flex flex-col justify-center items-start px-6 sm:px-10 md:px-16 lg:px-24 max-w-7xl mx-auto w-full pt-16">
        <p className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
          Auto<span className="text-amber-400">Klic</span>
        </p>

        <div className="flex items-center gap-2 mb-5">
          <span className="w-8 h-px bg-red-500" />
          <span className="text-red-400 text-xs font-semibold tracking-widest uppercase">
            Seminuevos en Puebla
          </span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-5 max-w-3xl">
          El auto que buscas a un solo{' '}
          <span className="text-amber-400">KLIC</span>
        </h1>

        <p className="text-white/75 text-base sm:text-lg max-w-lg mb-10 leading-relaxed font-light">
          Inventario verificado, trato claro y asesoría por WhatsApp. Compra o vende en Puebla sin rodeos.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            to="/catalogo"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25 text-center"
          >
            Ver inventario
          </Link>
          <a
            href={whatsappUrl('Hola, quiero información sobre un auto de AutoKlic.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-white/30 hover:border-white/60 hover:bg-white/8 text-white px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200"
          >
            <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        </div>
      </div>

      <a
        href="#autos"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/35 hover:text-white/70 transition-colors"
        aria-label="Ir a autos destacados"
      >
        <ChevronDownIcon className="h-6 w-6 animate-bounce" />
      </a>
    </section>
  );
}

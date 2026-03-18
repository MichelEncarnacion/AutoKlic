// src/components/Hero.jsx
import { Link } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative w-full h-screen min-h-[600px] bg-[url('/autos/hero.webp')] bg-no-repeat bg-cover bg-center overflow-hidden"
    >
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-start px-6 sm:px-10 md:px-16 lg:px-24 max-w-7xl mx-auto w-full">
        {/* Tag */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-8 h-px bg-red-500" />
          <span className="text-red-400 text-xs font-semibold tracking-widest uppercase">
            Puebla, México
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-tight mb-6 max-w-3xl">
          El Auto que buscas a un solo{' '}
          <span className="text-amber-400">KLIC</span>
        </h1>

        {/* Subheading */}
        <p className="text-white/75 text-base sm:text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-light">
          Descubre nuestra selección de vehículos de alta gama. Una experiencia diseñada para quienes exigen más.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#autos"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25 text-center"
          >
            Ver vehículos
          </a>
          <Link
            to="/catalogo"
            className="border border-white/30 hover:border-white/60 hover:bg-white/8 text-white px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 text-center"
          >
            Catálogo completo
          </Link>
        </div>

        {/* Stats bar */}
        <div className="mt-16 flex flex-wrap gap-8 sm:gap-12">
          {[
            { value: '200+', label: 'Vehículos vendidos' },
            { value: '5★', label: 'Calificación promedio' },
            { value: '48h', label: 'Tiempo promedio de venta' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="font-heading text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-white/50 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#autos"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
        aria-label="Scroll down"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <ChevronDownIcon className="h-5 w-5 animate-bounce" />
      </a>
    </section>
  );
}

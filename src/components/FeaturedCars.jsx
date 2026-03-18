// src/components/FeaturedCars.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';

function toSlug(str) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function FeaturedCars() {
  const [autos, setAutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('cars')
      .select('id, marca, modelo, año, precio, imagenes')
      .eq('visible', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setAutos(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <section id="autos" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
          <div>
            <p className="flex items-center gap-2 text-red-500 text-xs font-semibold tracking-widest uppercase mb-3">
              <span className="w-6 h-px bg-red-500" />
              Inventario destacado
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-gray-900">
              Autos destacados
            </h2>
          </div>
          <Link
            to="/catalogo"
            className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors shrink-0"
          >
            Ver catálogo completo
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Skeleton / Cards */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : autos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">Próximamente nuevos vehículos</p>
            <p className="text-sm mt-2">Visita el catálogo o contáctanos para más información.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {autos.map((auto) => {
              const slug = toSlug(auto.modelo);
              const imagen = Array.isArray(auto.imagenes) && auto.imagenes.length > 0
                ? auto.imagenes[0]
                : null;
              const isPremium = auto.precio >= 400000;

              return (
                <Link
                  to={`/autos/${slug}`}
                  key={auto.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden aspect-[16/10] bg-gray-100">
                    {imagen ? (
                      <img
                        src={imagen}
                        alt={`${auto.marca} ${auto.modelo}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                        Sin imagen
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isPremium
                        ? 'bg-amber-400 text-amber-900'
                        : 'bg-white/90 text-gray-700'
                    }`}>
                      {isPremium ? 'Premium' : 'Disponible'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">{auto.marca}</p>
                    <h3 className="font-heading text-lg font-bold text-gray-900 mb-3 leading-snug">
                      {auto.modelo} {auto.año}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-red-600 font-bold text-xl font-heading">
                        {formatPrice(auto.precio)}
                      </p>
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-red-500 transition-colors">
                        Ver detalles
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 hover:shadow-lg"
          >
            Ver todos los autos
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

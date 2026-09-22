import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { FaWhatsapp } from 'react-icons/fa';
import { listPublicCars } from '../lib/publicCars';
import { formatPrice, toSlug } from '../lib/utils';
import { whatsappUrl } from '../lib/contact';
import { CAR_STATUS_LABELS as STATUS_LABELS, CAR_STATUS_COLORS as STATUS_COLORS } from '../lib/constants';

function formatKm(km) {
  if (km == null || km === '') return null;
  return `${Number(km).toLocaleString('es-MX')} km`;
}

export default function FeaturedCars() {
  const [autos, setAutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicCars({ limit: 6, sort: 'newest' }).then(({ data }) => {
      setAutos(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <section id="autos" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
          <div>
            <p className="flex items-center gap-2 text-red-500 text-xs font-semibold tracking-widest uppercase mb-3">
              <span className="w-6 h-px bg-red-500" />
              Inventario
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-gray-900">
              Autos destacados
            </h2>
            <p className="text-gray-500 text-sm mt-3 max-w-md">
              Seminuevos listos para ver en Puebla. Precio, kilometraje y transmisión al frente.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors shrink-0"
          >
            Ver catálogo completo
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : autos.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-lg font-heading font-bold text-gray-900 mb-2">
              Inventario en actualización
            </p>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
              En este momento no hay unidades publicadas. Escríbenos y te ayudamos a encontrar tu próximo auto.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={whatsappUrl('Hola, busco un auto. ¿Me ayudan con el inventario?')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white px-6 py-3 rounded-lg text-sm font-semibold"
              >
                <FaWhatsapp className="h-4 w-4" /> WhatsApp
              </a>
              <a
                href="#contacto"
                className="inline-flex items-center justify-center border border-gray-200 hover:border-gray-300 text-gray-800 px-6 py-3 rounded-lg text-sm font-semibold"
              >
                Dejar mensaje
              </a>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {autos.map((auto) => {
              const slug = toSlug(auto.modelo);
              const imagen = Array.isArray(auto.imagenes) && auto.imagenes.length > 0
                ? auto.imagenes[0]
                : null;
              const statusKey = auto.estado || auto.status;
              const specs = [auto.año, formatKm(auto.kilometraje), auto.transmision]
                .filter(Boolean)
                .join(' · ');

              return (
                <Link
                  to={`/autos/${slug}`}
                  key={auto.id}
                  className="group overflow-hidden border border-gray-100 hover:border-gray-200 transition-colors duration-300"
                >
                  <div className="relative overflow-hidden aspect-[16/10] bg-gray-100">
                    {imagen ? (
                      <img
                        src={imagen}
                        alt={`${auto.marca} ${auto.modelo}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                        Sin imagen
                      </div>
                    )}
                    {statusKey && (
                      <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        STATUS_COLORS[statusKey] ?? 'bg-white/90 text-gray-700'
                      }`}>
                        {STATUS_LABELS[statusKey] ?? statusKey}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">{auto.marca}</p>
                    <h3 className="font-heading text-lg font-bold text-gray-900 leading-snug">
                      {auto.modelo}
                    </h3>
                    {specs && (
                      <p className="text-xs text-gray-500 mt-1.5">{specs}</p>
                    )}
                    <div className="flex items-end justify-between mt-4 gap-3">
                      <p className="text-red-600 font-bold text-2xl font-heading leading-none">
                        {formatPrice(auto.precio)}
                      </p>
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-red-500 transition-colors shrink-0 pb-0.5">
                        Ver
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {autos.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200"
            >
              Ver todos los autos
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

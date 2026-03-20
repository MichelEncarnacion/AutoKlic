// src/pages/AutoDetalle.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FaWhatsapp } from 'react-icons/fa';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
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

const STATUS_LABELS = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
};

const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  reserved: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-gray-100 text-gray-500',
};

function Lightbox({ images, index, onClose }) {
  const [current, setCurrent] = useState(index)

  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition"
      >
        <XMarkIcon className="w-7 h-7" />
      </button>

      {/* Counter */}
      <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {current + 1} / {images.length}
      </span>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); prev() }}
          className="absolute left-4 p-2 text-white/70 hover:text-white transition"
        >
          <ChevronLeftIcon className="w-8 h-8" />
        </button>
      )}

      {/* Image */}
      <img
        src={images[current]}
        alt={`Imagen ${current + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
        onClick={e => e.stopPropagation()}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); next() }}
          className="absolute right-4 p-2 text-white/70 hover:text-white transition"
        >
          <ChevronRightIcon className="w-8 h-8" />
        </button>
      )}
    </div>
  )
}

export default function AutoDetalle() {
  const { modelo } = useParams();
  const [auto, setAuto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null) // null | index

  useEffect(() => {
    supabase
      .from('cars')
      .select('*')
      .eq('visible', true)
      .then(({ data }) => {
        const found = (data ?? []).find(c => toSlug(c.modelo) === modelo);
        setAuto(found ?? null);
        setLoading(false);
      });
  }, [modelo]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="bg-gray-100 rounded-2xl aspect-[4/3] animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-3/4" />
            <div className="h-6 bg-gray-100 rounded-lg animate-pulse w-1/2" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-full mt-6" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!auto) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-5xl mb-4">🚗</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Auto no encontrado</h2>
        <p className="text-gray-500 mb-8">Este vehículo no está disponible o ya fue vendido.</p>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Ver catálogo
        </Link>
      </div>
    );
  }

  const imagenes = Array.isArray(auto.imagenes) && auto.imagenes.length > 0
    ? auto.imagenes
    : [];

  const fichaItems = [
    { label: 'Marca', value: auto.marca },
    { label: 'Año', value: auto.año },
    { label: 'Motor', value: auto.motor },
    { label: 'Transmisión', value: auto.transmision },
    { label: 'Combustible', value: auto.combustible },
    { label: 'Color', value: auto.color },
    { label: 'Puertas', value: auto.puertas },
    { label: 'Tracción', value: auto.traccion },
    { label: 'Kilometraje', value: auto.kilometraje ? `${Number(auto.kilometraje).toLocaleString('es-MX')} km` : null },
    { label: 'Aire A/C', value: auto.aire },
    { label: 'Infoentretenimiento', value: auto.infoentretenimiento },
  ].filter(item => item.value != null && item.value !== '');

  const msg    = encodeURIComponent(`Hola, me interesa el *${auto.marca} ${auto.modelo} ${auto.año}* en *${formatPrice(auto.precio)}*. ¿Está disponible?`)
  const waUrl  = `https://wa.me/522213411834?text=${msg}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Back link */}
      <Link
        to="/#autos"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8 group"
      >
        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Volver a vehículos
      </Link>

      <div className="grid lg:grid-cols-2 gap-10 items-start">

        {/* Carousel */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {imagenes.length > 0 ? (
            <Carousel
              showArrows
              showThumbs={imagenes.length > 1}
              infiniteLoop
              autoPlay={imagenes.length > 1}
              interval={5000}
              showStatus={false}
              swipeable
              emulateTouch
              onClickItem={i => setLightbox(i)}
            >
              {imagenes.map((img, i) => (
                <div key={i} className="aspect-[4/3] bg-gray-100 cursor-zoom-in">
                  <img
                    src={img}
                    alt={`${auto.marca} ${auto.modelo} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </Carousel>
          ) : (
            <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400">
              Sin imágenes disponibles
            </div>
          )}
          {imagenes.length > 0 && (
            <p className="text-center text-xs text-gray-400 py-2">
              Toca una foto para ampliarla
            </p>
          )}
        </div>

        {/* Info */}
        <div>
          {/* Status badge */}
          {auto.estado && (
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${STATUS_COLORS[auto.estado] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[auto.estado] ?? auto.estado}
            </span>
          )}

          <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">{auto.marca}</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-2 leading-tight">
            {auto.modelo}
          </h1>
          <p className="font-heading text-3xl font-bold text-red-600 mb-5">
            {formatPrice(auto.precio)}
          </p>

          {auto.descripcion && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{auto.descripcion}</p>
          )}

          {/* Specs grid */}
          {fichaItems.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-8">
              {fichaItems.map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5b] text-white px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-green-400/25"
            >
              <FaWhatsapp className="h-5 w-5" />
              Me interesa este auto
            </a>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox
          images={imagenes}
          index={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

// src/pages/AutoDetalle.jsx
import { useEffect, useState, useCallback, useMemo, useRef, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, ArrowRightIcon, LinkIcon, CalculatorIcon } from '@heroicons/react/24/outline'
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';
import { formatPrice, toSlug } from '../lib/utils';
import { CAR_STATUS_LABELS as STATUS_LABELS, CAR_STATUS_COLORS as STATUS_COLORS } from '../lib/constants';

const EQUIPMENT_MAP = [
  { field: 'aire',               emoji: '❄️',  label: 'Clima A/C' },
  { field: 'infoentretenimiento', emoji: '📱', label: 'Pantalla táctil' },
]

function EquipmentPills({ auto }) {
  const pills = EQUIPMENT_MAP.filter(item => Boolean(auto?.[item.field]))
  if (pills.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {pills.map(p => (
        <span
          key={p.field}
          className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
        >
          <span aria-hidden="true">{p.emoji}</span> {p.label}
        </span>
      ))}
    </div>
  )
}

function StickyHeader({ auto, waUrl, visible }) {
  return (
    <div
      role="banner"
      aria-label="Encabezado fijo del vehículo"
      aria-hidden={!visible}
      {...(!visible ? { inert: '' } : {})}
      className={`fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm transition-[transform,opacity] duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/catalogo" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 shrink-0 transition-colors">
            <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden="true" /> Catálogo
          </Link>
          <div className="w-px h-4 bg-gray-200 shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate">{auto.marca} {auto.modelo}</span>
            <span className="text-xs text-gray-400 ml-2">
              {auto.año}{auto.kilometraje ? ` · ${Number(auto.kilometraje).toLocaleString('es-MX')} km` : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-bold text-red-600 hidden sm:block">{formatPrice(auto.precio)}</span>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] hover:bg-[#1ebe5b] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <FaWhatsapp className="h-3.5 w-3.5" aria-hidden="true" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

function DarkGallery({ imagenes, onImageClick }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => { setCurrent(0) }, [imagenes])

  if (imagenes.length === 0) {
    return (
      <div className="bg-[#0f172a] aspect-[4/3] flex items-center justify-center text-gray-500 text-sm">
        Sin imágenes disponibles
      </div>
    )
  }

  return (
    <div className="bg-[#0f172a]">
      {/* Main image */}
      <button
        type="button"
        aria-label="Ampliar imagen"
        className="relative w-full cursor-zoom-in focus:outline-none"
        onClick={() => onImageClick?.(current)}
      >
        <img
          src={imagenes[current]}
          alt={`Foto ${current + 1}`}
          loading="eager"
          className="w-full aspect-[4/3] object-cover"
        />
        <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {current + 1} / {imagenes.length}
        </span>
        <span className="absolute bottom-3 left-3 bg-black/50 text-white/70 text-xs px-2.5 py-1 rounded-full md:hidden">
          Toca para ampliar
        </span>
      </button>
      {/* Thumbnails */}
      {imagenes.length > 1 && (
        <div className="flex gap-1.5 p-2 overflow-x-auto">
          {imagenes.map((img, i) => (
            <button
              key={img}
              type="button"
              aria-label={`Foto ${i + 1} de ${imagenes.length}`}
              aria-pressed={i === current}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-all ${
                i === current ? 'border-red-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-75'
              }`}
            >
              <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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
        aria-label="Cerrar galería"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition"
      >
        <XMarkIcon className="w-7 h-7" aria-hidden="true" />
      </button>

      {/* Counter */}
      <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {current + 1} / {images.length}
      </span>

      {/* Prev */}
      {images.length > 1 && (
        <button
          aria-label="Foto anterior"
          onClick={e => { e.stopPropagation(); prev() }}
          className="absolute left-4 p-2 text-white/70 hover:text-white transition"
        >
          <ChevronLeftIcon className="w-8 h-8" aria-hidden="true" />
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
          aria-label="Foto siguiente"
          onClick={e => { e.stopPropagation(); next() }}
          className="absolute right-4 p-2 text-white/70 hover:text-white transition"
        >
          <ChevronRightIcon className="w-8 h-8" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

function FinancingCalculator({ precio }) {
  const [enganche, setEnganche]   = useState(20)
  const [meses, setMeses]         = useState(36)
  const [tasa, setTasa]           = useState(12)

  const { engancheAmt, mensualidad, total, interesTotal } = useMemo(() => {
    const engancheAmt  = (precio * enganche) / 100
    const monto        = precio - engancheAmt
    const tasaMensual  = tasa / 100 / 12
    const mensualidad  = tasaMensual === 0
      ? monto / meses
      : (monto * tasaMensual * Math.pow(1 + tasaMensual, meses)) / (Math.pow(1 + tasaMensual, meses) - 1)
    const total        = mensualidad * meses + engancheAmt
    const interesTotal = total - precio
    return { engancheAmt, mensualidad, total, interesTotal }
  }, [precio, enganche, meses, tasa])

  const fmt = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="mt-8 bg-gray-50 rounded-2xl p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-5">
        <CalculatorIcon className="w-5 h-5 text-red-500" />
        <h3 className="font-heading font-bold text-gray-900">Calculadora de financiamiento</h3>
      </div>

      <div className="space-y-4">
        {/* Enganche */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Enganche</label>
            <span className="text-xs font-bold text-gray-700">{enganche}% — {fmt(engancheAmt)}</span>
          </div>
          <input
            type="range" min={10} max={50} step={5}
            value={enganche}
            onChange={e => setEnganche(Number(e.target.value))}
            className="w-full accent-red-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>10%</span><span>50%</span>
          </div>
        </div>

        {/* Plazo */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Plazo</label>
          <div className="flex gap-2 flex-wrap">
            {[12, 24, 36, 48, 60].map(m => (
              <button
                key={m}
                onClick={() => setMeses(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  meses === m
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'
                }`}
              >
                {m} meses
              </button>
            ))}
          </div>
        </div>

        {/* Tasa */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tasa anual</label>
            <span className="text-xs font-bold text-gray-700">{tasa}%</span>
          </div>
          <input
            type="range" min={6} max={24} step={1}
            value={tasa}
            onChange={e => setTasa(Number(e.target.value))}
            className="w-full accent-red-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>6%</span><span>24%</span>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="mt-5 bg-white rounded-xl p-4 border border-gray-100">
        <p className="text-xs text-gray-400 mb-1">Pago mensual estimado</p>
        <p className="font-heading text-3xl font-bold text-red-600">{fmt(mensualidad)}</p>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span>Total: <strong className="text-gray-700">{fmt(total)}</strong></span>
          <span>Interés: <strong className="text-gray-700">{fmt(interesTotal)}</strong></span>
        </div>
        <p className="text-xs text-gray-400 mt-3">* Cálculo estimado. Consulta condiciones reales con tu financiera.</p>
      </div>
    </div>
  )
}

export default function AutoDetalle() {
  const { modelo } = useParams();
  const [auto, setAuto] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null) // null | index
  const [stickyVisible, setStickyVisible] = useState(false)
  const galleryRef = useRef(null)

  useEffect(() => {
    supabase
      .from('cars')
      .select('*')
      .eq('visible', true)
      .then(({ data }) => {
        const all = data ?? []
        const found = all.find(c => toSlug(c.modelo) === modelo);
        setAuto(found ?? null);

        if (found) {
          const others = all.filter(c => c.id !== found.id)
          const sameBrand = others.filter(c => c.marca === found.marca)
          const priceRange = others.filter(c =>
            c.marca !== found.marca &&
            Math.abs(Number(c.precio) - Number(found.precio)) < Number(found.precio) * 0.3
          )
          const picks = [...sameBrand, ...priceRange].slice(0, 3)
          setRelated(picks)
        }

        setLoading(false);
      });
  }, [modelo]);

  useEffect(() => {
    const el = galleryRef.current
    if (!el || !auto) return
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [auto])

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

  const msg       = encodeURIComponent(`Hola, me interesa el *${auto.marca} ${auto.modelo} ${auto.año}* en *${formatPrice(auto.precio)}*. ¿Está disponible?`)
  const waUrl     = `https://wa.me/522213411834?text=${msg}`
  const agendarMsg = encodeURIComponent(`Hola, me gustaría agendar una visita para ver el *${auto.marca} ${auto.modelo} ${auto.año}*. ¿Cuándo tienen disponibilidad?`)
  const agendarUrl = `https://wa.me/522213411834?text=${agendarMsg}`
  const shareWaMsg = encodeURIComponent(`Mira este auto: ${auto.marca} ${auto.modelo} ${auto.año} — ${formatPrice(auto.precio)}\n${window.location.href}`)
  const shareWaUrl = `https://wa.me/?text=${shareWaMsg}`

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Enlace copiado')
  }

  const seoImage = imagenes[0] ?? undefined
  const seoDesc  = `${auto.marca} ${auto.modelo} ${auto.año} — ${auto.kilometraje ? Number(auto.kilometraje).toLocaleString('es-MX') + ' km · ' : ''}${formatPrice(auto.precio)}. ${auto.descripcion?.slice(0, 100) ?? 'Vehículo seminuevo verificado en Puebla, México.'}`

  return (
    <>
      <StickyHeader auto={auto} waUrl={waUrl} visible={stickyVisible} />
      <div className="pb-20 lg:pb-0">
        <SEO
          title={`${auto.marca} ${auto.modelo} ${auto.año} en venta en Puebla`}
          description={seoDesc}
          image={seoImage}
          url={`/autos/${modelo}`}
          type="article"
        />

        {/* Gallery — ref para sticky header */}
        <div ref={galleryRef}>
          <DarkGallery imagenes={imagenes} onImageClick={setLightbox} />
        </div>

        {/* Quick facts band */}
        <div className="bg-red-600 px-4 sm:px-6 py-3 flex justify-around items-center flex-wrap gap-y-2">
          {[
            { label: 'Año',         value: auto.año },
            { label: 'Kilómetros',  value: auto.kilometraje ? Number(auto.kilometraje).toLocaleString('es-MX') : '—' },
            { label: 'Transmisión', value: auto.transmision ?? '—' },
            { label: 'Combustible', value: auto.combustible ?? '—' },
          ].map((item, i, arr) => (
            <Fragment key={item.label}>
              <div className="text-center text-white">
                <div className="text-sm font-bold">{item.value}</div>
                <div className="text-xs opacity-75 uppercase tracking-wider">{item.label}</div>
              </div>
              {i < arr.length - 1 && <div className="w-px h-5 bg-white/30" />}
            </Fragment>
          ))}
        </div>

        {/* Title + price + status */}
        <div className="px-4 sm:px-6 pt-5 pb-4 bg-white border-b border-gray-100 flex justify-between items-start gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {auto.estado && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[auto.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                  ● {STATUS_LABELS[auto.estado] ?? auto.estado}
                </span>
              )}
              <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">
                {auto.marca}
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
              {auto.modelo}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {auto.año}
              {auto.color ? ` · ${auto.color}` : ''}
              {auto.puertas ? ` · ${auto.puertas} puertas` : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-red-600 leading-tight">
              {formatPrice(auto.precio)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">MXN · Precio final</div>
            {/* Desktop CTAs */}
            <div className="hidden lg:flex flex-col gap-2 mt-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                <FaWhatsapp className="h-4 w-4" aria-hidden="true" /> Me interesa
              </a>
              <a
                href={agendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                Agendar visita
              </a>
              <div className="flex gap-2 mt-1">
                <a href={shareWaUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-green-300 text-xs text-gray-500 hover:text-green-700 transition-all">
                  <FaWhatsapp className="h-3.5 w-3.5" aria-hidden="true" /> Compartir
                </a>
                <button onClick={copyLink}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 text-xs text-gray-500 transition-all">
                  <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" /> Copiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Description + equipment */}
        {(auto.descripcion || auto.aire || auto.infoentretenimiento) && (
          <div className="px-4 sm:px-6 py-5 bg-white border-b-8 border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 bg-red-600 rounded-full shrink-0" aria-hidden="true" />
              <h2 className="text-base font-bold text-gray-900">Sobre este auto</h2>
            </div>
            {auto.descripcion && (
              <p className="text-sm text-gray-600 leading-relaxed">{auto.descripcion}</p>
            )}
            <EquipmentPills auto={auto} />
          </div>
        )}

        {/* Specs — temporary, will be redesigned in Task 5 */}
        {fichaItems.length > 0 && (
          <div className="px-4 sm:px-6 py-4 bg-white border-b border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              {fichaItems.map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculator */}
        {Number(auto.precio) > 0 && <FinancingCalculator precio={Number(auto.precio)} />}

        {/* Related cars */}
        {related.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map(car => (
                <Link
                  key={car.id}
                  to={`/autos/${toSlug(car.modelo)}`}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300"
                >
                  <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                    {car.imagenes?.[0] ? (
                      <img
                        src={car.imagenes[0]}
                        alt={`${car.marca} ${car.modelo}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">{car.marca}</p>
                    <h3 className="font-heading text-base font-bold text-gray-900 leading-snug">{car.modelo}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {car.año}{car.kilometraje ? ` · ${Number(car.kilometraje).toLocaleString('es-MX')} km` : ''}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="font-heading text-lg font-bold text-red-600">{formatPrice(car.precio)}</p>
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-red-500 transition-colors">
                        Ver más <ArrowRightIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightbox !== null && (
          <Lightbox
            images={imagenes}
            index={lightbox}
            onClose={() => setLightbox(null)}
          />
        )}
      </div>
    </>
  );
}

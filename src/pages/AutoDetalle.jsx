// src/pages/AutoDetalle.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import { FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { listAllPublicCars } from '../lib/publicCars'
import SEO from '../components/SEO'
import CarCard from '../components/CarCard'
import { formatPrice, toSlug } from '../lib/utils'
import { whatsappUrl } from '../lib/contact'
import { CAR_STATUS_LABELS as STATUS_LABELS, CAR_STATUS_COLORS as STATUS_COLORS } from '../lib/constants'

const EQUIPMENT_MAP = [
  { field: 'aire', label: 'Clima A/C' },
  { field: 'infoentretenimiento', label: 'Pantalla / multimedia' },
]

function StickyHeader({ auto, waUrl, visible }) {
  return (
    <div
      role="banner"
      aria-label="Encabezado fijo del vehículo"
      aria-hidden={!visible}
      {...(!visible ? { inert: '' } : {})}
      className={`fixed top-16 left-0 right-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur transition-[transform,opacity] duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/catalogo"
            className="flex shrink-0 items-center gap-1 text-xs text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden="true" /> Catálogo
          </Link>
          <div className="h-4 w-px shrink-0 bg-neutral-200" />
          <div className="min-w-0">
            <span className="truncate text-sm font-bold text-neutral-900">
              {auto.marca} {auto.modelo}
            </span>
            <span className="ml-2 text-xs text-neutral-400">
              {auto.año}
              {auto.kilometraje ? ` · ${Number(auto.kilometraje).toLocaleString('es-MX')} km` : ''}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden font-heading text-lg font-bold text-neutral-900 sm:block">
            {formatPrice(auto.precio)}
          </span>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#1ebe5b]"
          >
            <FaWhatsapp className="h-3.5 w-3.5" aria-hidden="true" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

/** Marketplace-style gallery: full-bleed main + arrows + filmstrip thumbs */
function PhotoGallery({ imagenes, onImageClick }) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(null)

  useEffect(() => {
    setCurrent(0)
  }, [imagenes])

  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + imagenes.length) % imagenes.length),
    [imagenes.length],
  )
  const next = useCallback(
    () => setCurrent((i) => (i + 1) % imagenes.length),
    [imagenes.length],
  )

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) (diff > 0 ? next() : prev())
    touchStartX.current = null
  }

  if (imagenes.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center bg-neutral-900 text-sm text-neutral-500">
        Sin imágenes disponibles
      </div>
    )
  }

  return (
    <div className="bg-neutral-950">
      <div className="relative">
        <button
          type="button"
          aria-label="Ampliar imagen"
          className="relative block w-full cursor-zoom-in focus:outline-none"
          onClick={() => onImageClick?.(current)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={imagenes[current]}
            alt={`Foto ${current + 1} de ${imagenes.length}`}
            loading="eager"
            className="aspect-[16/10] w-full object-cover transition-opacity duration-300 lg:aspect-[4/3]"
          />
          <span className="absolute bottom-3 right-3 bg-black/65 px-2.5 py-1 text-xs font-semibold text-white">
            {current + 1} / {imagenes.length}
          </span>
        </button>

        {imagenes.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={prev}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-black/50 p-2 text-white transition hover:bg-black/70 sm:left-3"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={next}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-black/50 p-2 text-white transition hover:bg-black/70 sm:right-3"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {imagenes.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto px-2 py-2 scrollbar-thin">
          {imagenes.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              aria-label={`Foto ${i + 1}`}
              aria-pressed={i === current}
              onClick={() => setCurrent(i)}
              className={`h-14 w-20 shrink-0 overflow-hidden border-2 transition sm:h-16 sm:w-24 ${
                i === current
                  ? 'border-red-500 opacity-100'
                  : 'border-transparent opacity-55 hover:opacity-90'
              }`}
            >
              <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Lightbox({ images, index, onClose }) {
  const [current, setCurrent] = useState(index)
  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + images.length) % images.length),
    [images.length],
  )
  const next = useCallback(
    () => setCurrent((i) => (i + 1) % images.length),
    [images.length],
  )

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92" onClick={onClose}>
      <button
        aria-label="Cerrar galería"
        onClick={onClose}
        className="absolute right-4 top-4 p-2 text-white/70 transition hover:text-white"
      >
        <XMarkIcon className="h-7 w-7" aria-hidden="true" />
      </button>
      <span className="absolute left-1/2 top-5 -translate-x-1/2 text-sm text-white/60">
        {current + 1} / {images.length}
      </span>
      {images.length > 1 && (
        <button
          aria-label="Foto anterior"
          onClick={(e) => {
            e.stopPropagation()
            prev()
          }}
          className="absolute left-3 p-2 text-white/70 transition hover:text-white sm:left-6"
        >
          <ChevronLeftIcon className="h-8 w-8" aria-hidden="true" />
        </button>
      )}
      <img
        src={images[current]}
        alt={`Imagen ${current + 1}`}
        className="max-h-[90vh] max-w-[92vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <button
          aria-label="Foto siguiente"
          onClick={(e) => {
            e.stopPropagation()
            next()
          }}
          className="absolute right-3 p-2 text-white/70 transition hover:text-white sm:right-6"
        >
          <ChevronRightIcon className="h-8 w-8" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

function FinancingCalculator({ precio }) {
  const [enganche, setEnganche] = useState(20)
  const [meses, setMeses] = useState(36)
  const [tasa, setTasa] = useState(12)

  const { engancheAmt, mensualidad, total, interesTotal } = useMemo(() => {
    const engancheAmt = (precio * enganche) / 100
    const monto = precio - engancheAmt
    const tasaMensual = tasa / 100 / 12
    const mensualidad =
      tasaMensual === 0
        ? monto / meses
        : (monto * tasaMensual * Math.pow(1 + tasaMensual, meses)) /
          (Math.pow(1 + tasaMensual, meses) - 1)
    const total = mensualidad * meses + engancheAmt
    const interesTotal = total - precio
    return { engancheAmt, mensualidad, total, interesTotal }
  }, [precio, enganche, meses, tasa])

  const fmt = (n) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <section className="border-t border-neutral-200 pt-6">
      <h2 className="font-heading text-xl font-bold text-neutral-900">Calcula tu pago</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-neutral-500">Enganche</span>
              <span className="font-bold text-neutral-800">
                {enganche}% — {fmt(engancheAmt)}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={enganche}
              onChange={(e) => setEnganche(Number(e.target.value))}
              className="w-full cursor-pointer accent-red-600"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Plazo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[12, 24, 36, 48, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMeses(m)}
                  aria-pressed={meses === m}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    meses === m
                      ? 'bg-red-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {m} m
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-neutral-500">Tasa anual</span>
              <span className="font-bold text-neutral-800">{tasa}%</span>
            </div>
            <input
              type="range"
              min={6}
              max={24}
              step={1}
              value={tasa}
              onChange={(e) => setTasa(Number(e.target.value))}
              className="w-full cursor-pointer accent-red-600"
            />
          </div>
        </div>

        <div className="bg-neutral-950 p-5 text-white">
          <p className="text-xs text-neutral-400">Pago mensual estimado</p>
          <p className="font-heading mt-1 text-3xl font-bold leading-none sm:text-4xl">
            {fmt(mensualidad)}
            <span className="ml-1 text-base font-normal text-neutral-400">/mes</span>
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-xs">
            <div>
              <p className="text-neutral-500">Total</p>
              <p className="mt-0.5 font-semibold text-neutral-200">{fmt(total)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Interés</p>
              <p className="mt-0.5 font-semibold text-neutral-200">{fmt(interesTotal)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Tasa</p>
              <p className="mt-0.5 font-semibold text-neutral-200">{tasa}%</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-neutral-600">
            * Estimado. Consulta condiciones reales con tu financiera.
          </p>
        </div>
      </div>
    </section>
  )
}

function formatFichaValue(value) {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  return value
}

export default function AutoDetalle() {
  const { modelo } = useParams()
  const [auto, setAuto] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)
  const [stickyVisible, setStickyVisible] = useState(false)
  const galleryRef = useRef(null)

  useEffect(() => {
    listAllPublicCars().then(({ data }) => {
      const all = data ?? []
      const found = all.find((c) => toSlug(c.modelo) === modelo)
      setAuto(found ?? null)
      if (found) {
        const others = all.filter((c) => c.id !== found.id)
        const sameBrand = others.filter((c) => c.marca === found.marca)
        const priceRange = others.filter(
          (c) =>
            c.marca !== found.marca &&
            Math.abs(Number(c.precio) - Number(found.precio)) < Number(found.precio) * 0.3,
        )
        setRelated([...sameBrand, ...priceRange].slice(0, 3))
      }
      setLoading(false)
    })
  }, [modelo])

  useEffect(() => {
    const el = galleryRef.current
    if (!el || !auto) return
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [auto])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="aspect-[4/3] animate-pulse bg-neutral-200 lg:col-span-3" />
          <div className="space-y-3 lg:col-span-2">
            <div className="h-8 w-3/4 animate-pulse bg-neutral-200" />
            <div className="h-10 w-1/2 animate-pulse bg-neutral-200" />
            <div className="h-24 animate-pulse bg-neutral-200" />
          </div>
        </div>
      </div>
    )
  }

  if (!auto) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">Auto no encontrado</h2>
        <p className="mt-2 text-neutral-500">Este vehículo no está disponible o ya fue vendido.</p>
        <Link
          to="/catalogo"
          className="mt-6 inline-flex items-center gap-2 bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Ver catálogo
        </Link>
      </div>
    )
  }

  const imagenes = Array.isArray(auto.imagenes) && auto.imagenes.length > 0 ? auto.imagenes : []
  const statusKey = auto.estado || auto.status

  const fichaItems = [
    { label: 'Marca', value: auto.marca },
    { label: 'Modelo', value: auto.modelo },
    { label: 'Año', value: auto.año },
    {
      label: 'Kilometraje',
      value: auto.kilometraje != null ? `${Number(auto.kilometraje).toLocaleString('es-MX')} km` : null,
    },
    { label: 'Transmisión', value: auto.transmision },
    { label: 'Combustible', value: auto.combustible },
    { label: 'Motor', value: auto.motor },
    { label: 'Tracción', value: auto.traccion },
    { label: 'Color', value: auto.color },
    { label: 'Puertas', value: auto.puertas },
    { label: 'Aire A/C', value: auto.aire },
    { label: 'Multimedia', value: auto.infoentretenimiento },
  ].filter((item) => item.value != null && item.value !== '')

  const quickSpecs = [
    { label: 'Año', value: auto.año },
    {
      label: 'Km',
      value: auto.kilometraje != null ? Number(auto.kilometraje).toLocaleString('es-MX') : '—',
    },
    { label: 'Caja', value: auto.transmision || '—' },
    { label: 'Comb.', value: auto.combustible || '—' },
  ]

  const msg = `Hola, me interesa el *${auto.marca} ${auto.modelo} ${auto.año}* en *${formatPrice(auto.precio)}*. ¿Está disponible?`
  const waUrl = whatsappUrl(msg)
  const agendarUrl = whatsappUrl(
    `Hola, me gustaría agendar una visita para ver el *${auto.marca} ${auto.modelo} ${auto.año}*. ¿Cuándo tienen disponibilidad?`,
  )
  const shareWaUrl = `https://wa.me/?text=${encodeURIComponent(
    `Mira este auto: ${auto.marca} ${auto.modelo} ${auto.año} — ${formatPrice(auto.precio)}\n${typeof window !== 'undefined' ? window.location.href : ''}`,
  )}`

  function copyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success('Enlace copiado'))
      .catch(() => toast.error('No se pudo copiar el enlace'))
  }

  const equipment = EQUIPMENT_MAP.filter((item) => Boolean(auto?.[item.field]))

  return (
    <>
      <StickyHeader auto={auto} waUrl={waUrl} visible={stickyVisible} />
      <div className="pb-24 lg:pb-10">
        <SEO
          title={`${auto.marca} ${auto.modelo} ${auto.año} en venta en Puebla`}
          description={`${auto.marca} ${auto.modelo} ${auto.año} — ${
            auto.kilometraje ? Number(auto.kilometraje).toLocaleString('es-MX') + ' km · ' : ''
          }${formatPrice(auto.precio)}. ${auto.descripcion?.slice(0, 100) ?? 'Seminuevo en Puebla.'}`}
          image={imagenes[0]}
          url={`/autos/${modelo}`}
          type="article"
        />

        {/* Breadcrumb — compact */}
        <nav className="border-b border-neutral-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-hidden px-4 py-2.5 text-xs text-neutral-400 sm:px-6">
            <Link to="/catalogo" className="flex shrink-0 items-center gap-1 hover:text-red-600">
              <ArrowLeftIcon className="h-3 w-3" /> Catálogo
            </Link>
            <span>/</span>
            <span className="shrink-0">{auto.marca}</span>
            <span>/</span>
            <span className="truncate font-medium text-neutral-600">
              {auto.modelo} {auto.año}
            </span>
          </div>
        </nav>

        {/* Main: gallery + buy panel (Kavak / ML density) */}
        <div className="mx-auto grid max-w-7xl lg:grid-cols-5 lg:gap-0">
          <div ref={galleryRef} className="lg:col-span-3">
            <PhotoGallery imagenes={imagenes} onImageClick={setLightbox} />
          </div>

          <aside className="flex flex-col border-t border-neutral-200 bg-white lg:col-span-2 lg:border-l lg:border-t-0">
            <div className="flex flex-1 flex-col p-5 sm:p-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2">
                {statusKey && (
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 ${
                      STATUS_COLORS[statusKey] ?? 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {STATUS_LABELS[statusKey] ?? statusKey}
                  </span>
                )}
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {auto.marca}
                </span>
              </div>

              <h1 className="font-heading mt-2 text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
                {auto.modelo}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {[auto.año, auto.color, auto.puertas ? `${auto.puertas} puertas` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>

              <p className="font-heading mt-4 text-3xl font-bold leading-none text-neutral-900 sm:text-4xl">
                {formatPrice(auto.precio)}
              </p>
              <p className="mt-1 text-xs text-neutral-400">Precio en MXN</p>

              {/* Compact key specs */}
              <div className="mt-5 grid grid-cols-4 gap-px overflow-hidden border border-neutral-200 bg-neutral-200">
                {quickSpecs.map((s) => (
                  <div key={s.label} className="bg-neutral-50 px-2 py-2.5 text-center">
                    <p className="font-heading text-sm font-bold text-neutral-900 sm:text-base">
                      {s.value}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] py-3 text-sm font-bold text-white transition-colors hover:bg-[#1ebe5b]"
                >
                  <FaWhatsapp className="h-4 w-4" /> Me interesa
                </a>
                <a
                  href={agendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-red-600 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
                >
                  Agendar visita
                </a>
                <div className="flex gap-2">
                  <a
                    href={shareWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 border border-neutral-200 py-2 text-xs text-neutral-500 hover:border-green-300 hover:text-green-700"
                  >
                    <FaWhatsapp className="h-3.5 w-3.5" /> Compartir
                  </a>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex flex-1 items-center justify-center gap-1.5 border border-neutral-200 py-2 text-xs text-neutral-500 hover:border-neutral-300"
                  >
                    <LinkIcon className="h-3.5 w-3.5" /> Copiar
                  </button>
                </div>
              </div>

              {auto.descripcion && (
                <div className="mt-6 border-t border-neutral-100 pt-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Sobre este auto
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{auto.descripcion}</p>
                  {equipment.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {equipment.map((p) => (
                        <span
                          key={p.field}
                          className="bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600"
                        >
                          {p.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Ficha técnica — dense grid */}
        {fichaItems.length > 0 && (
          <section className="border-t border-neutral-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
              <h2 className="font-heading text-xl font-bold text-neutral-900 sm:text-2xl">
                Ficha técnica
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3 lg:grid-cols-4">
                {fichaItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-baseline justify-between gap-3 border-b border-neutral-100 py-2.5"
                  >
                    <dt className="text-xs text-neutral-400">{item.label}</dt>
                    <dd className="text-right text-sm font-semibold text-neutral-900">
                      {formatFichaValue(item.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {/* Calculator */}
        {Number(auto.precio) > 0 && (
          <div className="border-t border-neutral-200 bg-neutral-50">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
              <FinancingCalculator precio={Number(auto.precio)} />
            </div>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-neutral-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
              <div className="mb-6 flex items-end justify-between gap-4">
                <h2 className="font-heading text-xl font-bold text-neutral-900 sm:text-2xl">
                  También te puede interesar
                </h2>
                <Link to="/catalogo" className="text-sm font-semibold text-red-600 hover:text-red-700">
                  Ver catálogo →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
                {related.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            </div>
          </section>
        )}

        {lightbox !== null && (
          <Lightbox images={imagenes} index={lightbox} onClose={() => setLightbox(null)} />
        )}
      </div>

      {/* Mobile sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-neutral-200 bg-white px-3 py-2.5 lg:hidden"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
      >
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 bg-[#25D366] py-3 text-sm font-bold text-white hover:bg-[#1ebe5b]"
        >
          <FaWhatsapp className="h-4 w-4" /> WhatsApp
        </a>
        <a
          href={agendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700"
        >
          Agendar
        </a>
      </div>
    </>
  )
}

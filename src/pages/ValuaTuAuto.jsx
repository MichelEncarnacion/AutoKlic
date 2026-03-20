import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  ArrowRightIcon, ArrowLeftIcon, InformationCircleIcon,
  CheckIcon, ChartBarIcon,
} from '@heroicons/react/24/outline'

// 2025 Mexican market MSRP by brand (fallback if ML returns no results)
const BRAND_BASE = {
  'Chevrolet': 305000,  'Nissan': 295000,  'SEAT': 310000,   'Kia': 320000,
  'Hyundai': 315000,    'Renault': 290000, 'Fiat': 270000,   'Dodge': 300000,
  'Suzuki': 280000,     'Volkswagen': 420000, 'Honda': 460000, 'Toyota': 480000,
  'Mazda': 440000,      'Ford': 410000,    'Peugeot': 400000, 'Citroën': 390000,
  'Mitsubishi': 420000, 'Subaru': 510000,  'Jeep': 680000,   'GMC': 720000,
  'Ram': 700000,        'Acura': 750000,   'Infiniti': 780000, 'BMW': 1100000,
  'Mercedes-Benz': 1150000, 'Audi': 1050000, 'Volvo': 980000, 'Lexus': 950000,
  'Cadillac': 1000000,  'Land Rover': 1350000, 'Porsche': 1800000,
}
const DEFAULT_BASE   = 350000
const BUYING_MARGIN  = 0.78
const BRANDS         = Object.keys(BRAND_BASE).sort()

const CONDITIONS = [
  { value: 'excelente', label: 'Excelente',  desc: 'Como nuevo, sin golpes ni rayones',    mult: 1.08 },
  { value: 'bueno',     label: 'Bueno',      desc: 'Detalles menores, bien mantenido',      mult: 0.95 },
  { value: 'regular',   label: 'Regular',    desc: 'Requiere algunos arreglos estéticos',   mult: 0.78 },
  { value: 'danos',     label: 'Con daños',  desc: 'Golpes mayores, accidentes o mecánica', mult: 0.58 },
]

// ── Mercado Libre via server-side proxy ─────────────────────────────────────
async function fetchMLPrices(marca, modelo, año) {
  try {
    const params = new URLSearchParams({ marca, modelo, año })
    const res    = await fetch(`/api/car-price?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.found) return null
    return { median: data.median, count: data.count }
  } catch {
    return null
  }
}

// ── Formula fallback (depreciation model) ──────────────────────────────────
function formulaBase(marca, año, precioLista) {
  const age  = new Date().getFullYear() - Number(año)
  const base = precioLista && Number(precioLista) > 0
    ? Number(precioLista)
    : (BRAND_BASE[marca] ?? DEFAULT_BASE)

  let value = base
  for (let i = 0; i < age; i++) {
    const rate = i === 0 ? 0.25 : i === 1 ? 0.18 : i <= 3 ? 0.14 : i <= 5 ? 0.11 : 0.08
    value *= (1 - rate)
  }
  return value
}

// ── Adjustments on top of market price ─────────────────────────────────────
function applyAdjustments(basePrice, data) {
  const { año, kilometraje, condicion, transmision, duenos, accidente, servicio, factura } = data
  let value = basePrice

  // Km vs expected
  const age        = new Date().getFullYear() - Number(año)
  const expectedKm = age * 15000
  const kmDiff     = Number(kilometraje) - expectedKm
  const kmAdj = kmDiff > 0
    ? Math.max(0.72, 1 - (kmDiff / 10000) * 0.025)
    : Math.min(1.08, 1 + (Math.abs(kmDiff) / 10000) * 0.008)
  value *= kmAdj

  // Condition
  value *= CONDITIONS.find(c => c.value === condicion)?.mult ?? 1

  // Transmission
  if (transmision === 'manual') value *= 0.95

  // Owners
  if (duenos === '1')    value *= 1.05
  if (duenos === '3mas') value *= 0.88

  // Accidents
  if (accidente === 'menor') value *= 0.90
  if (accidente === 'mayor') value *= 0.75

  // Service
  if (servicio === 'si')  value *= 1.03
  if (servicio === 'no')  value *= 0.95

  // Invoice
  if (factura === 'si')  value *= 1.03
  if (factura === 'no')  value *= 0.98

  return Math.max(value, 30000)
}

function buildResult(adjustedValue, source) {
  const r = (n, factor = 1) => Math.round(adjustedValue * factor / 1000) * 1000
  return {
    marketLow:  r(adjustedValue, 0.93),
    marketMid:  r(adjustedValue, 1),
    marketHigh: r(adjustedValue, 1.07),
    offerLow:   r(adjustedValue, BUYING_MARGIN * 0.95),
    offerMid:   r(adjustedValue, BUYING_MARGIN),
    offerHigh:  r(adjustedValue, BUYING_MARGIN * 1.05),
    source,
  }
}

function fmt(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

const currentYear = new Date().getFullYear()
const years       = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i)
const inputClass  = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all'
const labelClass  = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'

function RadioGroup({ label, name, options, register, rules, error, watch }) {
  const val = watch(name)
  return (
    <div>
      <p className={labelClass}>{label} *</p>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <label key={o.value} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${
            val === o.value ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}>
            <input type="radio" value={o.value} {...register(name, rules)} className="sr-only" />
            {val === o.value && <CheckIcon className="w-3.5 h-3.5" />}
            {o.label}
          </label>
        ))}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  )
}

export default function ValuaTuAuto() {
  const [step, setStep]       = useState(1)
  const [result, setResult]   = useState(null)
  const [formData, setFormData] = useState(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const condicion = watch('condicion')
  const req       = { required: 'Requerido' }

  async function onSubmit(data) {
    setLoading(true)

    // Try Mercado Libre first
    const ml = await fetchMLPrices(data.marca, data.modelo, data.año)

    let marketBase, source
    if (ml) {
      marketBase = ml.median
      source     = { type: 'ml', count: ml.count }
    } else {
      marketBase = formulaBase(data.marca, data.año, data.precioLista)
      source     = { type: 'formula' }
    }

    const adjusted = applyAdjustments(marketBase, data)
    setResult(buildResult(adjusted, source))
    setFormData(data)
    setLoading(false)
    setStep(2)
  }

  if (step === 2 && result) {
    return <Results result={result} formData={formData} onBack={() => setStep(1)} />
  }

  return (
    <section className="max-w-2xl mx-auto px-4 py-12">

      <div className="text-center mb-10">
        <p className="flex items-center justify-center gap-2 text-red-500 text-xs font-semibold tracking-widest uppercase mb-3">
          <span className="w-6 h-px bg-red-500" />Valoración gratuita<span className="w-6 h-px bg-red-500" />
        </p>
        <h1 className="font-heading text-4xl font-bold text-gray-900 mb-3">¿Cuánto vale tu auto?</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
          Completa los datos de tu vehículo y obtén una estimación basada en precios reales del mercado.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Basic info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Datos del vehículo</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Marca *</label>
              <select {...register('marca', req)} className={inputClass}>
                <option value="">Selecciona marca</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                <option value="Otra">Otra</option>
              </select>
              {errors.marca && <p className="text-red-500 text-xs mt-1">{errors.marca.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Modelo *</label>
              <input type="text" placeholder="Ej. Aveo, Sentra, Civic..." {...register('modelo', req)} className={inputClass} />
              {errors.modelo && <p className="text-red-500 text-xs mt-1">{errors.modelo.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Año *</label>
              <select {...register('año', req)} className={inputClass}>
                <option value="">Selecciona año</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors.año && <p className="text-red-500 text-xs mt-1">{errors.año.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Kilometraje *</label>
              <input type="number" placeholder="Ej. 45000" min={0}
                {...register('kilometraje', { ...req, min: { value: 0, message: 'Mínimo 0' } })}
                className={inputClass} />
              {errors.kilometraje && <p className="text-red-500 text-xs mt-1">{errors.kilometraje.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Precio de lista nuevo <span className="normal-case text-gray-400 font-normal">(opcional)</span>
              </label>
              <input type="number" placeholder="Ej. 305000 — mejora la precisión si ML no encuentra tu modelo"
                min={0} {...register('precioLista')} className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">Solo se usa si no encontramos tu auto en Mercado Libre.</p>
            </div>
          </div>
        </div>

        {/* Condition */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider mb-4">Estado general *</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {CONDITIONS.map(c => (
              <label key={c.value} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                condicion === c.value ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" value={c.value} {...register('condicion', req)} className="sr-only" />
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                  condicion === c.value ? 'border-red-500 bg-red-500' : 'border-gray-300'
                }`}>
                  {condicion === c.value && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{c.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.condicion && <p className="text-red-500 text-xs mt-2">{errors.condicion.message}</p>}
        </div>

        {/* Extra details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Detalles adicionales</h2>
          <RadioGroup label="Transmisión" name="transmision" watch={watch} register={register} rules={req} error={errors.transmision}
            options={[{ value: 'automatica', label: 'Automática' }, { value: 'manual', label: 'Manual' }]} />
          <RadioGroup label="Número de dueños" name="duenos" watch={watch} register={register} rules={req} error={errors.duenos}
            options={[{ value: '1', label: '1 dueño' }, { value: '2', label: '2 dueños' }, { value: '3mas', label: '3 o más' }]} />
          <RadioGroup label="Historial de accidentes" name="accidente" watch={watch} register={register} rules={req} error={errors.accidente}
            options={[{ value: 'ninguno', label: 'Sin accidentes' }, { value: 'menor', label: 'Accidente menor' }, { value: 'mayor', label: 'Accidente mayor' }]} />
          <RadioGroup label="Servicio al corriente" name="servicio" watch={watch} register={register} rules={req} error={errors.servicio}
            options={[{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }]} />
          <RadioGroup label="Factura original" name="factura" watch={watch} register={register} rules={req} error={errors.factura}
            options={[{ value: 'si', label: 'Sí, tengo factura' }, { value: 'no', label: 'No tengo factura' }]} />
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-4 rounded-xl text-sm font-semibold tracking-wide transition-all hover:shadow-lg hover:shadow-red-600/20">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Consultando precios de mercado...
            </>
          ) : (
            <>Ver estimación de precio<ArrowRightIcon className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </section>
  )
}

function Results({ result, formData, onBack }) {
  const { marketLow, marketMid, marketHigh, offerLow, offerMid, offerHigh, source } = result

  return (
    <section className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8 group">
        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Modificar datos
      </button>

      <div className="text-center mb-8">
        <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">
          {formData.marca} {formData.modelo} · {formData.año} · {Number(formData.kilometraje).toLocaleString('es-MX')} km
        </p>
        <h2 className="font-heading text-3xl font-bold text-gray-900">Resultado de tu valoración</h2>

        {/* Data source badge */}
        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          <ChartBarIcon className="w-3.5 h-3.5" />
          {source.type === 'ml'
            ? `Basado en ${source.count} anuncios reales de Mercado Libre`
            : 'Estimado por modelo de depreciación (sin datos ML suficientes)'}
        </div>
      </div>

      {/* Market value */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Valor de mercado estimado</p>
        <p className="font-heading text-3xl font-bold text-gray-800 mb-1">{fmt(marketMid)}</p>
        <p className="text-sm text-gray-400">
          Rango: <span className="font-semibold text-gray-600">{fmt(marketLow)}</span> — <span className="font-semibold text-gray-600">{fmt(marketHigh)}</span>
        </p>
      </div>

      {/* Buying offer */}
      <div className="bg-red-600 rounded-2xl p-6 mb-4 text-white">
        <p className="text-xs font-semibold text-red-200 uppercase tracking-wider mb-1">Oferta de compra AutoKlic</p>
        <p className="font-heading text-4xl font-bold mb-1">{fmt(offerMid)}</p>
        <p className="text-sm text-red-200">
          Rango: <span className="font-semibold text-white">{fmt(offerLow)}</span> — <span className="font-semibold text-white">{fmt(offerHigh)}</span>
        </p>
        <p className="text-xs text-red-200 mt-3">Oferta sujeta a inspección física del vehículo.</p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
        <InformationCircleIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Estas cifras son <strong>estimaciones aproximadas</strong> basadas en {source.type === 'ml' ? 'anuncios activos en Mercado Libre' : 'modelos de depreciación'} y los datos declarados. El precio final se determina tras la <strong>inspección física</strong> del vehículo por un asesor de AutoKlic.
        </p>
      </div>

      {/* CTA */}
      <Link to="/vende-tu-auto"
        className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl text-sm font-semibold tracking-wide transition-all hover:shadow-lg hover:shadow-red-600/20 mb-6">
        Acepta la oferta — Completa tu información
        <ArrowRightIcon className="w-4 h-4" />
      </Link>

      {/* What's next */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">¿Qué sigue?</h3>
        <div className="space-y-3">
          {[
            'Completa el formulario con tus datos de contacto',
            'Un asesor de AutoKlic se comunica contigo a la brevedad',
            'Coordinamos una inspección física del vehículo',
            'Recibes una oferta formal y cerramos el trato',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
              <p className="text-sm text-gray-600 mt-0.5">{s}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { api } from './api'
import { MOCK_CARS } from '../data/mockCars'

/**
 * @typedef {Object} PublicCar
 * @property {string} id
 * @property {string} marca
 * @property {string} modelo
 * @property {number} año
 * @property {number} precio
 * @property {number|null} [kilometraje]
 * @property {string} transmision
 * @property {string[]} imagenes
 * @property {string} status
 * @property {string} [estado]
 * @property {boolean} visible
 */

function withEstado(car) {
  return { ...car, estado: car.estado ?? car.status }
}

function sortCars(cars, sort = 'newest') {
  const list = [...cars]
  switch (sort) {
    case 'price_asc':
      return list.sort((a, b) => a.precio - b.precio)
    case 'price_desc':
      return list.sort((a, b) => b.precio - a.precio)
    case 'km_asc':
      return list.sort((a, b) => (a.kilometraje ?? 0) - (b.kilometraje ?? 0))
    case 'year_desc':
      return list.sort((a, b) => b.año - a.año)
    default:
      return list.sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      )
  }
}

function filterMockCars(params = {}) {
  let cars = MOCK_CARS.map(withEstado).filter((c) => c.visible !== false)

  if (params.marca) cars = cars.filter((c) => c.marca === params.marca)
  if (params.transmision) cars = cars.filter((c) => c.transmision === params.transmision)
  if (params.minPrecio) cars = cars.filter((c) => c.precio >= Number(params.minPrecio))
  if (params.maxPrecio) cars = cars.filter((c) => c.precio <= Number(params.maxPrecio))
  if (params.minAño) cars = cars.filter((c) => c.año >= Number(params.minAño))
  if (params.maxAño) cars = cars.filter((c) => c.año <= Number(params.maxAño))
  if (params.modelo) cars = cars.filter((c) => c.modelo === params.modelo)

  cars = sortCars(cars, params.sort || 'newest')

  const total = cars.length
  const offset = Number(params.offset || 0)
  if (params.limit != null && params.limit !== '') {
    const limit = Number(params.limit)
    cars = cars.slice(offset, offset + limit)
  }

  return { data: cars, count: total, fromMock: true }
}

/**
 * Public car list: uses API when the DB has inventory; otherwise demo mocks
 * so landing/catálogo are usable before phpMyAdmin seed or admin uploads.
 */
export async function listPublicCars(params = {}) {
  const { data, error, count } = await api.cars.list({ public: 1, ...params })

  if (!error && Array.isArray(data) && (count > 0 || data.length > 0)) {
    return {
      data: data.map(withEstado),
      count: count ?? data.length,
      fromMock: false,
      error: null,
    }
  }

  // Empty DB or network blip with empty payload → demo inventory
  if (!error || count === 0 || (Array.isArray(data) && data.length === 0)) {
    return filterMockCars(params)
  }

  return { data: [], count: 0, fromMock: false, error }
}

/** All public cars (no pagination) — for detalle / filter option lists. */
export async function listAllPublicCars() {
  const { data, error, count } = await api.cars.list({ public: 1 })
  if (!error && Array.isArray(data) && (count > 0 || data.length > 0)) {
    return { data: data.map(withEstado), fromMock: false, error: null }
  }
  return {
    data: MOCK_CARS.map(withEstado).filter((c) => c.visible !== false),
    fromMock: true,
    error: null,
  }
}
